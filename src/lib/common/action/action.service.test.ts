import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type * as ActionServiceModuleExports from 'extension/common/action/action.service';
import { type LoggingService } from 'extension/common/logging/logging.service';
import { TemplateActionMode } from 'extension/template/template-action-mode.enum';
import { type TemplateEngine } from 'extension/template/template-engine';
import { type TemplateActionInfo, type TemplateService } from 'extension/template/template.service';
import { type BrowserApiMock, getBrowserApiMock } from 'extension/test/browser-api.mock';
import { createLoggingServiceMock, type LoggingServiceMock } from 'extension/test/logger.mock';

// `action.service` imports `TemplateEngineToken`, which transitively loads Europa (which touches the browser-only
// `self` global at evaluation time), so the module is imported dynamically after `self` is stubbed.
type ActionServiceModule = typeof ActionServiceModuleExports;

let ActionService: ActionServiceModule['ActionService'];

const TAB = { id: 3, url: 'https://example.com/page' } as browser.tabs.Tab;
const TEMPLATE = { id: 'tpl-1' } as never;

describe('ActionService', () => {
  let action: BrowserApiMock['action'];
  let logging: LoggingServiceMock;
  let templateEngine: { execute: ReturnType<typeof vi.fn> };
  let templateService: {
    addChangeListener: ReturnType<typeof vi.fn>;
    createTemplateActionInfo: ReturnType<typeof vi.fn>;
    getTemplateActionInfo: ReturnType<typeof vi.fn>;
  };
  let service: InstanceType<ActionServiceModule['ActionService']>;

  beforeAll(async () => {
    vi.stubGlobal('self', globalThis);
    ({ ActionService } = await import('extension/common/action/action.service'));
  });

  beforeEach(() => {
    ({ action } = getBrowserApiMock());
    logging = createLoggingServiceMock();
    templateEngine = { execute: vi.fn(async () => 'output') };
    templateService = {
      addChangeListener: vi.fn(),
      createTemplateActionInfo: vi.fn(),
      getTemplateActionInfo: vi.fn(async () => ({ mode: TemplateActionMode.Popup }) as TemplateActionInfo),
    };
    service = new ActionService(
      logging as unknown as LoggingService,
      templateEngine as unknown as TemplateEngine,
      templateService as unknown as TemplateService,
    );
  });

  describe('listen', () => {
    it('registers action-click and template-change listeners', () => {
      service.listen();

      expect(action.onClicked.addListener).toHaveBeenCalledTimes(1);
      expect(templateService.addChangeListener).toHaveBeenCalledTimes(1);
    });

    it('executes the template when the action is clicked in template mode', async () => {
      templateService.getTemplateActionInfo.mockResolvedValue({
        mode: TemplateActionMode.Template,
        template: TEMPLATE,
        templateId: 'tpl-1',
      });
      service.listen();
      const onClicked = action.onClicked.addListener.mock.calls[0][0] as (tab: browser.tabs.Tab) => void;

      onClicked(TAB);
      await vi.waitFor(() => expect(templateEngine.execute).toHaveBeenCalledTimes(1));
      expect(templateEngine.execute).toHaveBeenCalledWith(
        expect.objectContaining({ tab: TAB, template: TEMPLATE, url: new URL(TAB.url as string) }),
      );
    });

    it('does nothing on click when not in template mode', async () => {
      service.listen();
      const onClicked = action.onClicked.addListener.mock.calls[0][0] as (tab: browser.tabs.Tab) => void;

      onClicked(TAB);
      await Promise.resolve();

      expect(templateEngine.execute).not.toHaveBeenCalled();
    });

    it('logs a failure when the clicked template cannot be found', async () => {
      templateService.getTemplateActionInfo.mockResolvedValue({
        mode: TemplateActionMode.Template,
        template: undefined,
        templateId: 'missing',
      });
      service.listen();
      const onClicked = action.onClicked.addListener.mock.calls[0][0] as (tab: browser.tabs.Tab) => void;

      onClicked(TAB);
      await vi.waitFor(() => expect(logging.logger.error).toHaveBeenCalled());
      expect(templateEngine.execute).not.toHaveBeenCalled();
    });

    it('logs a failure when the clicked tab is not a real tab', async () => {
      templateService.getTemplateActionInfo.mockResolvedValue({
        mode: TemplateActionMode.Template,
        template: TEMPLATE,
        templateId: 'tpl-1',
      });
      service.listen();
      const onClicked = action.onClicked.addListener.mock.calls[0][0] as (tab: browser.tabs.Tab) => void;

      onClicked({ id: undefined } as browser.tabs.Tab);
      await vi.waitFor(() => expect(logging.logger.error).toHaveBeenCalled());
      expect(templateEngine.execute).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('enables the popup when in popup mode', async () => {
      templateService.getTemplateActionInfo.mockResolvedValue({ mode: TemplateActionMode.Popup });

      await service.update();

      expect(action.setPopup).toHaveBeenCalledWith({ popup: 'popup.html' });
    });

    it('clears the popup when in template mode', async () => {
      templateService.getTemplateActionInfo.mockResolvedValue({
        mode: TemplateActionMode.Template,
        template: TEMPLATE,
        templateId: 'tpl-1',
      });

      await service.update();

      expect(action.setPopup).toHaveBeenCalledWith({ popup: '' });
    });
  });
});
