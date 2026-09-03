import { describe, expect, it, vi } from 'vitest';
import { type LoggingService } from 'extension/common/logging/logging.service';
import { MessageType } from 'extension/common/message/message-type.enum';
import { type MessageService } from 'extension/common/message/message.service';
import { ContextMenuTargetHolder } from 'extension/common/state/context-menu-target-holder';
import { PasteMessageListener } from 'extension/tab/message/paste-message-listener';
import { createLoggingServiceMock, type LoggingServiceMock } from 'extension/test/logger.mock';

const setup = (target?: Element) => {
  const contextMenuTargetHolder = new ContextMenuTargetHolder();
  if (target) {
    contextMenuTargetHolder.set(target);
  }

  const logging: LoggingServiceMock = createLoggingServiceMock();
  const addMessageListener = vi.fn();
  const messageService = { addMessageListener } as unknown as MessageService;
  const listener = new PasteMessageListener(
    contextMenuTargetHolder,
    logging as unknown as LoggingService,
    messageService,
  );

  listener.listen();

  const [type, handler] = addMessageListener.mock.calls[0] as [
    MessageType,
    (input: { value: string }) => Promise<void>,
  ];

  return { addMessageListener, contextMenuTargetHolder, handler, logging, type };
};

type InputOptions = {
  disabled?: boolean;
  readOnly?: boolean;
};

const createInput = (value = '', { disabled, readOnly }: InputOptions = {}) => {
  const input = document.createElement('input');
  input.value = value;
  input.disabled = disabled ?? false;
  input.readOnly = readOnly ?? false;

  return input;
};

describe('PasteMessageListener', () => {
  it('registers itself for paste messages', () => {
    const { type } = setup();

    expect(type).toBe(MessageType.Paste);
  });

  it('pastes into the element the context menu was opened on', async () => {
    const input = createInput('start end');
    input.setSelectionRange(6, 6);
    const { handler } = setup(input);

    await handler({ value: 'middle ' });

    expect(input.value).toBe('start middle end');
  });

  it('pastes into a textarea', async () => {
    const textArea = document.createElement('textarea');
    const { handler } = setup(textArea);

    await handler({ value: 'output' });

    expect(textArea.value).toBe('output');
  });

  /*
   * The worker decides whether to *ask* for a paste from Chrome's `OnClickData.editable`, which is true for
   * `contenteditable` elements too, and the recorded target can be cleared by a blur/click between the menu opening
   * and an item being chosen. The content script owns the element, so it makes the final decision.
   */
  it('ignores the message when no target was recorded', async () => {
    const { handler, logging } = setup();

    await expect(handler({ value: 'output' })).resolves.toBeUndefined();
    expect(logging.logger.debug).toHaveBeenCalledWith(expect.stringContaining('no editable target'));
  });

  it('ignores the message when the recorded target is not a field', async () => {
    const div = document.createElement('div');
    div.contentEditable = 'true';
    const { handler, logging } = setup(div);

    await handler({ value: 'output' });

    expect(div.textContent).toBe('');
    expect(logging.logger.debug).toHaveBeenCalledWith(expect.stringContaining('no editable target'));
  });

  it.each([
    ['read-only', { readOnly: true }],
    ['disabled', { disabled: true }],
  ])('does not write into a %s field', async (_name, overrides) => {
    const input = createInput('original', overrides);
    const { handler, logging } = setup(input);

    await handler({ value: 'output' });

    expect(input.value).toBe('original');
    expect(logging.logger.debug).toHaveBeenCalledWith(expect.stringContaining('cannot be written to'));
  });

  // The target survives the paste, because the same field can legitimately be used for a second copy
  it('leaves the recorded target in place', async () => {
    const input = createInput();
    const { contextMenuTargetHolder, handler } = setup(input);

    await handler({ value: 'output' });

    expect(contextMenuTargetHolder.get()).toBe(input);
  });
});
