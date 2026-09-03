import { beforeAll, describe, expect, it, vi } from 'vitest';
import { type IntlService } from 'extension/common/intl/intl.service';
import { type LoggingService } from 'extension/common/logging/logging.service';
import type * as ContextMenuModule from 'extension/context-menu/context-menu.service';
import { TemplateContextMenuMode } from 'extension/template/template-context-menu-mode.enum';
import { type TemplateEngine } from 'extension/template/template-engine';
import { type Template } from 'extension/template/template.model';
import { type TemplateContextMenuInfo, type TemplateService } from 'extension/template/template.service';
import { getBrowserApiMock } from 'extension/test/browser-api.mock';
import { createLoggingServiceMock, type LoggingServiceMock } from 'extension/test/logger.mock';
import { createTab } from 'extension/test/tab.fake';

// The service imports `TemplateEngineToken`, which transitively loads `markdown.service` -> Europa, and Europa
// references the browser-only `self` global at module-evaluation time. The Node test environment has no `self`, so it
// is stubbed and the module is imported dynamically after the stub is in place (mirroring `markdown.service.test.ts`).
let ContextMenuService: typeof ContextMenuModule.ContextMenuService;

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

const dispatchClick = async (
  service: ContextMenuModule.ContextMenuService,
  info: Record<string, unknown>,
  tab?: unknown,
) => {
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

  beforeAll(async () => {
    vi.stubGlobal('self', globalThis);
    ({ ContextMenuService } = await import('extension/context-menu/context-menu.service'));
  });

  const createService = (info: TemplateContextMenuInfo = menuInfo()) => {
    logging = createLoggingServiceMock();
    execute = vi.fn(async () => 'rendered');
    getTemplateContextMenuInfo = vi.fn(async () => info);
    const intl = { getMessage: vi.fn((key: string) => key) } as unknown as IntlService;
    const templateEngine = { execute } as unknown as TemplateEngine;
    const templateService = {
      addChangeListener: vi.fn(),
      createTemplateContextMenuInfo: vi.fn(() => info),
      getTemplateContextMenuInfo,
      getTemplateTitle: vi.fn((value: Template) => (value as { title?: string }).title ?? ''),
    } as unknown as TemplateService;

    return new ContextMenuService(intl, logging as unknown as LoggingService, templateEngine, templateService);
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

      await expect(service.update()).rejects.toThrow('creation failed');
    });
  });
});
