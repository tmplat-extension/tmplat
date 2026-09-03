import { aggregate, allFulfilled } from 'allfulfilled';
import { type ActionService, ActionServiceToken } from 'extension/common/action/action.service';
import { type DataInstallContext } from 'extension/common/data/data-install-context.model';
import { type DataInstaller, DataInstallerToken } from 'extension/common/data/data-installer';
import { type DataUpdateContext } from 'extension/common/data/data-update-context.model';
import { type DataUpdater, DataUpdaterToken } from 'extension/common/data/data-updater';
import { type DataService, DataServiceToken } from 'extension/common/data/data.service';
import {
  type DataMigrationService,
  DataMigrationServiceToken,
} from 'extension/common/data/migration/data-migration.service';
import { MigrationPhase } from 'extension/common/data/migration/migration-phase.enum';
import { inject, injectable, multiInject } from 'extension/common/di';
import { type ExtensionInfo, ExtensionInfoToken } from 'extension/common/extension-info';
import { type ExtensionVersion } from 'extension/common/extension-version';
import { type IntlService, IntlServiceToken } from 'extension/common/intl/intl.service';
import { type Logger } from 'extension/common/logging/logger';
import { type LoggingService, LoggingServiceToken } from 'extension/common/logging/logging.service';
import { type NotificationService, NotificationServiceToken } from 'extension/common/notification/notification.service';
import { isHomepageUrl, isInjectableUrl } from 'extension/common/url.utils';
import { diffVersions } from 'extension/common/version/version.utils';
import { type ContextMenuService, ContextMenuServiceToken } from 'extension/context-menu/context-menu.service';
import { type Tab } from 'extension/tab/tab.model';
import { type TabService, TabServiceToken } from 'extension/tab/tab.service';
import {
  type TemplateShortcutBroadcaster,
  TemplateShortcutBroadcasterToken,
} from 'extension/template/template-shortcut-broadcaster';

const ExtensionManagerName = 'ExtensionManager';

export const ExtensionManagerToken = Symbol(ExtensionManagerName);

@injectable()
export class ExtensionManager {
  private readonly logger: Logger;

  constructor(
    @inject(ActionServiceToken) private readonly actionService: ActionService,
    @inject(ContextMenuServiceToken) private readonly contextMenuService: ContextMenuService,
    @inject(DataServiceToken) private readonly dataService: DataService,
    @multiInject(DataInstallerToken) private readonly dataInstallers: DataInstaller[],
    @inject(DataMigrationServiceToken) private readonly dataMigrationService: DataMigrationService,
    @multiInject(DataUpdaterToken) private readonly dataUpdaters: DataUpdater[],
    @inject(ExtensionInfoToken) private readonly extensionInfo: ExtensionInfo,
    @inject(IntlServiceToken) private readonly intl: IntlService,
    @inject(LoggingServiceToken) logging: LoggingService,
    @inject(NotificationServiceToken) private readonly notificationService: NotificationService,
    @inject(TabServiceToken) private readonly tabService: TabService,
    @inject(TemplateShortcutBroadcasterToken) private readonly templateShortcutBroadcaster: TemplateShortcutBroadcaster,
  ) {
    this.logger = logging.getLogger(ExtensionManagerName);
  }

  async install({ finalize = true, silent = false }: ExtensionManagerInstallOptions = {}) {
    if (!silent) {
      this.logger.info('Installing extension...');
    }

    const context: DataInstallContext = {
      dataService: this.dataService,
      extensionInfo: this.extensionInfo,
      version: this.extensionInfo.getVersion(),
    };

    // Every installer that failed is worth reporting here, since install is a one-shot operation and this error is
    // only ever logged, so the default aggregation is kept - with an explicit message, as `AggregateError` defaults
    // to an empty one.
    await allFulfilled(
      this.dataInstallers.map((dataInstaller) => dataInstaller.install(context)),
      aggregate('One or more data installers failed'),
    );

    if (finalize) {
      await this.executeScriptsInAllTabs();
      await this.actionService.update();
      await this.contextMenuService.update();
    }

    if (!silent) {
      this.logger.info(`Installed ${this.intl.getMessage('app_name')} v${this.extensionInfo.getVersion(true)}`);
    }
  }

  async migrate(oldVersion: ExtensionVersion) {
    if (await this.dataMigrationService.advanceMigrationPhase(oldVersion, MigrationPhase.Pending)) {
      this.logger.info('Ensuring extension installed...');

      await this.install({ finalize: false, silent: true });

      const version = this.extensionInfo.getVersion();

      this.logger.info(`Updating extension from v${oldVersion} to v${version}`);

      await this.update(oldVersion, { finalize: true, openChangeLog: false, silent: true });
    }

    return this.dataMigrationService.initiateMigration(oldVersion);
  }

  async reload() {
    this.logger.info('Reloading extension...');

    await this.executeScriptsInAllTabs();
    await this.actionService.update();
    await this.contextMenuService.update();
  }

  async run() {
    browser.runtime.onInstalled.addListener(this.onInstall.bind(this));
    /*
     * This listener does nothing itself, but it must exist. An MV3 service worker only runs when an event it has
     * subscribed to fires, so without `onStartup` the worker may not start at all when the browser does - and the
     * action state below would then only be refreshed once the user had already clicked the action, by which point
     * they would have hit the `default_popup` that Chrome restores from the manifest on restart.
     */
    browser.runtime.onStartup.addListener(() => {
      this.logger.debug('Browser started');
    });

    this.actionService.listen();
    this.contextMenuService.listen();
    this.notificationService.listen();
    this.templateShortcutBroadcaster.listen();

    await this.restrictLocalStorageAccess();
    await this.refreshActionState();

    this.logger.info(`Started ${this.intl.getMessage('app_name')} v${this.extensionInfo.getVersion(true)}`);
  }

  /**
   * Chrome restores the `default_popup` declared in the manifest whenever the extension is (re)started, discarding
   * any {@link browser.action.setPopup} call made during a previous session. The action state must therefore be
   * reapplied on every service worker start, not just on install/update, or a user whose toolbar button runs a
   * template would get the popup instead after every browser restart.
   */
  private async refreshActionState(): Promise<void> {
    try {
      await this.actionService.update();
    } catch (error) {
      this.logger.error('Failed to refresh action state', error);
    }
  }

  /**
   * Local storage holds credentials (e.g. any YOURLS signature/username/password), so access is restricted to trusted
   * contexts (background/options/popup) to keep it out of reach of content scripts. This is safe to call on every
   * startup, and only from here.
   *
   * It also holds the user's templates, which a content script *does* depend on - so that data is served to content
   * scripts over messaging instead (see `TemplateShortcutInfoMessageConfig`) rather than by relaxing this.
   */
  private async restrictLocalStorageAccess(): Promise<void> {
    try {
      await browser.storage.local.setAccessLevel({ accessLevel: 'TRUSTED_CONTEXTS' });
    } catch (error) {
      this.logger.error('Failed to restrict local storage access to trusted contexts:', error);
    }
  }

  async update(
    oldVersion: ExtensionVersion,
    { finalize = true, openChangeLog = true, silent = false }: ExtensionManagerUpdateOptions = {},
  ) {
    const version = this.extensionInfo.getVersion();

    if (!silent) {
      this.logger.info(`Updating extension from v${oldVersion} to v${version}`);
    }

    const context: DataUpdateContext = {
      dataService: this.dataService,
      extensionInfo: this.extensionInfo,
      newVersion: version,
      oldVersion,
    };

    await this.dataUpdaters.reduce(async (acc, dataUpdater) => {
      await acc;
      await dataUpdater.update(context);
    }, Promise.resolve());

    if (finalize) {
      await this.executeScriptsInAllTabs();
      await this.actionService.update();
      await this.contextMenuService.update();
    }

    if (openChangeLog) {
      await this.notificationService.notifyChangeLog(version, diffVersions(version, oldVersion).scope);
    }
  }

  private async executeScriptsInAllTabs() {
    const tabs = await this.tabService.findAllTabs({
      filter: (tab) => !!tab.url && isInjectableUrl(new URL(tab.url)),
      query: { status: 'complete' },
    });

    // `TabService.executeScriptInTab` logs and swallows its own failures, so no reason can reach a reducer here.
    await allFulfilled(tabs.map(this.executeScriptsInTab.bind(this)));
  }

  private async executeScriptsInTab(tab: Tab) {
    await this.tabService.executeScriptInTab(tab.id, 'lib/content/any-content.js');

    if (tab.url && isHomepageUrl(new URL(tab.url))) {
      await this.tabService.executeScriptInTab(tab.id, 'lib/content/homepage-content.js');
    }
  }

  private async onInstall(details: browser.runtime.InstalledDetails) {
    switch (details.reason) {
      case browser.runtime.OnInstalledReason.INSTALL:
        await this.install();
        break;
      case browser.runtime.OnInstalledReason.UPDATE: {
        const oldVersion = this.extensionInfo.convertStringToExtensionVersion(details.previousVersion);

        // Versions only match for update when extension is manually reloaded during development
        if (this.extensionInfo.getVersion() === oldVersion) {
          await this.reload();
          return;
        }

        if (await this.dataMigrationService.isMigrationRequired(oldVersion)) {
          await this.migrate(oldVersion);
        } else {
          await this.update(oldVersion);
        }
        break;
      }
    }
  }
}

export type ExtensionManagerInstallOptions = {
  readonly finalize?: boolean;
  readonly silent?: boolean;
};

export type ExtensionManagerUpdateOptions = ExtensionManagerInstallOptions & {
  readonly openChangeLog?: boolean;
};
