import { describe, expect, it, vi } from 'vitest';
import { type ClipboardService } from 'extension/common/clipboard/clipboard.service';
import { type IntlService } from 'extension/common/intl/intl.service';
import { type LoggingService } from 'extension/common/logging/logging.service';
import { type NotificationService } from 'extension/common/notification/notification.service';
import { type Tab } from 'extension/tab/tab.model';
import { type TemplateContextManagerFactory } from 'extension/template/context/template-context-manager.factory';
import { TemplateEngine, type TemplateEngineExecuteOptions } from 'extension/template/template-engine';
import { type Template } from 'extension/template/template.model';
import { type TemplateService } from 'extension/template/template.service';
import { createLoggingServiceMock } from 'extension/test/logger.mock';
import { createTab } from 'extension/test/tab.fake';

const TEMPLATE = {
  content: 'Copied {title}: {url}',
  description: null,
  enabled: true,
  id: 'template-1',
  predefined: false,
  shortcut: null,
  title: 'Example template',
} as Template;

const createOptions = (overrides: Partial<TemplateEngineExecuteOptions> = {}): TemplateEngineExecuteOptions => {
  const tab = createTab({ title: 'Example page', url: 'https://example.com/page' });

  return {
    tab,
    template: TEMPLATE,
    url: new URL(tab.url),
    ...overrides,
  };
};

const setup = ({
  context = { title: 'Example page', url: 'https://example.com/page' } as Record<string, unknown>,
} = {}) => {
  const clipboardService = { copy: vi.fn(async () => undefined) };
  const intl = {
    getMessage: vi.fn((key: string, ...substitutions: unknown[]) => [key, ...substitutions].join('|')),
  };
  const logging = createLoggingServiceMock();
  const notificationService = { createNotification: vi.fn(async () => 'notification-id') };
  const templateContextManagerFactory = {
    createTemplateContextManager: vi.fn(() => ({ context })),
  };
  const templateService = {
    getTemplateTitle: vi.fn((template: Template) => ('title' in template ? template.title : '')),
  };

  const engine = new TemplateEngine(
    clipboardService as unknown as ClipboardService,
    intl as unknown as IntlService,
    logging as unknown as LoggingService,
    notificationService as unknown as NotificationService,
    templateContextManagerFactory as unknown as TemplateContextManagerFactory,
    templateService as unknown as TemplateService,
  );

  return {
    clipboardService,
    engine,
    intl,
    logger: logging.logger,
    notificationService,
    templateContextManagerFactory,
    templateService,
  };
};

describe('TemplateEngine', () => {
  it('renders the template, copies the output and reports success', async () => {
    const { clipboardService, engine, intl, notificationService, templateContextManagerFactory } = setup();
    const options = createOptions();

    await expect(engine.execute(options)).resolves.toBe('Copied Example page: https://example.com/page');

    expect(templateContextManagerFactory.createTemplateContextManager).toHaveBeenCalledExactlyOnceWith(options);
    expect(clipboardService.copy).toHaveBeenCalledExactlyOnceWith('Copied Example page: https://example.com/page');
    expect(notificationService.createNotification).toHaveBeenCalledExactlyOnceWith({
      message: 'template_execution_success_description|Example template',
      title: 'template_execution_success_title',
    });
    expect(intl.getMessage).toHaveBeenCalledWith('template_execution_success_title');
    expect(clipboardService.copy.mock.invocationCallOrder[0]).toBeLessThan(
      notificationService.createNotification.mock.invocationCallOrder[0]!,
    );
  });

  it('suppresses the success notification when requested', async () => {
    const { engine, notificationService } = setup();

    await expect(engine.execute(createOptions({ suppressNotifications: true }))).resolves.toBe(
      'Copied Example page: https://example.com/page',
    );

    expect(notificationService.createNotification).not.toHaveBeenCalled();
  });

  it('rejects unsupported tab URLs, without rendering or copying', async () => {
    const { clipboardService, engine, notificationService, templateContextManagerFactory } = setup();

    await expect(
      engine.execute(createOptions({ tab: createTab({ url: 'chrome://extensions/' }) })),
    ).rejects.toMatchObject({
      code: 'TEE403000',
    });

    expect(templateContextManagerFactory.createTemplateContextManager).not.toHaveBeenCalled();
    expect(clipboardService.copy).not.toHaveBeenCalled();
    expect(notificationService.createNotification).toHaveBeenCalledExactlyOnceWith({
      message: expect.any(String),
      title: 'template_execution_fail_title',
    });
  });

  it('rejects invalid tab URLs asynchronously, so callers can catch the returned promise', async () => {
    const { clipboardService, engine, notificationService, templateContextManagerFactory } = setup();
    const options = createOptions({ tab: { ...createTab(), url: 'not a url' } as Tab });
    let result: Promise<string> | undefined;

    expect(() => {
      result = engine.execute(options);
    }).not.toThrow();
    await expect(result).rejects.toThrow('Invalid URL');

    expect(templateContextManagerFactory.createTemplateContextManager).not.toHaveBeenCalled();
    expect(clipboardService.copy).not.toHaveBeenCalled();
    expect(notificationService.createNotification).toHaveBeenCalledWith({
      message: 'template_execution_fail_general_description|Example template',
      title: 'template_execution_fail_title',
    });
  });

  it('rejects an empty rendered output, notifies failure and leaves the clipboard unchanged', async () => {
    const { clipboardService, engine, notificationService } = setup({ context: {} });

    await expect(
      engine.execute(createOptions({ template: { ...TEMPLATE, content: '{missing}' } })),
    ).rejects.toMatchObject({
      code: 'TEE400000',
    });

    expect(clipboardService.copy).not.toHaveBeenCalled();
    expect(notificationService.createNotification).toHaveBeenCalledExactlyOnceWith({
      message: expect.any(String),
      title: 'template_execution_fail_title',
    });
  });

  it('rejects render failures, notifies failure and leaves the clipboard unchanged', async () => {
    const renderError = new Error('context failed');
    const { clipboardService, engine, notificationService } = setup({
      context: { broken: vi.fn(async () => Promise.reject(renderError)) },
    });

    await expect(engine.execute(createOptions({ template: { ...TEMPLATE, content: '{broken}' } }))).rejects.toThrow(
      renderError,
    );

    expect(clipboardService.copy).not.toHaveBeenCalled();
    expect(notificationService.createNotification).toHaveBeenCalledExactlyOnceWith({
      message: 'template_execution_fail_general_description|Example template',
      title: 'template_execution_fail_title',
    });
  });

  // Regression guard. A notification reports the outcome and must never change it: the success notification used
  // to be awaited *inside* the render/copy try, so a notification failure after the clipboard had already been
  // written fell into the catch, showed the user a *failure* notification and rejected a template that copied fine.
  it('still succeeds when the success notification cannot be created, and logs it instead', async () => {
    const notificationError = new Error('notification failed');
    const { clipboardService, engine, logger, notificationService } = setup();

    notificationService.createNotification.mockRejectedValueOnce(notificationError);

    await expect(engine.execute(createOptions())).resolves.toBe('Copied Example page: https://example.com/page');

    expect(clipboardService.copy).toHaveBeenCalledExactlyOnceWith('Copied Example page: https://example.com/page');
    expect(notificationService.createNotification).toHaveBeenCalledOnce();
    expect(logger.error).toHaveBeenCalledExactlyOnceWith(
      'Failed to create template execution notification:',
      notificationError,
    );
  });

  // Regression guard. The failure notification used to be awaited before `throw e`, so its own rejection replaced
  // the original error. Combined with the bug above this was worse than it looks: `createNotification` awaits both a
  // storage read and `browser.notifications.create`, so one broken dependency failed *both* notification calls and a
  // successful copy surfaced to the user as a notification/storage error.
  it('rethrows the original template error when the failure notification cannot be created', async () => {
    const notificationError = new Error('notification failed');
    const { engine, logger, notificationService } = setup({ context: {} });

    notificationService.createNotification.mockRejectedValue(notificationError);

    await expect(
      engine.execute(createOptions({ template: { ...TEMPLATE, content: '{missing}' } })),
    ).rejects.toMatchObject({ code: 'TEE400000' });

    expect(logger.error).toHaveBeenCalledExactlyOnceWith(
      'Failed to create template execution notification:',
      notificationError,
    );
  });
});
