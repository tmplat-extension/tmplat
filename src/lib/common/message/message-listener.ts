import Joi from 'joi';

import { MessageType } from 'extension/common/message/message-type.enum';
import { MessageSender } from 'extension/common/message/message.model';
import { MessageService } from 'extension/common/message/message.service';

export const MessageListenerToken = Symbol('MessageListener');

export interface MessageListener {
  listen(): void;
}

export abstract class OneWayMessageListener<D> implements MessageListener {
  protected constructor(
    private readonly options: OneWayMessageListenerOptions<D>,
    private readonly messageService: MessageService,
  ) {}

  listen() {
    this.messageService.addMessageListener<D>(this.options, this.onMessage.bind(this));
  }

  protected abstract onMessage(message: D, sender: MessageSender): Promise<void>;
}

export abstract class ReturnMessageListener<D, R> implements MessageListener {
  protected constructor(
    private readonly options: ReturnMessageListenerSchemas<D, R>,
    private readonly messageService: MessageService,
  ) {}

  listen() {
    this.messageService.addMessageListenerWithReply<D>(this.options, this.onMessage.bind(this));
  }

  protected abstract onMessage(message: D, sender: MessageSender): Promise<R>;
}

export type OneWayMessageListenerOptions<D> = {
  readonly schemas: {
    readonly message: Joi.Schema<D>;
  };
  readonly type: MessageType;
};

export type ReturnMessageListenerSchemas<D, R> = {
  readonly schemas: {
    readonly message: Joi.Schema<D>;
    readonly reply: Joi.Schema<R>;
  };
  readonly type: MessageType;
};
