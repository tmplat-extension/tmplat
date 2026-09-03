import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MessageType } from 'extension/common/message/message-type.enum';
import { type MessageService } from 'extension/common/message/message.service';
import { MessagesContext } from 'extension/common/message/messages.context';
import { ExecuteTemplateMessageOutcome } from 'extension/template/message/execute-template-message-outcome.enum';
import { type TemplatePopupInfo } from 'extension/template/template.service';
import { createTab } from 'extension/test/tab.fake';
import { renderUi } from 'extension/test/ui';
import { TemplateList } from 'extension/ui/popup/component/template-list/template-list';
import { createTemplate, createTemplatePopupInfo } from 'extension/ui/popup/test-fixtures';

const createDeferred = <T,>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });

  return { promise, resolve };
};

const clonePopupInfo = (info = createTemplatePopupInfo()) => structuredClone(info);

const createTemplateServiceStub = (info = createTemplatePopupInfo()) => ({
  getTemplatePopupInfo: vi.fn(async () => clonePopupInfo(info)),
  getTemplateTitle: vi.fn((template: { title?: string; id: string }) => template.title ?? template.id),
});

const renderTemplateList = ({
  messageService = { sendMessageAwaitResponse: vi.fn() },
  tabService = { findActiveTab: vi.fn(async () => createTab()) },
  templateService = createTemplateServiceStub(),
} = {}) => {
  renderUi(
    <MessagesContext.Provider value={messageService as unknown as MessageService}>
      <TemplateList />
    </MessagesContext.Provider>,
    { contexts: { tabService, templateService } },
  );

  return { messageService, tabService, templateService };
};

describe('TemplateList', () => {
  it('renders skeleton rows while templates are loading', () => {
    const pending = new Promise<TemplatePopupInfo>(() => undefined);
    const templateService = {
      getTemplatePopupInfo: vi.fn(() => pending),
      getTemplateTitle: vi.fn(),
    };

    const { container } = renderUi(<TemplateList />, { contexts: { templateService } });

    expect(container.querySelectorAll('.template-list-skeleton-item')).toHaveLength(4);
    expect(templateService.getTemplatePopupInfo).toHaveBeenCalledTimes(1);
  });

  it('renders the empty state and options link when no templates are available', async () => {
    const templateService = createTemplateServiceStub(createTemplatePopupInfo({ templates: [] }));
    renderTemplateList({ templateService });

    expect(await screen.findByText('menu_empty')).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'options' })).toBeInTheDocument();
    expect(templateService.getTemplatePopupInfo).toHaveBeenCalledTimes(1);
  });

  it('renders enabled templates with the options link', async () => {
    const templateService = createTemplateServiceStub(
      createTemplatePopupInfo({
        templates: [
          createTemplate({ id: 'template-1', shortcut: 'A', title: 'First template' }),
          createTemplate({ id: 'template-2', shortcut: 'B', title: 'Second template' }),
        ],
      }),
    );
    renderTemplateList({ templateService });

    expect(await screen.findByRole('menuitem', { name: /First template/ })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /Second template/ })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'options' })).toBeInTheDocument();
    expect(templateService.getTemplatePopupInfo).toHaveBeenCalledTimes(1);
  });

  it('surfaces a localized error when templates fail to load', async () => {
    const templateService = {
      getTemplatePopupInfo: vi.fn(async () => Promise.reject(new Error('Cannot load templates'))),
      getTemplateTitle: vi.fn(),
    };
    renderTemplateList({ templateService });

    expect(await screen.findByText('popup_error')).toBeInTheDocument();
    expect(screen.getByText('error')).toBeInTheDocument();
    expect(templateService.getTemplatePopupInfo).toHaveBeenCalledTimes(1);
  });

  it('disables every other template while one template is executing', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const execution = createDeferred<{ outcome: ExecuteTemplateMessageOutcome.Executed; output: string }>();
    const messageService = {
      sendMessageAwaitResponse: vi.fn(() => execution.promise),
    };
    const templateService = createTemplateServiceStub(
      createTemplatePopupInfo({
        templates: [
          createTemplate({ id: 'template-1', title: 'First template' }),
          createTemplate({ id: 'template-2', title: 'Second template' }),
        ],
      }),
    );
    renderTemplateList({ messageService, templateService });

    await user.click(await screen.findByRole('menuitem', { name: 'First template' }));
    await waitFor(() =>
      expect(screen.getByRole('menuitem', { name: 'Second template' })).toHaveAttribute('aria-disabled', 'true'),
    );
    await user.click(screen.getByRole('menuitem', { name: 'Second template' }));

    expect(messageService.sendMessageAwaitResponse).toHaveBeenCalledTimes(1);
    expect(messageService.sendMessageAwaitResponse).toHaveBeenCalledWith(MessageType.ExecuteTemplate, {
      id: 'template-1',
      source: 'popup',
      suppressNotifications: true,
      tabId: 1,
    });
    expect(templateService.getTemplatePopupInfo).toHaveBeenCalledTimes(1);

    execution.resolve({ outcome: ExecuteTemplateMessageOutcome.Executed, output: 'Copied output' });
  });
});
