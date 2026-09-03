import { describe, expect, it, vi } from 'vitest';
import { RespondingMessageListener, VoidMessageListener } from 'extension/common/message/message-listener';
import { MessageType } from 'extension/common/message/message-type.enum';
import { type MessageSender } from 'extension/common/message/message.model';
import { type MessageService } from 'extension/common/message/message.service';

const SENDER = { id: 'sender' } as unknown as MessageSender;

class TestRespondingMessageListener extends RespondingMessageListener<{ n: number }, { doubled: number }> {
  readonly onMessage = vi.fn(async ({ n }: { n: number }) => ({ doubled: n * 2 }));

  constructor(messageService: MessageService) {
    super(messageService, MessageType.Copy);
  }
}

class TestVoidMessageListener extends VoidMessageListener<{ n: number }> {
  readonly onMessage = vi.fn(async () => undefined);

  constructor(messageService: MessageService) {
    super(messageService, MessageType.TabContent);
  }
}

describe('RespondingMessageListener', () => {
  it('registers a responding listener for its message type on listen', () => {
    const addMessageListenerWithResponse = vi.fn();
    const messageService = { addMessageListenerWithResponse } as unknown as MessageService;
    const listener = new TestRespondingMessageListener(messageService);

    listener.listen();

    expect(addMessageListenerWithResponse).toHaveBeenCalledWith(MessageType.Copy, expect.any(Function));
  });

  it('routes received messages to onMessage', async () => {
    const addMessageListenerWithResponse = vi.fn();
    const messageService = { addMessageListenerWithResponse } as unknown as MessageService;
    const listener = new TestRespondingMessageListener(messageService);

    listener.listen();
    const registered = addMessageListenerWithResponse.mock.calls[0][1];

    await expect(registered({ n: 3 }, SENDER)).resolves.toEqual({ doubled: 6 });
    expect(listener.onMessage).toHaveBeenCalledWith({ n: 3 }, SENDER);
  });
});

describe('VoidMessageListener', () => {
  it('registers a non-responding listener for its message type on listen', () => {
    const addMessageListener = vi.fn();
    const messageService = { addMessageListener } as unknown as MessageService;
    const listener = new TestVoidMessageListener(messageService);

    listener.listen();

    expect(addMessageListener).toHaveBeenCalledWith(MessageType.TabContent, expect.any(Function));
  });

  it('routes received messages to onMessage', async () => {
    const addMessageListener = vi.fn();
    const messageService = { addMessageListener } as unknown as MessageService;
    const listener = new TestVoidMessageListener(messageService);

    listener.listen();
    const registered = addMessageListener.mock.calls[0][1];

    await registered({ n: 5 }, SENDER);

    expect(listener.onMessage).toHaveBeenCalledWith({ n: 5 }, SENDER);
  });
});
