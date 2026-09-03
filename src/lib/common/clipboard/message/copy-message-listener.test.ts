import { afterEach, describe, expect, it, vi } from 'vitest';
import { CopyMessageListener } from 'extension/common/clipboard/message/copy-message-listener';
import { MessageType } from 'extension/common/message/message-type.enum';
import { type MessageService } from 'extension/common/message/message.service';

// jsdom does not implement `execCommand` at all, so there is nothing for `vi.spyOn` to wrap - it has to be defined
// on `document` outright, and removed again afterwards since `restoreMocks` only knows about spies.
const stubExecCommand = (implementation: () => boolean) => {
  const execCommand = vi.fn(implementation);
  Object.defineProperty(document, 'execCommand', { configurable: true, value: execCommand, writable: true });

  return execCommand;
};

afterEach(() => {
  Reflect.deleteProperty(document, 'execCommand');
});

const setup = () => {
  const addMessageListenerWithResponse = vi.fn();
  const messageService = { addMessageListenerWithResponse } as unknown as MessageService;
  const listener = new CopyMessageListener(messageService);

  listener.listen();

  const [type, handler] = addMessageListenerWithResponse.mock.calls[0] as [
    MessageType,
    (input: { content: string }) => Promise<{ copied: boolean }>,
  ];

  return { handler, type };
};

/**
 * The offscreen document's half of the copy pipeline. `navigator.clipboard` needs a focused document and an offscreen
 * document can never be focused, so this is the one place that still depends on `document.execCommand('copy')` - and
 * the temporary textarea it copies through has to be in the document and selected at the moment the command runs.
 */
describe('CopyMessageListener', () => {
  it('registers itself for copy messages', () => {
    const { type } = setup();

    expect(type).toBe(MessageType.Copy);
  });

  it('copies the content through a textarea that is selected and in the document', async () => {
    const { handler } = setup();
    let selectedValue: string | undefined;
    let connectedWhenSelected: boolean | undefined;
    // Captured from inside `select()` rather than asserted afterwards, because the textarea is removed again before
    // the handler resolves. This is what pins the ordering the copy actually depends on: the content is in the
    // textarea, and the textarea is in the document, at the moment the selection is made.
    const select = vi.spyOn(HTMLTextAreaElement.prototype, 'select').mockImplementation(function (
      this: HTMLTextAreaElement,
    ) {
      selectedValue = this.value;
      connectedWhenSelected = this.isConnected;
    });
    const execCommand = stubExecCommand(() => true);

    await expect(handler({ content: 'multi\nline' })).resolves.toEqual({ copied: true });

    expect(select).toHaveBeenCalledOnce();
    expect(selectedValue).toBe('multi\nline');
    expect(connectedWhenSelected).toBe(true);
    expect(execCommand).toHaveBeenCalledWith('copy');
  });

  it('reports a failed copy', async () => {
    const { handler } = setup();
    stubExecCommand(() => false);

    await expect(handler({ content: 'anything' })).resolves.toEqual({ copied: false });
  });

  it('removes the textarea even when copying throws', async () => {
    const { handler } = setup();
    stubExecCommand(() => {
      throw new Error('boom');
    });

    await expect(handler({ content: 'anything' })).rejects.toThrow('boom');

    expect(document.querySelector('textarea')).toBeNull();
  });

  it('leaves no textarea behind after a successful copy', async () => {
    const { handler } = setup();
    stubExecCommand(() => true);

    await handler({ content: 'anything' });

    expect(document.querySelector('textarea')).toBeNull();
  });
});
