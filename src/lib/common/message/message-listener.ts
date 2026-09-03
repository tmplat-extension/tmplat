import { type MessageType } from 'extension/common/message/message-type.enum';
import { type MessageSender } from 'extension/common/message/message.model';
import { type MessageService } from 'extension/common/message/message.service';

export const MessageListenerToken = Symbol('MessageListener');

export interface MessageListener {
  listen(): void;
}

export abstract class RespondingMessageListener<Input, Output> implements MessageListener {
  protected constructor(
    private readonly messageService: MessageService,
    private readonly messageType: MessageType,
  ) {}

  listen() {
    this.messageService.addMessageListenerWithResponse(this.messageType, this.onMessage.bind(this));
  }

  protected abstract onMessage(input: Input, sender: MessageSender): Promise<Output>;
}

export abstract class VoidMessageListener<Input> implements MessageListener {
  protected constructor(
    private readonly messageService: MessageService,
    private readonly messageType: MessageType,
  ) {}

  listen() {
    this.messageService.addMessageListener(this.messageType, this.onMessage.bind(this));
  }

  protected abstract onMessage(input: Input, sender: MessageSender): Promise<void>;
}
