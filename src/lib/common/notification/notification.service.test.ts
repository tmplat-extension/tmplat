import { describe, expect, it, vi } from 'vitest';
import { ExtensionError } from 'extension/common/error/extension-error';
import { type ExtensionInfo } from 'extension/common/extension-info';
import { type ExtensionVersion } from 'extension/common/extension-version';
import { type IntlService } from 'extension/common/intl/intl.service';
import { type LoggingService } from 'extension/common/logging/logging.service';
import { type NotificationDataRepository } from 'extension/common/notification/data/notification-data.repository';
import { type NotificationData } from 'extension/common/notification/data/notification-data.schema';
import { NotificationService } from 'extension/common/notification/notification.service';
import { VersionSegment } from 'extension/common/version/version-segment.enum';
import { type TabService } from 'extension/tab/tab.service';
import { getBrowserApiMock } from 'extension/test/browser-api.mock';
import { createLoggingServiceMock } from 'extension/test/logger.mock';

const createData = (overrides: Partial<NotificationData> = {}): NotificationData => ({
  changelog: { enabled: true, scope: VersionSegment.Minor },
  enabled: true,
  ...overrides,
});

const flushPromises = async () => {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
};

const setup = ({ data = createData() }: { data?: NotificationData } = {}) => {
  const extensionInfo = {
    createExtensionUrlString: vi.fn((path?: string) => `chrome-extension://test-extension-id/${path ?? ''}`),
  };
  const intl = {
    getMessage: vi.fn((key: string, ...substitutions: unknown[]) => [key, ...substitutions].join('|')),
  };
  const logging = createLoggingServiceMock();
  const { notifications } = getBrowserApiMock();
  const repository = { get: vi.fn(async () => data) };
  const tabService = { createExtensionTab: vi.fn(async () => undefined) };

  const service = new NotificationService(
    extensionInfo as unknown as ExtensionInfo,
    intl as unknown as IntlService,
    logging as unknown as LoggingService,
    repository as unknown as NotificationDataRepository,
    tabService as unknown as TabService,
  );

  return { extensionInfo, intl, logger: logging.logger, notifications, repository, service, tabService };
};

describe('NotificationService', () => {
  it('creates a basic browser notification with the extension icon', async () => {
    const { extensionInfo, notifications, service } = setup();

    await expect(service.createNotification({ message: 'Done', title: 'Copied' })).resolves.toBe(
      'generated-notification-id',
    );

    expect(extensionInfo.createExtensionUrlString).toHaveBeenCalledExactlyOnceWith('img/icon_64.png');
    expect(notifications.create).toHaveBeenCalledExactlyOnceWith({
      iconUrl: 'chrome-extension://test-extension-id/img/icon_64.png',
      message: 'Done',
      title: 'Copied',
      type: 'basic',
    });
  });

  it('uses an explicit notification id when one is provided', async () => {
    const { notifications, service } = setup();

    await expect(service.createNotification({ id: 'template-1', message: 'Done', title: 'Copied' })).resolves.toBe(
      'template-1',
    );

    expect(notifications.create).toHaveBeenCalledExactlyOnceWith('template-1', {
      iconUrl: 'chrome-extension://test-extension-id/img/icon_64.png',
      message: 'Done',
      title: 'Copied',
      type: 'basic',
    });
  });

  it('defaults missing title and message to empty strings', async () => {
    const { notifications, service } = setup();

    await service.createNotification({});

    expect(notifications.create).toHaveBeenCalledWith({
      iconUrl: 'chrome-extension://test-extension-id/img/icon_64.png',
      message: '',
      title: '',
      type: 'basic',
    });
  });

  it('does not touch the browser notification API when notifications are disabled', async () => {
    const { extensionInfo, notifications, service } = setup({ data: createData({ enabled: false }) });

    await expect(service.createNotification({ message: 'Done', title: 'Copied' })).resolves.toBeUndefined();

    expect(extensionInfo.createExtensionUrlString).not.toHaveBeenCalled();
    expect(notifications.create).not.toHaveBeenCalled();
  });

  it('rejects repository failures asynchronously, so callers can catch the returned promise', async () => {
    const { repository, service } = setup();
    repository.get.mockRejectedValue(new Error('storage failed'));
    let result: Promise<string | undefined> | undefined;

    expect(() => {
      result = service.createNotification({ message: 'Done', title: 'Copied' });
    }).not.toThrow();
    await expect(result).rejects.toThrow('storage failed');
  });

  it('creates a fixed-id change log notification when the version diff is within the configured scope', async () => {
    const { intl, notifications, service } = setup();

    await service.notifyChangeLog('2.0.0' as ExtensionVersion, VersionSegment.Minor);

    expect(intl.getMessage).toHaveBeenCalledWith('notification_change_log_message', '2.0.0');
    expect(intl.getMessage).toHaveBeenCalledWith('name');
    expect(intl.getMessage).toHaveBeenCalledWith('notification_change_log_title', 'name');
    expect(notifications.create).toHaveBeenCalledExactlyOnceWith('changelog', {
      iconUrl: 'chrome-extension://test-extension-id/img/icon_64.png',
      message: 'notification_change_log_message|2.0.0',
      title: 'notification_change_log_title|name',
      type: 'basic',
    });
  });

  it('describes an extension error using its own message and code', async () => {
    const { notifications, service } = setup();
    const { i18n } = getBrowserApiMock();
    i18n.getMessage.mockReturnValue('Output was empty');
    const error = ExtensionError.from('TEE400000', 'My Template');

    await service.notifyError(error, {
      messageKey: 'template_execution_fail_general_description',
      substitutions: ['My Template'],
      title: 'Copy failed',
    });

    expect(notifications.create).toHaveBeenCalledExactlyOnceWith({
      contextMessage: 'TEE400000',
      iconUrl: 'chrome-extension://test-extension-id/img/icon_64.png',
      message: 'Output was empty',
      title: 'Copy failed',
      type: 'basic',
    });
  });

  it('describes an opaque error using the localized fallback message and code', async () => {
    const { intl, notifications, service } = setup();

    await service.notifyError(new Error('ECONNRESET'), {
      code: 'TEE400000',
      messageKey: 'template_execution_fail_general_description',
      substitutions: ['My Template'],
      title: 'Copy failed',
    });

    expect(intl.getMessage).toHaveBeenCalledWith('template_execution_fail_general_description', 'My Template');
    expect(notifications.create).toHaveBeenCalledExactlyOnceWith({
      contextMessage: 'TEE400000',
      iconUrl: 'chrome-extension://test-extension-id/img/icon_64.png',
      message: 'template_execution_fail_general_description|My Template',
      title: 'Copy failed',
      type: 'basic',
    });
  });

  it('falls back to a generic code, message and title when none are provided', async () => {
    const { notifications, service } = setup();

    await service.notifyError('nope', {});

    expect(notifications.create).toHaveBeenCalledExactlyOnceWith({
      contextMessage: 'ERR500000',
      iconUrl: 'chrome-extension://test-extension-id/img/icon_64.png',
      message: 'xerr_err500000',
      title: 'error',
      type: 'basic',
    });
  });

  // `notifyError` is called from `catch` blocks that are about to rethrow, so a failure to report a problem must
  // never replace the problem being reported (see `template-engine.ts` and `action.service.ts`).
  it('logs and swallows its own failures rather than rejecting', async () => {
    const createError = new Error('storage failed');
    const { logger, repository, service } = setup();
    repository.get.mockRejectedValue(createError);

    await expect(service.notifyError(new Error('Boom'), { title: 'Copy failed' })).resolves.toBeUndefined();

    expect(logger.error).toHaveBeenCalledExactlyOnceWith('Failed to create error notification', createError, {
      notification: expect.objectContaining({ title: 'Copy failed' }),
    });
  });

  it('skips the change log notification when change log notifications are disabled', async () => {
    const { notifications, service } = setup({
      data: createData({ changelog: { enabled: false, scope: VersionSegment.Patch } }),
    });

    await service.notifyChangeLog('2.0.0' as ExtensionVersion, VersionSegment.Major);

    expect(notifications.create).not.toHaveBeenCalled();
  });

  it('skips the change log notification when the version diff is outside the configured scope', async () => {
    const { notifications, service } = setup({
      data: createData({ changelog: { enabled: true, scope: VersionSegment.Major } }),
    });

    await service.notifyChangeLog('2.0.0' as ExtensionVersion, VersionSegment.Minor);

    expect(notifications.create).not.toHaveBeenCalled();
  });

  it('registers a click listener that ignores non-change-log notifications', async () => {
    const { notifications, service, tabService } = setup();

    service.listen();
    const [listener] = notifications.onClicked.addListener.mock.calls[0]!;
    listener('template-1');
    await flushPromises();

    expect(notifications.clear).not.toHaveBeenCalled();
    expect(tabService.createExtensionTab).not.toHaveBeenCalled();
  });

  it('clears a clicked change log notification and opens the bundled change log page', async () => {
    const { notifications, service, tabService } = setup();

    service.listen();
    const [listener] = notifications.onClicked.addListener.mock.calls[0]!;
    listener('changelog');
    await flushPromises();

    expect(notifications.clear).toHaveBeenCalledExactlyOnceWith('changelog');
    expect(tabService.createExtensionTab).toHaveBeenCalledExactlyOnceWith('changelog.html');
  });

  it('logs failures from the asynchronous notification click handler', async () => {
    const clickError = new Error('tab failed');
    const { logger, notifications, service, tabService } = setup();
    tabService.createExtensionTab.mockRejectedValue(clickError);

    service.listen();
    const [listener] = notifications.onClicked.addListener.mock.calls[0]!;
    listener('changelog');
    await flushPromises();

    expect(logger.error).toHaveBeenCalledExactlyOnceWith('Failed to handle notification click event', clickError);
  });
});
