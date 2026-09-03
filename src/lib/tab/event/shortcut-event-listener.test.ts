import { describe, expect, it, vi } from 'vitest';
import { type LoggingService } from 'extension/common/logging/logging.service';
import { MessageType } from 'extension/common/message/message-type.enum';
import { type MessageService } from 'extension/common/message/message.service';
import { ShortcutEventListener } from 'extension/tab/event/shortcut-event-listener';
import { ExecuteTemplateMessageOutcome } from 'extension/template/message/execute-template-message-outcome.enum';
import { ExecuteTemplateMessageSource } from 'extension/template/message/execute-template-message-source.enum';
import { type TemplateShortcutInfo } from 'extension/template/template.service';
import { createLoggingServiceMock } from 'extension/test/logger.mock';

type Handler = (event: unknown) => unknown;

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
  code: 'KeyC',
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
  const getTemplateShortcutInfo = vi.fn(async () => info);
  const executeTemplate = vi.fn(async () => ({
    outcome: ExecuteTemplateMessageOutcome.Executed,
    output: 'PASTED',
  }));
  const sendMessageAwaitResponse = vi.fn(async (type: MessageType) =>
    type === MessageType.TemplateShortcutInfo ? await getTemplateShortcutInfo() : await executeTemplate(),
  );
  let changeListener: (() => unknown) | undefined;
  const addMessageListener = vi.fn((type: MessageType, handler: () => unknown) => {
    if (type === MessageType.TemplateShortcutInfoChanged) {
      changeListener = handler;
    }
  });
  const messageService = { addMessageListener, sendMessageAwaitResponse } as unknown as MessageService;

  const listener = new ShortcutEventListener(logging as unknown as LoggingService, messageService);
  listener.listen();
  // `listen` primes the cache asynchronously via the shortcut info message; let that settle.
  await Promise.resolve();
  await Promise.resolve();

  const dispatch = async (event: Record<string, unknown>) => {
    await keydownHandlers[0]?.(event);
  };

  return {
    addMessageListener,
    changeListener: () => changeListener,
    dispatch,
    executeTemplate,
    getTemplateShortcutInfo,
    logging,
    sendMessageAwaitResponse,
  };
};

describe('ShortcutEventListener', () => {
  it('registers a keydown handler and primes its cache on listen', async () => {
    const { addMessageListener, getTemplateShortcutInfo } = await setup();

    expect(getTemplateShortcutInfo).toHaveBeenCalled();
    expect(addMessageListener).toHaveBeenCalledWith(MessageType.TemplateShortcutInfoChanged, expect.any(Function));
  });

  it('refreshes the cache when the worker broadcasts a template change', async () => {
    const { changeListener, getTemplateShortcutInfo } = await setup();

    getTemplateShortcutInfo.mockClear();
    await changeListener()?.();

    expect(getTemplateShortcutInfo).toHaveBeenCalledTimes(1);
  });

  it('ignores a keystroke without the shortcut modifier', async () => {
    const { dispatch, executeTemplate } = await setup();
    const event = keydown({ altKey: false });

    await dispatch(event);

    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(executeTemplate).not.toHaveBeenCalled();
  });

  it('ignores a modified keystroke for a key that is not an enabled shortcut', async () => {
    const { dispatch, executeTemplate } = await setup(shortcutInfo({ shortcuts: ['D'] }));

    await dispatch(keydown());

    expect(executeTemplate).not.toHaveBeenCalled();
  });

  /*
   * `event.code` names the physical key, which is the only one of the three that survives the shortcut modifier: the
   * macOS combination includes Shift, so `event.key` for a digit is the shifted symbol (`!`, not `1`), and Ctrl+Alt
   * is AltGr on many layouts. Measured in real Chromium - Shift+Alt+Digit1 reports `key: '!'`, `code: 'Digit1'`.
   */
  it('matches a digit shortcut, which the shifted `key` could not', async () => {
    const { dispatch, executeTemplate } = await setup(shortcutInfo({ shortcuts: ['1'] }));

    await dispatch(keydown({ code: 'Digit1', key: '!' }));

    expect(executeTemplate).toHaveBeenCalledTimes(1);
  });

  it.each(['Enter', 'ArrowLeft', 'Space', 'Numpad1', 'F1'])('ignores the non-shortcut key %s', async (code) => {
    const { dispatch, executeTemplate } = await setup(shortcutInfo({ shortcuts: ['C', '1'] }));

    await dispatch(keydown({ code }));

    expect(executeTemplate).not.toHaveBeenCalled();
  });

  it('ignores shortcuts entirely when the feature is disabled', async () => {
    const { dispatch, executeTemplate } = await setup(shortcutInfo({ enabled: false }));

    await dispatch(keydown());

    expect(executeTemplate).not.toHaveBeenCalled();
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
      const { dispatch, executeTemplate } = await setup(shortcutInfo({ autoPasteEnabled: true }));
      const target = { nodeName: 'DIV' };

      await dispatch(keydown({ target }));

      expect(executeTemplate).toHaveBeenCalled();
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

  /*
   * The cache is primed asynchronously, so a keystroke can land before it is ready - which used to mean the shortcut
   * silently did nothing at all (the documented cold-profile `DAT404000` case). The listener now waits for the
   * in-flight load, at the cost of `preventDefault()`, which has no effect once a handler has awaited.
   */
  describe('cache priming', () => {
    const primeSetup = () => {
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
      let settle!: { reject: (error: unknown) => void; resolve: (info: TemplateShortcutInfo) => void };
      const getTemplateShortcutInfo = vi.fn(
        () => new Promise<TemplateShortcutInfo>((resolve, reject) => (settle = { reject, resolve })),
      );
      const executeTemplate = vi.fn(async () => ({
        outcome: ExecuteTemplateMessageOutcome.Executed,
        output: 'PASTED',
      }));
      const sendMessageAwaitResponse = vi.fn(async (type: MessageType) =>
        type === MessageType.TemplateShortcutInfo ? await getTemplateShortcutInfo() : await executeTemplate(),
      );

      const listener = new ShortcutEventListener(
        logging as unknown as LoggingService,
        {
          addMessageListener: vi.fn(),
          sendMessageAwaitResponse,
        } as unknown as MessageService,
      );
      listener.listen();

      return {
        dispatch: async (event: Record<string, unknown>) => await keydownHandlers[0]?.(event),
        executeTemplate,
        getTemplateShortcutInfo,
        logging,
        reject: (error: unknown) => settle.reject(error),
        resolve: (info: TemplateShortcutInfo) => settle.resolve(info),
        sendMessageAwaitResponse,
      };
    };

    it('honours a keystroke that arrives before the cache is ready', async () => {
      const { dispatch, executeTemplate, resolve } = primeSetup();
      const event = keydown();

      const handled = dispatch(event);
      resolve(shortcutInfo());
      await handled;

      expect(executeTemplate).toHaveBeenCalledTimes(1);
      // Losing the suppression for this one keystroke is the deliberate trade for not losing the copy entirely.
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('suppresses the browser default once the cache is primed', async () => {
      const { dispatch, resolve } = primeSetup();

      resolve(shortcutInfo());
      await Promise.resolve();
      await Promise.resolve();

      const event = keydown();
      await dispatch(event);

      expect(event.preventDefault).toHaveBeenCalledTimes(1);
    });

    /*
     * A transient failure must not leave the page with dead shortcuts for the rest of its lifetime. Before this, the
     * load settled exactly once, so every later keystroke awaited an already-settled promise and found an empty
     * cache - the only way back was the user changing their settings.
     */
    it('retries the load on a later keystroke after a failure', async () => {
      const { dispatch, executeTemplate, getTemplateShortcutInfo, reject, resolve } = primeSetup();

      const failed = dispatch(keydown());
      reject(new Error('transient'));
      await failed;

      expect(executeTemplate).not.toHaveBeenCalled();

      const retried = dispatch(keydown());
      await Promise.resolve();
      resolve(shortcutInfo());
      await retried;

      expect(getTemplateShortcutInfo).toHaveBeenCalledTimes(2);
      expect(executeTemplate).toHaveBeenCalledTimes(1);
    });

    // A burst of keystrokes during a slow load must share the one request rather than stampeding the storage layer.
    it('shares a single in-flight load across concurrent keystrokes', async () => {
      const { dispatch, getTemplateShortcutInfo, resolve } = primeSetup();

      const first = dispatch(keydown());
      const second = dispatch(keydown());
      resolve(shortcutInfo());
      await Promise.all([first, second]);

      expect(getTemplateShortcutInfo).toHaveBeenCalledOnce();
    });

    it('does not hang when the initial cache load fails', async () => {
      const { dispatch, executeTemplate, logging, reject } = primeSetup();

      const handled = dispatch(keydown());
      reject(new Error('unavailable'));

      await expect(handled).resolves.toBeUndefined();
      expect(executeTemplate).not.toHaveBeenCalled();
      expect(logging.logger.error).toHaveBeenCalledWith('Failed to get template settings', expect.any(Error));
    });
  });
});
