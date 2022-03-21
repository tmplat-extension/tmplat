import { identity } from 'lodash-es';

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
import { IntlMessageKey } from 'extension/common/intl/intl-message-key.enum';
import { IntlService, IntlServiceToken } from 'extension/common/intl/intl.service';
import { LogService, LogServiceToken } from 'extension/common/log/log.service';
import { Logger } from 'extension/common/log/logger';
import { NotificationService, NotificationServiceToken } from 'extension/common/notification/notification.service';
import { isHomepageUrl, isInjectableUrl } from 'extension/common/url.utils';
import { diffVersions } from 'extension/common/version/version.utils';
import { ContextMenuService, ContextMenuServiceToken } from 'extension/context-menu/context-menu.service';
import { Tab } from 'extension/tab/tab.model';
import { TabService, TabServiceToken } from 'extension/tab/tab.service';
import { TemplateService, TemplateServiceToken } from 'extension/template/template.service';

const ExtensionManagerName = 'ExtensionManager';

export const ExtensionManagerToken = Symbol(ExtensionManagerName);

@injectable()
export class ExtensionManager {
  private readonly logger: Logger;

  constructor(
    @inject(ContextMenuServiceToken) private readonly contextMenuService: ContextMenuService,
    @inject(DataServiceToken) private readonly dataService: DataService,
    @multiInject(DataInstallerToken) private readonly dataInstallers: DataInstaller[],
    @inject(DataMigrationServiceToken) private readonly dataMigrationService: DataMigrationService,
    @multiInject(DataUpdaterToken) private readonly dataUpdaters: DataUpdater[],
    @inject(ExtensionInfoToken) private readonly extensionInfo: ExtensionInfo,
    @inject(IntlServiceToken) private readonly intl: IntlService,
    @inject(LogServiceToken) logService: LogService,
    @inject(NotificationServiceToken) private readonly notificationService: NotificationService,
    @inject(TabServiceToken) private readonly tabService: TabService,
    @inject(TemplateServiceToken) private readonly templateService: TemplateService,
  ) {
    this.logger = logService.createLogger(ExtensionManagerName);
  }

  async install({ finalize = true, silent = false }: ExtensionManagerInstallOptions = {}): Promise<void> {
    if (!silent) {
      this.logger.info('Installing extension...');
    }

    const context: DataInstallContext = {
      dataService: this.dataService,
      version: this.extensionInfo.version,
    };

    await Promise.all(
      this.dataInstallers.map(async (dataInstaller) => {
        if (!(await dataInstaller.isInstalled(context))) {
          await dataInstaller.install(context);
        }
      }),
    );

    if (finalize) {
      await this.executeScriptsInAllTabs();
      await this.contextMenuService.update();
    }

    if (!silent) {
      this.logger.info(`Installed ${this.intl.getMessage(IntlMessageKey.Name)} v${this.extensionInfo.versionHash}`);
    }
  }

  async isInstalled(): Promise<boolean> {
    const context: DataInstallContext = {
      dataService: this.dataService,
      version: this.extensionInfo.version,
    };

    const results = await Promise.all(this.dataInstallers.map((dataInstaller) => dataInstaller.isInstalled(context)));

    return results.every(identity);
  }

  async migrate(oldVersion: ExtensionVersion): Promise<void> {
    if (await this.dataMigrationService.advanceMigrationPhase(oldVersion, MigrationPhase.Pending)) {
      this.logger.info('Ensuring extension installed...');

      await this.install({ finalize: false, silent: true });

      const { version } = this.extensionInfo;

      this.logger.info(`Updating extension from v${oldVersion} to v${version}`);

      await this.update(oldVersion, { finalize: true, openChangeLog: false, silent: true });
    }

    return this.dataMigrationService.initiateMigration(oldVersion);
  }

  async reload(): Promise<void> {
    this.logger.info('Reloading extension...');

    await this.executeScriptsInAllTabs();
    await this.contextMenuService.update();
  }

  async run(): Promise<void> {
    chrome.runtime.onInstalled.addListener(this.onInstall.bind(this));

    this.contextMenuService.listen();

    this.logger.info(`Started ${this.intl.getMessage(IntlMessageKey.Name)} v${this.extensionInfo.versionHash}`);
  }

  async update(
    oldVersion: ExtensionVersion,
    { finalize = true, openChangeLog = true, silent = false }: ExtensionManagerUpdateOptions = {},
  ): Promise<void> {
    const { version } = this.extensionInfo;

    if (!silent) {
      this.logger.info(`Updating extension from v${oldVersion} to v${version}`);
    }

    const context: DataUpdateContext = {
      dataService: this.dataService,
      newVersion: version,
      oldVersion,
    };

    await this.dataUpdaters.reduce(async (acc, dataUpdater) => {
      await acc;

      return dataUpdater.update(context);
    }, Promise.resolve());

    if (finalize) {
      await this.executeScriptsInAllTabs();
      await this.contextMenuService.update();
    }

    if (openChangeLog) {
      await this.notificationService.notifyChangeLog(version, diffVersions(version, oldVersion).scope);
    }
  }

  private async executeScriptsInAllTabs(): Promise<void> {
    const tabs = await this.tabService.findAllTabs({
      filter: (tab) => isInjectableUrl(tab.url),
      query: {
        status: 'complete',
      },
    });

    await Promise.all(tabs.map(this.executeScriptsInTab.bind(this)));
  }

  private async executeScriptsInTab(tab: Tab): Promise<void> {
    try {
      await this.tabService.executeScriptInTab(tab.id, 'lib/content/any-content.js');
    } catch (e) {
      this.logger.warn(`Failed to execute AnyContent script in tab[${tab.id}]:`, e);
    }

    if (isHomepageUrl(tab.url)) {
      try {
        await this.tabService.executeScriptInTab(tab.id, 'lib/content/homepage-content.js');
      } catch (e) {
        this.logger.warn(`Failed to execute HomepageContent script in tab[${tab.id}]:`, e);
      }
    }
  }

  private async onInstall(details: chrome.runtime.InstalledDetails): Promise<void> {
    switch (details.reason) {
      case chrome.runtime.OnInstalledReason.INSTALL:
        await this.install();
        break;
      case chrome.runtime.OnInstalledReason.UPDATE:
        const oldVersion = this.extensionInfo.convertStringToExtensionVersion(details.previousVersion);

        // Versions only match for update when extension is manually reloaded during development
        if (this.extensionInfo.version === oldVersion) {
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

export type ExtensionManagerInstallOptions = {
  readonly finalize?: boolean;
  readonly silent?: boolean;
};

export type ExtensionManagerUpdateOptions = ExtensionManagerInstallOptions & {
  readonly openChangeLog?: boolean;
};
