import { allFulfilled } from 'allfulfilled';
import { ActionService, ActionServiceToken } from 'extension/common/action/action.service';
import { DataInstallContext } from 'extension/common/data/data-install-context.model';
import { DataInstaller, DataInstallerToken } from 'extension/common/data/data-installer';
import { DataUpdateContext } from 'extension/common/data/data-update-context.model';
import { DataUpdater, DataUpdaterToken } from 'extension/common/data/data-updater';
import { DataService, DataServiceToken } from 'extension/common/data/data.service';
import {
  DataMigrationService,
  DataMigrationServiceToken,
} from 'extension/common/data/migration/data-migration.service';
import { MigrationPhase } from 'extension/common/data/migration/migration-phase.enum';
import { inject, injectable, multiInject } from 'extension/common/di';
import { ExtensionInfo, ExtensionInfoToken } from 'extension/common/extension-info';
import { ExtensionVersion } from 'extension/common/extension-version.enum';
import { IntlService, IntlServiceToken } from 'extension/common/intl/intl.service';
import { Logger } from 'extension/common/logging/logger';
import { LoggingService, LoggingServiceToken } from 'extension/common/logging/logging.service';
import { NotificationService, NotificationServiceToken } from 'extension/common/notification/notification.service';
import { isHomepageUrl, isInjectableUrl } from 'extension/common/url.utils';
import { diffVersions } from 'extension/common/version/version.utils';
import { ContextMenuService, ContextMenuServiceToken } from 'extension/context-menu/context-menu.service';
import { Tab } from 'extension/tab/tab.model';
import { TabService, TabServiceToken } from 'extension/tab/tab.service';

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
    @inject(LoggingServiceToken) loggingService: LoggingService,
    @inject(NotificationServiceToken) private readonly notificationService: NotificationService,
    @inject(TabServiceToken) private readonly tabService: TabService,
  ) {
    this.logger = loggingService.createLogger(ExtensionManagerName);
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

    await allFulfilled(this.dataInstallers.map((dataInstaller) => dataInstaller.install(context)));

    if (finalize) {
      await this.executeScriptsInAllTabs();
      await this.actionService.update();
      await this.contextMenuService.update();
    }

    if (!silent) {
      this.logger.info(`Installed ${this.intl.getMessage('name')} v${this.extensionInfo.getVersion(true)}`);
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

    this.actionService.listen();
    this.contextMenuService.listen();
    this.notificationService.listen();

    await this.restrictLocalStorageAccess();

    this.logger.info(`Started ${this.intl.getMessage('name')} v${this.extensionInfo.getVersion(true)}`);
  }

  /**
   * Local storage holds credentials (e.g. the Bitly access token and any YOURLS signature/username/password), so
   * access is restricted to trusted contexts (background/options/popup) to keep it out of reach of content
   * scripts. This is safe to call on every startup, and only from here, as no other data namespace uses local
   * storage and nothing in a content script context depends on it.
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
