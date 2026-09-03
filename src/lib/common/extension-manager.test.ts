import { describe, expect, it, vi } from 'vitest';
import { type ActionService } from 'extension/common/action/action.service';
import { type DataInstallContext } from 'extension/common/data/data-install-context.model';
import { type DataInstaller } from 'extension/common/data/data-installer';
import { type DataUpdateContext } from 'extension/common/data/data-update-context.model';
import { type DataUpdater } from 'extension/common/data/data-updater';
import { type DataService } from 'extension/common/data/data.service';
import { type DataMigrationService } from 'extension/common/data/migration/data-migration.service';
import { MigrationPhase } from 'extension/common/data/migration/migration-phase.enum';
import { ExtensionInfo } from 'extension/common/extension-info';
import { ExtensionManager } from 'extension/common/extension-manager';
import { type ExtensionVersion } from 'extension/common/extension-version';
import { type LoggingService } from 'extension/common/logging/logging.service';
import { type NotificationService } from 'extension/common/notification/notification.service';
import { VersionSegment } from 'extension/common/version/version-segment.enum';
import { type ContextMenuService } from 'extension/context-menu/context-menu.service';
import { type Tab, type TabCriteria } from 'extension/tab/tab.model';
import { type TabService } from 'extension/tab/tab.service';
import { type TemplateShortcutBroadcaster } from 'extension/template/template-shortcut-broadcaster';
import { getBrowserApiMock } from 'extension/test/browser-api.mock';
import { asIntlService, createIntlServiceMock } from 'extension/test/intl.mock';
import { createLoggingServiceMock } from 'extension/test/logger.mock';
import { createTab } from 'extension/test/tab.fake';

const currentVersion = '2.0.0' as ExtensionVersion;
const previousVersion = '1.2.9' as ExtensionVersion;

/**
 * Builds an {@link ExtensionManager} over spies, plus handles on every collaborator so a test can both configure
 * and assert on them.
 *
 * The real {@link ExtensionInfo} is used rather than a stub, so the version the manager reports is the one the
 * browser API mock declares, and the two units are exercised together.
 *
 * `tabService.findAllTabs` applies the criteria it is given to `tabs`, rather than ignoring them and returning a
 * canned list. That is what makes the injection tests meaningful: the `isInjectableUrl` predicate the manager
 * passes in is genuinely evaluated.
 */
const setup = ({ tabs = [] as Tab[] } = {}) => {
  const actionService = { listen: vi.fn(), update: vi.fn(async () => undefined) };
  const contextMenuService = { listen: vi.fn(), update: vi.fn(async () => undefined) };
  const dataService = {} as DataService;
  const dataInstallers = [
    { description: 'installer-a', install: vi.fn(async () => true) },
    { description: 'installer-b', install: vi.fn(async () => true) },
  ];
  const dataMigrationService = {
    advanceMigrationPhase: vi.fn(async () => true),
    initiateMigration: vi.fn(async () => undefined),
    isMigrationRequired: vi.fn(async () => false),
  };
  const dataUpdaters = [
    { description: 'updater-a', update: vi.fn(async () => true) },
    { description: 'updater-b', update: vi.fn(async () => true) },
  ];
  const extensionInfo = new ExtensionInfo();
  const intl = createIntlServiceMock();
  const logging = createLoggingServiceMock();
  const notificationService = { listen: vi.fn(), notifyChangeLog: vi.fn(async () => undefined) };
  const tabService = {
    executeScriptInTab: vi.fn<(tabId: number, filePath: string) => Promise<void>>(async () => undefined),
    findAllTabs: vi.fn(async ({ filter }: TabCriteria = {}) => (filter ? tabs.filter(filter) : tabs)),
  };
  const templateShortcutBroadcaster = { listen: vi.fn() };

  const extensionManager = new ExtensionManager(
    actionService as unknown as ActionService,
    contextMenuService as unknown as ContextMenuService,
    dataService,
    dataInstallers as unknown as DataInstaller[],
    dataMigrationService as unknown as DataMigrationService,
    dataUpdaters as unknown as DataUpdater[],
    extensionInfo,
    asIntlService(intl),
    logging as unknown as LoggingService,
    notificationService as unknown as NotificationService,
    tabService as unknown as TabService,
    templateShortcutBroadcaster as unknown as TemplateShortcutBroadcaster,
  );

  return {
    actionService,
    contextMenuService,
    dataInstallers,
    dataMigrationService,
    dataService,
    dataUpdaters,
    extensionInfo,
    extensionManager,
    intl,
    logger: logging.logger,
    notificationService,
    tabService,
  };
};

/** Invokes the `onInstalled` listener the manager registered in `run()`. */
const fireOnInstalled = async (details: browser.runtime.InstalledDetails): Promise<void> => {
  const [listener] = getBrowserApiMock().runtime.onInstalled.addListener.mock.calls[0]!;

  await (listener(details) as unknown as Promise<void>);
};

describe('ExtensionManager', () => {
  describe('install', () => {
    it('runs every data installer with the current version', async () => {
      const { dataInstallers, dataService, extensionInfo, extensionManager } = setup();

      await extensionManager.install();

      const expectedContext: DataInstallContext = { dataService, extensionInfo, version: currentVersion };

      dataInstallers.forEach((dataInstaller) => {
        expect(dataInstaller.install).toHaveBeenCalledExactlyOnceWith(expectedContext);
      });
    });

    it('finalizes by refreshing the action, context menus and content scripts', async () => {
      const { actionService, contextMenuService, extensionManager, tabService } = setup({
        tabs: [createTab({ id: 7, url: 'https://www.example.com/' })],
      });

      await extensionManager.install();

      expect(tabService.executeScriptInTab).toHaveBeenCalledExactlyOnceWith(7, 'lib/content/any-content.js');
      expect(actionService.update).toHaveBeenCalledOnce();
      expect(contextMenuService.update).toHaveBeenCalledOnce();
    });

    it('skips finalization when asked', async () => {
      const { actionService, contextMenuService, extensionManager, tabService } = setup({
        tabs: [createTab()],
      });

      await extensionManager.install({ finalize: false });

      expect(tabService.findAllTabs).not.toHaveBeenCalled();
      expect(actionService.update).not.toHaveBeenCalled();
      expect(contextMenuService.update).not.toHaveBeenCalled();
    });

    it('logs the installed version', async () => {
      const { extensionManager, logger } = setup();

      await extensionManager.install();

      expect(logger.info).toHaveBeenCalledWith('Installing extension...');
      expect(logger.info).toHaveBeenCalledWith('Installed name v2.0.0');
    });

    it('logs nothing when silent', async () => {
      const { extensionManager, logger } = setup();

      await extensionManager.install({ silent: true });

      expect(logger.info).not.toHaveBeenCalled();
    });

    it('rejects when a data installer fails, without finalizing', async () => {
      const { actionService, dataInstallers, extensionManager } = setup();
      const error = new Error('install failed');

      dataInstallers[0]!.install.mockRejectedValue(error);

      await expect(extensionManager.install()).rejects.toThrow();

      // The surviving installer still ran, since installers are dispatched together
      expect(dataInstallers[1]!.install).toHaveBeenCalledOnce();
      expect(actionService.update).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('runs every data updater with both versions', async () => {
      const { dataService, dataUpdaters, extensionInfo, extensionManager } = setup();

      await extensionManager.update(previousVersion);

      const expectedContext: DataUpdateContext = {
        dataService,
        extensionInfo,
        newVersion: currentVersion,
        oldVersion: previousVersion,
      };

      dataUpdaters.forEach((dataUpdater) => {
        expect(dataUpdater.update).toHaveBeenCalledExactlyOnceWith(expectedContext);
      });
    });

    // Updaters are reduced over a promise chain rather than dispatched together, because a later updater may
    // depend on what an earlier one wrote
    it('runs the data updaters sequentially, in registration order', async () => {
      const { dataUpdaters, extensionManager } = setup();
      const calls: string[] = [];

      dataUpdaters.forEach(({ description }, index) => {
        dataUpdaters[index]!.update.mockImplementation(async () => {
          calls.push(`${description}:start`);
          await Promise.resolve();
          calls.push(`${description}:end`);
          return true;
        });
      });

      await extensionManager.update(previousVersion);

      expect(calls).toEqual(['updater-a:start', 'updater-a:end', 'updater-b:start', 'updater-b:end']);
    });

    it('does not run a later updater once an earlier one fails', async () => {
      const { dataUpdaters, extensionManager } = setup();

      dataUpdaters[0]!.update.mockRejectedValue(new Error('update failed'));

      await expect(extensionManager.update(previousVersion)).rejects.toThrow('update failed');

      expect(dataUpdaters[1]!.update).not.toHaveBeenCalled();
    });

    it('notifies the change log with the diff scope', async () => {
      const { extensionManager, notificationService } = setup();

      await extensionManager.update(previousVersion);

      expect(notificationService.notifyChangeLog).toHaveBeenCalledExactlyOnceWith(currentVersion, VersionSegment.Major);
    });

    it('skips the change log when asked', async () => {
      const { extensionManager, notificationService } = setup();

      await extensionManager.update(previousVersion, { openChangeLog: false });

      expect(notificationService.notifyChangeLog).not.toHaveBeenCalled();
    });

    it('skips finalization when asked', async () => {
      const { actionService, contextMenuService, extensionManager, tabService } = setup({ tabs: [createTab()] });

      await extensionManager.update(previousVersion, { finalize: false });

      expect(tabService.findAllTabs).not.toHaveBeenCalled();
      expect(actionService.update).not.toHaveBeenCalled();
      expect(contextMenuService.update).not.toHaveBeenCalled();
    });

    it('logs the version transition', async () => {
      const { extensionManager, logger } = setup();

      await extensionManager.update(previousVersion);

      expect(logger.info).toHaveBeenCalledWith('Updating extension from v1.2.9 to v2.0.0');
    });

    it('logs nothing when silent', async () => {
      const { extensionManager, logger } = setup();

      await extensionManager.update(previousVersion, { silent: true });

      expect(logger.info).not.toHaveBeenCalled();
    });
  });

  describe('migrate', () => {
    it('installs and updates before initiating the migration when the phase advances', async () => {
      const { dataInstallers, dataMigrationService, dataUpdaters, extensionManager, notificationService } = setup();

      await extensionManager.migrate(previousVersion);

      expect(dataMigrationService.advanceMigrationPhase).toHaveBeenCalledExactlyOnceWith(
        previousVersion,
        MigrationPhase.Pending,
      );
      expect(dataInstallers[0]!.install).toHaveBeenCalledOnce();
      expect(dataUpdaters[0]!.update).toHaveBeenCalledOnce();
      expect(dataMigrationService.initiateMigration).toHaveBeenCalledExactlyOnceWith(previousVersion);

      // The migration UI is the user's notification here, so the change log must not also be opened
      expect(notificationService.notifyChangeLog).not.toHaveBeenCalled();
    });

    // The phase is the guard against re-running install/update for a migration that is already under way, e.g.
    // when the service worker restarts mid-migration
    it('only initiates the migration when the phase does not advance', async () => {
      const { dataInstallers, dataMigrationService, dataUpdaters, extensionManager } = setup();

      dataMigrationService.advanceMigrationPhase.mockResolvedValue(false);

      await extensionManager.migrate(previousVersion);

      expect(dataInstallers[0]!.install).not.toHaveBeenCalled();
      expect(dataUpdaters[0]!.update).not.toHaveBeenCalled();
      expect(dataMigrationService.initiateMigration).toHaveBeenCalledExactlyOnceWith(previousVersion);
    });

    it('finalizes exactly once, via the update rather than the install', async () => {
      const { actionService, contextMenuService, extensionManager } = setup();

      await extensionManager.migrate(previousVersion);

      expect(actionService.update).toHaveBeenCalledOnce();
      expect(contextMenuService.update).toHaveBeenCalledOnce();
    });

    it('does not initiate the migration when the install fails', async () => {
      const { dataInstallers, dataMigrationService, extensionManager } = setup();

      dataInstallers[0]!.install.mockRejectedValue(new Error('install failed'));

      await expect(extensionManager.migrate(previousVersion)).rejects.toThrow();

      expect(dataMigrationService.initiateMigration).not.toHaveBeenCalled();
    });
  });

  describe('reload', () => {
    it('refreshes the action, context menus and content scripts without touching data', async () => {
      const { actionService, contextMenuService, dataInstallers, dataUpdaters, extensionManager, tabService } = setup({
        tabs: [createTab({ id: 3, url: 'https://www.example.com/' })],
      });

      await extensionManager.reload();

      expect(tabService.executeScriptInTab).toHaveBeenCalledExactlyOnceWith(3, 'lib/content/any-content.js');
      expect(actionService.update).toHaveBeenCalledOnce();
      expect(contextMenuService.update).toHaveBeenCalledOnce();
      expect(dataInstallers[0]!.install).not.toHaveBeenCalled();
      expect(dataUpdaters[0]!.update).not.toHaveBeenCalled();
    });
  });

  describe('run', () => {
    it('registers the install listener and starts every listening service', async () => {
      const { actionService, contextMenuService, extensionManager, notificationService } = setup();
      const { runtime } = getBrowserApiMock();

      await extensionManager.run();

      expect(runtime.onInstalled.addListener).toHaveBeenCalledOnce();
      expect(actionService.listen).toHaveBeenCalledOnce();
      expect(contextMenuService.listen).toHaveBeenCalledOnce();
      expect(notificationService.listen).toHaveBeenCalledOnce();
    });

    /*
     * Chrome restores the manifest's `default_popup` on restart, discarding any `setPopup` call from the previous
     * session, so the action state has to be reapplied on every worker start rather than only on install/update.
     */
    it('refreshes the action state on every start', async () => {
      const { actionService, extensionManager } = setup();

      await extensionManager.run();

      expect(actionService.update).toHaveBeenCalledOnce();
    });

    /*
     * An MV3 worker only runs when an event it subscribes to fires. Without an `onStartup` listener the worker may
     * not start when the browser does, so the refresh above would not happen until the user had already clicked the
     * action - by which point they would have hit the restored popup.
     */
    it('subscribes to onStartup so the worker is woken when the browser starts', async () => {
      const { extensionManager } = setup();
      const { runtime } = getBrowserApiMock();

      await extensionManager.run();

      expect(runtime.onStartup.addListener).toHaveBeenCalledOnce();
    });

    it('starts even when refreshing the action state fails', async () => {
      const { actionService, extensionManager, logger } = setup();

      actionService.update.mockRejectedValue(new Error('no action'));

      await expect(extensionManager.run()).resolves.toBeUndefined();
      expect(logger.error).toHaveBeenCalledWith('Failed to refresh action state', expect.any(Error));
    });

    it('restricts local storage to trusted contexts', async () => {
      const { extensionManager } = setup();
      const { storage } = getBrowserApiMock();

      await extensionManager.run();

      expect(storage.local.setAccessLevel).toHaveBeenCalledExactlyOnceWith({ accessLevel: 'TRUSTED_CONTEXTS' });
    });

    // Startup must not be aborted by a browser that does not implement `setAccessLevel`, so the failure is logged
    // and swallowed
    it('still starts when restricting local storage fails', async () => {
      const { extensionManager, logger } = setup();
      const { storage } = getBrowserApiMock();
      const error = new Error('not supported');

      storage.local.setAccessLevel.mockRejectedValue(error);

      await expect(extensionManager.run()).resolves.toBeUndefined();

      expect(logger.error).toHaveBeenCalledWith('Failed to restrict local storage access to trusted contexts:', error);
      expect(logger.info).toHaveBeenCalledWith('Started name v2.0.0');
    });

    it('logs the started version', async () => {
      const { extensionManager, intl, logger } = setup();

      await extensionManager.run();

      expect(intl.getMessage).toHaveBeenCalledWith('name');
      expect(logger.info).toHaveBeenCalledWith('Started name v2.0.0');
    });
  });

  describe('onInstalled', () => {
    it('installs on a fresh install', async () => {
      const { dataInstallers, dataUpdaters, extensionManager } = setup();

      await extensionManager.run();
      await fireOnInstalled({ reason: 'install' });

      expect(dataInstallers[0]!.install).toHaveBeenCalledOnce();
      expect(dataUpdaters[0]!.update).not.toHaveBeenCalled();
    });

    it('updates on an update that needs no migration', async () => {
      const { dataMigrationService, dataUpdaters, extensionManager, notificationService } = setup();

      await extensionManager.run();
      await fireOnInstalled({ previousVersion: '1.2.9', reason: 'update' });

      expect(dataMigrationService.isMigrationRequired).toHaveBeenCalledExactlyOnceWith(previousVersion);
      expect(dataUpdaters[0]!.update).toHaveBeenCalledOnce();
      expect(dataMigrationService.initiateMigration).not.toHaveBeenCalled();
      expect(notificationService.notifyChangeLog).toHaveBeenCalledOnce();
    });

    it('migrates on an update that needs one', async () => {
      const { dataMigrationService, extensionManager } = setup();

      dataMigrationService.isMigrationRequired.mockResolvedValue(true);

      await extensionManager.run();
      await fireOnInstalled({ previousVersion: '1.2.9', reason: 'update' });

      expect(dataMigrationService.initiateMigration).toHaveBeenCalledExactlyOnceWith(previousVersion);
    });

    // Chrome reports a manual reload during development as an update to the same version
    it('reloads, rather than updating, when the version is unchanged', async () => {
      const { actionService, dataMigrationService, dataUpdaters, extensionManager } = setup();

      await extensionManager.run();
      await fireOnInstalled({ previousVersion: '2.0.0', reason: 'update' });

      // Twice: once when the worker started (see the `run` block), then again for the reload itself.
      expect(actionService.update).toHaveBeenCalledTimes(2);
      expect(dataUpdaters[0]!.update).not.toHaveBeenCalled();
      expect(dataMigrationService.isMigrationRequired).not.toHaveBeenCalled();
    });

    it.each(['chrome_update', 'shared_module_update'] as const)('ignores the %j reason', async (reason) => {
      const { dataInstallers, dataMigrationService, dataUpdaters, extensionManager } = setup();

      await extensionManager.run();
      await fireOnInstalled({ reason });

      expect(dataInstallers[0]!.install).not.toHaveBeenCalled();
      expect(dataUpdaters[0]!.update).not.toHaveBeenCalled();
      expect(dataMigrationService.isMigrationRequired).not.toHaveBeenCalled();
    });

    it('rejects when the previous version is missing on an update', async () => {
      const { extensionManager } = setup();

      await extensionManager.run();

      await expect(fireOnInstalled({ reason: 'update' })).rejects.toThrow('Extension version is not available');
    });
  });

  describe('content script injection', () => {
    it('injects only into tabs with an injectable url', async () => {
      const { extensionManager, tabService } = setup({
        tabs: [
          createTab({ id: 1, url: 'https://www.example.com/' }),
          createTab({ id: 2, url: 'chrome://extensions' }),
          createTab({ id: 3, url: 'https://chromewebstore.google.com/detail/x' }),
          createTab({ id: 4, url: 'https://chrome.google.com/webstore/detail/x' }),
          createTab({ id: 5, url: 'https://chrome.google.com/sync' }),
        ],
      });

      await extensionManager.reload();

      expect(tabService.executeScriptInTab.mock.calls.map(([tabId]) => tabId)).toEqual([1, 5]);
    });

    it('queries only for tabs that have finished loading', async () => {
      const { extensionManager, tabService } = setup();

      await extensionManager.reload();

      expect(tabService.findAllTabs).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({ query: { status: 'complete' } }),
      );
    });

    it('additionally injects the homepage script on the homepage', async () => {
      const { extensionManager, tabService } = setup({
        tabs: [createTab({ id: 9, url: 'https://tmplat.com/' })],
      });

      await extensionManager.reload();

      expect(tabService.executeScriptInTab.mock.calls).toEqual([
        [9, 'lib/content/any-content.js'],
        [9, 'lib/content/homepage-content.js'],
      ]);
    });

    it('does not inject the homepage script on a subdomain of the homepage', async () => {
      const { extensionManager, tabService } = setup({
        tabs: [createTab({ id: 9, url: 'https://www.tmplat.com/' })],
      });

      await extensionManager.reload();

      expect(tabService.executeScriptInTab).toHaveBeenCalledExactlyOnceWith(9, 'lib/content/any-content.js');
    });

    // A tab that cannot be injected into (e.g. it navigated away mid-flight) must not prevent the remaining tabs
    // from being injected
    it('injects the remaining tabs when one injection fails', async () => {
      const { extensionManager, tabService } = setup({
        tabs: [createTab({ id: 1 }), createTab({ id: 2 })],
      });

      tabService.executeScriptInTab.mockRejectedValueOnce(new Error('no access'));

      await expect(extensionManager.reload()).rejects.toThrow();

      expect(tabService.executeScriptInTab).toHaveBeenCalledTimes(2);
    });
  });
});
