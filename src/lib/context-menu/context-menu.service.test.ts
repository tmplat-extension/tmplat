import { describe, expect, it, vi } from 'vitest';
import { type IntlService } from 'extension/common/intl/intl.service';
import { type LoggingService } from 'extension/common/logging/logging.service';
import { MessageType } from 'extension/common/message/message-type.enum';
import { type NotificationService } from 'extension/common/notification/notification.service';
import { ContextMenuService } from 'extension/context-menu/context-menu.service';
import { type TabService } from 'extension/tab/tab.service';
import { TemplateContextMenuMode } from 'extension/template/template-context-menu-mode.enum';
import { type TemplateEngine } from 'extension/template/template-engine';
import { type Template } from 'extension/template/template.model';
import { type TemplateContextMenuInfo, type TemplateService } from 'extension/template/template.service';
import { getBrowserApiMock } from 'extension/test/browser-api.mock';
import { createLoggingServiceMock, type LoggingServiceMock } from 'extension/test/logger.mock';
import { createTab } from 'extension/test/tab.fake';

const template = (overrides: Partial<Template> = {}): Template =>
  ({ enabled: true, id: 'abc', title: 'Copy URL', ...overrides }) as Template;

const menuInfo = (overrides: Partial<TemplateContextMenuInfo> = {}): TemplateContextMenuInfo =>
  ({
    autoPasteEnabled: false,
    enabled: true,
    mode: TemplateContextMenuMode.Menu,
    optionLinkEnabled: false,
    templates: [],
    ...overrides,
  }) as TemplateContextMenuInfo;

const dispatchClick = async (service: ContextMenuService, info: Record<string, unknown>, tab?: unknown) => {
  service.listen();
  const [listener] = getBrowserApiMock().contextMenus.onClicked.addListener.mock.calls[0] as [
    (info: unknown, tab?: unknown) => void,
  ];
  listener(info, tab);
  // The registered listener invokes an async handler and swallows rejections; let the microtasks settle.
  await new Promise((resolve) => setTimeout(resolve, 0));
};

const clickInfo = (overrides: Record<string, unknown> = {}) => ({ menuItemId: 'template.abc', ...overrides });

describe('ContextMenuService', () => {
  let logging: LoggingServiceMock;
  let execute: ReturnType<typeof vi.fn>;
  let getTemplateContextMenuInfo: ReturnType<typeof vi.fn>;
  let sendTabMessage: ReturnType<typeof vi.fn>;
  let notifyError: ReturnType<typeof vi.fn>;

  const createService = (info: TemplateContextMenuInfo = menuInfo()) => {
    logging = createLoggingServiceMock();
    execute = vi.fn(async () => 'rendered');
    getTemplateContextMenuInfo = vi.fn(async () => info);
    sendTabMessage = vi.fn(async () => undefined);
    notifyError = vi.fn(async () => undefined);
    const intl = { getMessage: vi.fn((key: string) => key) } as unknown as IntlService;
    const notificationService = { notifyError } as unknown as NotificationService;
    const tabService = { sendTabMessage } as unknown as TabService;
    const templateEngine = { execute } as unknown as TemplateEngine;
    const templateService = {
      addChangeListener: vi.fn(),
      createTemplateContextMenuInfo: vi.fn(() => info),
      getTemplateContextMenuInfo,
      getTemplateTitle: vi.fn((value: Template) => (value as { title?: string }).title ?? ''),
    } as unknown as TemplateService;

    return new ContextMenuService(
      intl,
      logging as unknown as LoggingService,
      notificationService,
      tabService,
      templateEngine,
      templateService,
    );
  };

  describe('listen', () => {
    it('registers a click listener and a template change listener', () => {
      createService().listen();

      expect(getBrowserApiMock().contextMenus.onClicked.addListener).toHaveBeenCalled();
    });
  });

  describe('onClicked', () => {
    it('opens the options page for the options menu item', async () => {
      const service = createService();

      await dispatchClick(service, clickInfo({ menuItemId: 'options' }), createTab());

      expect(getBrowserApiMock().runtime.openOptionsPage).toHaveBeenCalled();
    });

    it('executes the matching template for a template menu item', async () => {
      const tab = createTab({ url: 'https://page.test/' });
      const service = createService(menuInfo({ templates: [template({ id: 'abc' })] }));

      await dispatchClick(service, clickInfo({ menuItemId: 'template.abc', pageUrl: 'https://page.test/' }), tab);

      expect(execute).toHaveBeenCalledWith({
        tab,
        template: expect.objectContaining({ id: 'abc' }),
        url: new URL('https://page.test/'),
      });
    });

    it('prefers the link url over other click urls', async () => {
      const tab = createTab({ url: 'https://tab.test/' });
      const service = createService(menuInfo({ templates: [template({ id: 'abc' })] }));

      await dispatchClick(
        service,
        clickInfo({ linkUrl: 'https://link.test/', pageUrl: 'https://page.test/', srcUrl: 'https://src.test/' }),
        tab,
      );

      expect(execute).toHaveBeenCalledWith(expect.objectContaining({ url: new URL('https://link.test/') }));
    });

    it('does nothing for an unrelated menu item id', async () => {
      const service = createService();

      await dispatchClick(service, clickInfo({ menuItemId: 'something-else' }), createTab());

      expect(execute).not.toHaveBeenCalled();
      expect(getBrowserApiMock().runtime.openOptionsPage).not.toHaveBeenCalled();
    });

    it('logs an error when the template cannot be found', async () => {
      const service = createService(menuInfo({ templates: [template({ id: 'other' })] }));

      await dispatchClick(service, clickInfo({ menuItemId: 'template.abc' }), createTab());

      expect(logging.logger.error).toHaveBeenCalled();
      expect(execute).not.toHaveBeenCalled();
    });

    it('logs an error when the tab is not valid', async () => {
      const service = createService(menuInfo({ templates: [template({ id: 'abc' })] }));

      await dispatchClick(service, clickInfo({ menuItemId: 'template.abc' }), { id: 1 });

      expect(logging.logger.error).toHaveBeenCalled();
      expect(execute).not.toHaveBeenCalled();
    });

    it('logs an error when the menu item id is not a string', async () => {
      const service = createService();

      await dispatchClick(service, clickInfo({ menuItemId: 123 }), createTab());

      expect(logging.logger.error).toHaveBeenCalled();
    });

    /*
     * In single-template mode the one menu item is created from the configured template whether or not it is enabled,
     * so it cannot be resolved from `templates` - that only lists what a *menu* would offer, which excludes disabled
     * templates. Looking it up there reported the template as missing instead.
     */
    it('resolves the configured template in template mode rather than the menu listing', async () => {
      const tab = createTab({ url: 'https://page.test/' });
      const service = createService(
        menuInfo({
          mode: TemplateContextMenuMode.Template,
          template: template({ id: 'abc' }),
          templateId: 'abc',
          templates: [],
        }),
      );

      await dispatchClick(service, clickInfo({ menuItemId: 'template.abc', pageUrl: 'https://page.test/' }), tab);

      expect(execute).toHaveBeenCalledWith(
        expect.objectContaining({ template: expect.objectContaining({ id: 'abc' }) }),
      );
    });

    it('reports the configured template being disabled rather than executing it', async () => {
      const service = createService(
        menuInfo({
          mode: TemplateContextMenuMode.Template,
          template: template({ enabled: false, id: 'abc' }),
          templateId: 'abc',
          templates: [],
        }),
      );

      await dispatchClick(service, clickInfo({ menuItemId: 'template.abc' }), createTab({ url: 'https://page.test/' }));

      expect(notifyError).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'CTX409000' }),
        expect.objectContaining({ title: 'template_execution_fail_title' }),
      );
      expect(execute).not.toHaveBeenCalled();
    });
  });

  describe('auto-paste', () => {
    const autoPasteInfo = (overrides: Partial<TemplateContextMenuInfo> = {}) =>
      menuInfo({ autoPasteEnabled: true, templates: [template({ id: 'abc' })], ...overrides });

    it('sends the rendered output to the tab when enabled and the click was editable', async () => {
      const tab = createTab({ id: 42, url: 'https://page.test/' });
      const service = createService(autoPasteInfo());

      await dispatchClick(service, clickInfo({ editable: true }), tab);

      expect(sendTabMessage).toHaveBeenCalledWith(42, MessageType.Paste, { value: 'rendered' });
    });

    it('does not paste when auto-paste is disabled', async () => {
      const service = createService(autoPasteInfo({ autoPasteEnabled: false }));

      await dispatchClick(service, clickInfo({ editable: true }), createTab());

      expect(sendTabMessage).not.toHaveBeenCalled();
    });

    it('does not paste when the clicked context was not editable', async () => {
      const service = createService(autoPasteInfo());

      await dispatchClick(service, clickInfo({ editable: false }), createTab());

      expect(sendTabMessage).not.toHaveBeenCalled();
    });

    it('pastes only after the template has been executed', async () => {
      const order: string[] = [];
      const service = createService(autoPasteInfo());
      execute.mockImplementation(async () => {
        order.push('execute');
        return 'rendered';
      });
      sendTabMessage.mockImplementation(async () => {
        order.push('paste');
      });

      await dispatchClick(service, clickInfo({ editable: true }), createTab());

      // The value being pasted *is* the executed output, so the copy has to have completed first
      expect(order).toEqual(['execute', 'paste']);
    });

    it('does not paste when the template execution failed', async () => {
      const service = createService(autoPasteInfo());
      execute.mockRejectedValue(new Error('nope'));

      await dispatchClick(service, clickInfo({ editable: true }), createTab());

      expect(sendTabMessage).not.toHaveBeenCalled();
    });

    /*
     * The copy this follows has already succeeded: the output is on the clipboard and the user has been notified. A
     * rethrow here would be logged as a failed click, reporting a successful copy as broken -- the same trap the
     * template engine's notifications used to fall into.
     */
    it('swallows and logs a paste failure rather than failing the copy', async () => {
      const service = createService(autoPasteInfo());
      sendTabMessage.mockRejectedValue(new Error('no content script'));

      await dispatchClick(service, clickInfo({ editable: true }), createTab());

      expect(logging.logger.warn).toHaveBeenCalledWith(expect.stringContaining('Failed to paste'), expect.any(Error));
      expect(logging.logger.error).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('clears existing menu items and creates nothing when disabled', async () => {
      const service = createService(menuInfo({ enabled: false }));

      await service.update();

      expect(getBrowserApiMock().contextMenus.removeAll).toHaveBeenCalled();
      expect(getBrowserApiMock().contextMenus.create).not.toHaveBeenCalled();
    });

    it('creates a single template menu item in template mode', async () => {
      const service = createService(
        menuInfo({ mode: TemplateContextMenuMode.Template, templateId: 'abc' } as Partial<TemplateContextMenuInfo>),
      );

      await service.update();

      expect(getBrowserApiMock().contextMenus.create).toHaveBeenCalledTimes(1);
      expect(getBrowserApiMock().contextMenus.create).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'template.abc' }),
        expect.any(Function),
      );
    });

    it('creates a parent with a child item per template in menu mode', async () => {
      const service = createService(
        menuInfo({ templates: [template({ id: 'a', title: 'A' }), template({ id: 'b', title: 'B' })] }),
      );

      await service.update();

      const ids = getBrowserApiMock().contextMenus.create.mock.calls.map(([options]) => (options as { id: string }).id);
      expect(ids).toEqual(['parent', 'template.a', 'template.b']);
    });

    it('creates a disabled empty item when there are no templates', async () => {
      const service = createService(menuInfo({ templates: [] }));

      await service.update();

      const emptyCall = getBrowserApiMock().contextMenus.create.mock.calls.find(
        ([options]) => (options as { id: string }).id === 'empty',
      );
      expect(emptyCall?.[0]).toMatchObject({ enabled: false, id: 'empty' });
    });

    it('adds a separator and options item when the option link is enabled', async () => {
      const service = createService(menuInfo({ optionLinkEnabled: true, templates: [template({ id: 'a' })] }));

      await service.update();

      const ids = getBrowserApiMock().contextMenus.create.mock.calls.map(([options]) => (options as { id: string }).id);
      expect(ids).toEqual(expect.arrayContaining(['parent', 'template.a', 'separator', 'options']));
    });

    it('rejects when creating a menu item reports runtime.lastError', async () => {
      const service = createService(
        menuInfo({ mode: TemplateContextMenuMode.Template, templateId: 'abc' } as Partial<TemplateContextMenuInfo>),
      );
      getBrowserApiMock().runtime.lastError = { message: 'creation failed' };

      await expect(service.update()).rejects.toMatchObject({
        cause: { message: 'creation failed' },
        code: 'CTX500000',
      });
    });
  });
});
