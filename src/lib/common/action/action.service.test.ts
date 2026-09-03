import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ActionService } from 'extension/common/action/action.service';
import { type LoggingService } from 'extension/common/logging/logging.service';
import { type NotificationService } from 'extension/common/notification/notification.service';
import { TemplateActionMode } from 'extension/template/template-action-mode.enum';
import { type TemplateEngine } from 'extension/template/template-engine';
import { type TemplateActionInfo, type TemplateService } from 'extension/template/template.service';
import { type BrowserApiMock, getBrowserApiMock } from 'extension/test/browser-api.mock';
import { asIntlService, createIntlServiceMock, type IntlServiceMock } from 'extension/test/intl.mock';
import { createLoggingServiceMock, type LoggingServiceMock } from 'extension/test/logger.mock';

const TAB = { id: 3, url: 'https://example.com/page' } as browser.tabs.Tab;
const TEMPLATE = { enabled: true, id: 'tpl-1' } as never;
const DISABLED_TEMPLATE = { enabled: false, id: 'tpl-1' } as never;

describe('ActionService', () => {
  let action: BrowserApiMock['action'];
  let intl: IntlServiceMock;
  let logging: LoggingServiceMock;
  let notificationService: { createNotification: ReturnType<typeof vi.fn>; notifyError: ReturnType<typeof vi.fn> };
  let templateEngine: { execute: ReturnType<typeof vi.fn> };
  let templateService: {
    addChangeListener: ReturnType<typeof vi.fn>;
    createTemplateActionInfo: ReturnType<typeof vi.fn>;
    getTemplateActionInfo: ReturnType<typeof vi.fn>;
    getTemplateTitle: ReturnType<typeof vi.fn>;
  };
  let service: ActionService;

  beforeEach(() => {
    ({ action } = getBrowserApiMock());
    intl = createIntlServiceMock();
    logging = createLoggingServiceMock();
    notificationService = {
      createNotification: vi.fn(async () => undefined),
      notifyError: vi.fn(async () => undefined),
    };
    templateEngine = { execute: vi.fn(async () => 'output') };
    templateService = {
      addChangeListener: vi.fn(),
      createTemplateActionInfo: vi.fn(),
      getTemplateActionInfo: vi.fn(async () => ({ mode: TemplateActionMode.Popup }) as TemplateActionInfo),
      getTemplateTitle: vi.fn(() => 'My Template'),
    };
    service = new ActionService(
      asIntlService(intl),
      logging as unknown as LoggingService,
      notificationService as unknown as NotificationService,
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

    it('notifies the user when the clicked template is disabled', async () => {
      templateService.getTemplateActionInfo.mockResolvedValue({
        mode: TemplateActionMode.Template,
        template: DISABLED_TEMPLATE,
        templateId: 'tpl-1',
      });
      service.listen();
      const onClicked = action.onClicked.addListener.mock.calls[0][0] as (tab: browser.tabs.Tab) => void;

      onClicked(TAB);
      await vi.waitFor(() => expect(notificationService.notifyError).toHaveBeenCalledTimes(1));
      expect(notificationService.notifyError).toHaveBeenCalledWith(expect.objectContaining({ code: 'ACT409000' }), {
        messageKey: 'template_execution_fail_general_description',
        substitutions: ['My Template'],
        title: 'template_execution_fail_title',
      });
      expect(logging.logger.error).toHaveBeenCalled();
      expect(templateEngine.execute).not.toHaveBeenCalled();
    });

    it('notifies the user when the clicked tab is not a real tab', async () => {
      templateService.getTemplateActionInfo.mockResolvedValue({
        mode: TemplateActionMode.Template,
        template: TEMPLATE,
        templateId: 'tpl-1',
      });
      service.listen();
      const onClicked = action.onClicked.addListener.mock.calls[0][0] as (tab: browser.tabs.Tab) => void;

      onClicked({ id: undefined } as browser.tabs.Tab);
      await vi.waitFor(() => expect(notificationService.notifyError).toHaveBeenCalledTimes(1));
      expect(notificationService.notifyError).toHaveBeenCalledWith(expect.objectContaining({ code: 'ACT404100' }), {
        messageKey: 'template_execution_fail_general_description',
        substitutions: ['My Template'],
        title: 'template_execution_fail_title',
      });
      expect(logging.logger.error).toHaveBeenCalled();
      expect(templateEngine.execute).not.toHaveBeenCalled();
    });

    // A notification reports the outcome of the click; it must not become the outcome. `notifyError` absorbs its own
    // failures (see `notification.service.test.ts`), so the click still fails with the error that caused it.
    it('still logs the original failure after notifying', async () => {
      templateService.getTemplateActionInfo.mockResolvedValue({
        mode: TemplateActionMode.Template,
        template: DISABLED_TEMPLATE,
        templateId: 'tpl-1',
      });
      service.listen();
      const onClicked = action.onClicked.addListener.mock.calls[0][0] as (tab: browser.tabs.Tab) => void;

      onClicked(TAB);
      await vi.waitFor(() =>
        expect(logging.logger.error).toHaveBeenCalledWith(
          'Failed to handle action click event',
          expect.objectContaining({ code: 'ACT409000' }),
        ),
      );
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
