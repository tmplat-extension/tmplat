import { describe, expect, it, vi } from 'vitest';
import { type LoggingService } from 'extension/common/logging/logging.service';
import { MessageType } from 'extension/common/message/message-type.enum';
import { type MessageService } from 'extension/common/message/message.service';
import { ShortcutEventListener } from 'extension/tab/event/shortcut-event-listener';
import { ExecuteTemplateMessageOutcome } from 'extension/template/message/execute-template-message-outcome.enum';
import { ExecuteTemplateMessageSource } from 'extension/template/message/execute-template-message-source.enum';
import { type TemplateService, type TemplateShortcutInfo } from 'extension/template/template.service';
import { createLoggingServiceMock } from 'extension/test/logger.mock';

type Handler = (event: unknown) => unknown;

const CHAR_C = 'C'.charCodeAt(0);

const shortcutInfo = (overrides: Partial<TemplateShortcutInfo> = {}): TemplateShortcutInfo => ({
  autoPasteEnabled: false,
  enabled: true,
  shortcuts: ['C'],
  ...overrides,
});

// The shortcut modifier is platform-specific (Ctrl+Alt on non-macOS, Shift+Alt on macOS). Events set all three
// modifiers so the shortcut activates regardless of the platform the test runtime reports.
const keydown = (overrides: Record<string, unknown> = {}) => ({
  altKey: true,
  ctrlKey: true,
  keyCode: CHAR_C,
  preventDefault: vi.fn(),
  shiftKey: true,
  target: null,
  ...overrides,
});

const inputTarget = (overrides: Record<string, unknown> = {}) => ({
  disabled: false,
  nodeName: 'INPUT',
  readOnly: false,
  selectionEnd: 0,
  selectionStart: 0,
  value: '',
  ...overrides,
});

const setup = async (info: TemplateShortcutInfo = shortcutInfo()) => {
  const keydownHandlers: Handler[] = [];
  vi.stubGlobal(
    'addEventListener',
    vi.fn((type: string, handler: Handler) => {
      if (type === 'keydown') {
        keydownHandlers.push(handler);
      }
    }),
  );

  const logging = createLoggingServiceMock();
  const sendMessageAwaitResponse = vi.fn(async () => ({
    outcome: ExecuteTemplateMessageOutcome.Executed,
    output: 'PASTED',
  }));
  const messageService = { sendMessageAwaitResponse } as unknown as MessageService;

  let changeListener: ((data: unknown) => void) | undefined;
  const templateService = {
    addChangeListener: vi.fn((listener: (data: unknown) => void) => {
      changeListener = listener;
    }),
    createTemplateShortcutInfo: vi.fn(() => info),
    getTemplateShortcutInfo: vi.fn(async () => info),
  } as unknown as TemplateService;

  const listener = new ShortcutEventListener(logging as unknown as LoggingService, messageService, templateService);
  listener.listen();
  // `listen` primes the cache asynchronously via `getTemplateShortcutInfo().then(...)`; let that settle.
  await Promise.resolve();
  await Promise.resolve();

  const dispatch = async (event: Record<string, unknown>) => {
    await keydownHandlers[0]?.(event);
  };

  return { changeListener: () => changeListener, dispatch, logging, sendMessageAwaitResponse, templateService };
};

describe('ShortcutEventListener', () => {
  it('registers a keydown handler and primes its cache on listen', async () => {
    const { templateService } = await setup();

    expect(templateService.getTemplateShortcutInfo).toHaveBeenCalled();
    expect(templateService.addChangeListener).toHaveBeenCalled();
  });

  it('refreshes the cache when the template data changes', async () => {
    const { changeListener, templateService } = await setup();

    changeListener()?.({ some: 'data' });

    expect(templateService.createTemplateShortcutInfo).toHaveBeenCalledWith({ some: 'data' });
  });

  it('ignores a keystroke without the shortcut modifier', async () => {
    const { dispatch, sendMessageAwaitResponse } = await setup();
    const event = keydown({ altKey: false });

    await dispatch(event);

    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(sendMessageAwaitResponse).not.toHaveBeenCalled();
  });

  it('ignores a modified keystroke for a key that is not an enabled shortcut', async () => {
    const { dispatch, sendMessageAwaitResponse } = await setup(shortcutInfo({ shortcuts: ['D'] }));

    await dispatch(keydown());

    expect(sendMessageAwaitResponse).not.toHaveBeenCalled();
  });

  it('ignores shortcuts entirely when the feature is disabled', async () => {
    const { dispatch, sendMessageAwaitResponse } = await setup(shortcutInfo({ enabled: false }));

    await dispatch(keydown());

    expect(sendMessageAwaitResponse).not.toHaveBeenCalled();
  });

  it('sends an ExecuteTemplate message from the shortcut source for a matching shortcut', async () => {
    const { dispatch, sendMessageAwaitResponse } = await setup();
    const event = keydown();

    await dispatch(event);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(sendMessageAwaitResponse).toHaveBeenCalledWith(MessageType.ExecuteTemplate, {
      source: ExecuteTemplateMessageSource.Shortcut,
      shortcut: 'C',
    });
  });

  describe('auto-paste', () => {
    it('pastes the executed output into a focused input at the caret', async () => {
      const { dispatch } = await setup(shortcutInfo({ autoPasteEnabled: true }));
      const target = inputTarget({ value: 'abcd', selectionStart: 1, selectionEnd: 3 });

      await dispatch(keydown({ target }));

      expect(target.value).toBe('aPASTEDd');
    });

    it('does not paste when auto-paste is disabled', async () => {
      const { dispatch } = await setup(shortcutInfo({ autoPasteEnabled: false }));
      const target = inputTarget({ value: 'abcd', selectionStart: 1, selectionEnd: 3 });

      await dispatch(keydown({ target }));

      expect(target.value).toBe('abcd');
    });

    it('does not paste into a read-only element', async () => {
      const { dispatch } = await setup(shortcutInfo({ autoPasteEnabled: true }));
      const target = inputTarget({ value: 'abcd', selectionStart: 1, selectionEnd: 3, readOnly: true });

      await dispatch(keydown({ target }));

      expect(target.value).toBe('abcd');
    });

    it('does not paste into a disabled element', async () => {
      const { dispatch } = await setup(shortcutInfo({ autoPasteEnabled: true }));
      const target = inputTarget({ value: 'abcd', selectionStart: 1, selectionEnd: 3, disabled: true });

      await dispatch(keydown({ target }));

      expect(target.value).toBe('abcd');
    });

    it('does not paste when the target is neither an input nor a textarea', async () => {
      const { dispatch, sendMessageAwaitResponse } = await setup(shortcutInfo({ autoPasteEnabled: true }));
      const target = { nodeName: 'DIV' };

      await dispatch(keydown({ target }));

      expect(sendMessageAwaitResponse).toHaveBeenCalled();
      expect(target).toEqual({ nodeName: 'DIV' });
    });

    it('does not paste when the template was skipped rather than executed', async () => {
      const { dispatch, sendMessageAwaitResponse } = await setup(shortcutInfo({ autoPasteEnabled: true }));
      (sendMessageAwaitResponse as ReturnType<typeof vi.fn>).mockResolvedValue({
        outcome: ExecuteTemplateMessageOutcome.Skipped,
        output: 'PASTED',
      });
      const target = inputTarget({ value: 'abcd', selectionStart: 1, selectionEnd: 3 });

      await dispatch(keydown({ target }));

      expect(target.value).toBe('abcd');
    });
  });
});
