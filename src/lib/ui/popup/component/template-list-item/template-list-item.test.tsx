import MenuList from '@mui/material/MenuList';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MessageType } from 'extension/common/message/message-type.enum';
import { type MessageService } from 'extension/common/message/message.service';
import { MessagesContext } from 'extension/common/message/messages.context';
import { getShortcutModifier } from 'extension/common/system/system.utils';
import { ExecuteTemplateMessageOutcome } from 'extension/template/message/execute-template-message-outcome.enum';
import { ExecuteTemplateMessageSource } from 'extension/template/message/execute-template-message-source.enum';
import { createTab } from 'extension/test/tab.fake';
import { renderUi } from 'extension/test/ui';
import { TemplateListItem } from 'extension/ui/popup/component/template-list-item/template-list-item';
import { createTemplate, createTemplatePopupInfoAction } from 'extension/ui/popup/test-fixtures';

type MessageServiceStub = {
  sendMessageAwaitResponse: ReturnType<typeof vi.fn>;
};

const renderTemplateListItem = ({
  action = createTemplatePopupInfoAction(),
  disabled = false,
  errorMessageKey = 'error_snackbar_unknown_message' as const,
  messageService = {
    sendMessageAwaitResponse: vi.fn(async () => ({
      outcome: ExecuteTemplateMessageOutcome.Executed,
      output: 'Copied output',
    })),
  } as MessageServiceStub,
  onBusyChange = vi.fn(),
  shortcuts = { enabled: true },
  tabService = { findActiveTab: vi.fn(async () => createTab({ id: 7 })) },
  template = createTemplate({ shortcut: null, title: 'Template title' }),
  templateService = { getTemplateTitle: vi.fn((item: { title?: string; id: string }) => item.title ?? item.id) },
} = {}) => {
  renderUi(
    <MessagesContext.Provider value={messageService as unknown as MessageService}>
      <MenuList>
        <TemplateListItem
          action={action}
          disabled={disabled}
          onBusyChange={onBusyChange}
          shortcuts={shortcuts}
          template={template}
        />
      </MenuList>
    </MessagesContext.Provider>,
    { contexts: { errorMessageKey, tabService, templateService } },
  );

  return { messageService, onBusyChange, tabService, template, templateService };
};

describe('TemplateListItem', () => {
  it('executes the selected template for the active tab', async () => {
    const { messageService, tabService, templateService } = renderTemplateListItem();

    await userEvent.click(screen.getByRole('menuitem', { name: 'Template title' }));

    await waitFor(() => expect(messageService.sendMessageAwaitResponse).toHaveBeenCalledTimes(1));
    expect(tabService.findActiveTab).toHaveBeenCalledTimes(1);
    expect(messageService.sendMessageAwaitResponse).toHaveBeenCalledWith(MessageType.ExecuteTemplate, {
      id: 'template-1',
      source: ExecuteTemplateMessageSource.Popup,
      suppressNotifications: true,
      tabId: 7,
    });
    expect(templateService.getTemplateTitle).toHaveBeenCalledWith(expect.objectContaining({ id: 'template-1' }));
  });

  it('does not execute when disabled because another template is busy', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const { messageService } = renderTemplateListItem({ disabled: true });
    const item = screen.getByRole('menuitem', { name: 'Template title' });

    expect(item).toHaveAttribute('aria-disabled', 'true');

    await user.click(item);

    expect(messageService.sendMessageAwaitResponse).not.toHaveBeenCalled();
  });

  it('auto-closes the popup after showing a successful execution indicator when configured', async () => {
    const close = vi.spyOn(window, 'close').mockImplementation(() => undefined);
    const onBusyChange = vi.fn();
    renderTemplateListItem({ action: createTemplatePopupInfoAction({ autoCloseEnabled: true }), onBusyChange });

    await userEvent.click(screen.getByRole('menuitem', { name: 'Template title' }));
    await waitFor(() => expect(onBusyChange).toHaveBeenCalledWith('template-1', true));

    await waitFor(() => expect(close).toHaveBeenCalledTimes(1), { timeout: 1500 });
    expect(onBusyChange).toHaveBeenLastCalledWith('template-1', false);
  });

  it('shows and dismisses a localized error when template execution fails', async () => {
    const messageService = {
      sendMessageAwaitResponse: vi.fn(async () => Promise.reject(new Error('Cannot execute'))),
    };
    renderTemplateListItem({ messageService });

    await userEvent.click(screen.getByRole('menuitem', { name: 'Template title' }));

    const dismiss = await screen.findByRole('button', { name: 'popup_execute_template_error_dismiss_button' });
    expect(dismiss.parentElement).toHaveAttribute('title', 'error_snackbar_unknown_message');

    await userEvent.click(dismiss);

    await waitFor(() =>
      expect(
        screen.queryByRole('button', { name: 'popup_execute_template_error_dismiss_button' }),
      ).not.toBeInTheDocument(),
    );
    expect(messageService.sendMessageAwaitResponse).toHaveBeenCalledTimes(1);
  });

  it('shows a warning indicator instead of auto-closing when execution is skipped', async () => {
    const close = vi.spyOn(window, 'close').mockImplementation(() => undefined);
    const messageService = {
      sendMessageAwaitResponse: vi.fn(async () => ({
        outcome: ExecuteTemplateMessageOutcome.Skipped,
        reason: 'No content script',
      })),
    };
    renderTemplateListItem({ action: createTemplatePopupInfoAction({ autoCloseEnabled: true }), messageService });

    await userEvent.click(screen.getByRole('menuitem', { name: 'Template title' }));

    const dismiss = await screen.findByRole('button', { name: 'popup_execute_template_warning_dismiss_button' });
    expect(dismiss.parentElement).toHaveAttribute('title', 'No content script');
    expect(close).not.toHaveBeenCalled();
  });

  it('shows the shortcut modifier and key when shortcuts are enabled', () => {
    renderTemplateListItem({ template: createTemplate({ shortcut: 'D', title: 'Template title' }) });

    expect(screen.getByText(`${getShortcutModifier()}D`)).toBeInTheDocument();
  });
});
