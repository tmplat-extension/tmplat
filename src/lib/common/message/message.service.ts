import Joi from 'joi';
import { inject, injectable } from 'extension/common/di';
import { ExtensionError } from 'extension/common/extension-error';
import { Logger } from 'extension/common/logging/logger';
import { LoggingService, LoggingServiceToken } from 'extension/common/logging/logging.service';
import { MessageIdGenerator, MessageIdGeneratorToken } from 'extension/common/message/message-id-generator';
import { MessageReplyResult } from 'extension/common/message/message-reply-result.enum';
import { MessageType } from 'extension/common/message/message-type.enum';
import { Message, MessageReply, MessageSender } from 'extension/common/message/message.model';
import { messageReplySchema, messageSchema } from 'extension/common/message/message.schema';
import { validateSchema, validateSchemaAsync } from 'extension/common/validation.utils';
import { Tab } from 'extension/tab/tab.model';

const MessageServiceName = 'MessageService';

export const MessageServiceToken = Symbol(MessageServiceName);

@injectable()
export class MessageService {
  private readonly logger: Logger;

  constructor(
    @inject(LoggingServiceToken) loggingService: LoggingService,
    @inject(MessageIdGeneratorToken) private readonly messageIdGenerator: MessageIdGenerator,
  ) {
    this.logger = loggingService.createLogger(MessageServiceName);
  }

  addMessageListener<D = unknown>(
    { type, schemas }: MessageServiceAddMessageListenerOptions<D>,
    listener: MessageServiceListener<D>,
  ): void {
    this.registerMessageListener(type, {
      listener,
      reply: false,
      schemas,
    });
  }

  addMessageListenerWithReply<D = unknown, R = unknown>(
    { type, schemas }: MessageServiceAddMessageListenerWithReplyOptions<D, R>,
    listener: MessageServiceListenerWithReply<D, R>,
  ): void {
    this.registerMessageListener(type, {
      listener,
      reply: true,
      schemas,
    });
  }

  async sendMessage<D = unknown>(type: MessageType, data: D): Promise<void> {
    const id = this.messageIdGenerator.generate();

    this.logger.trace(`Sending '${type}' message[${id}]:`, data);

    await browser.runtime.sendMessage({ data, id, type });
  }

  async sendMessageAndAwaitReply<D = unknown, R = unknown>(type: MessageType, data: D): Promise<R> {
    const id = this.messageIdGenerator.generate();

    this.logger.trace(`Sending '${type}' message[${id}]:`, data);

    const response = await browser.runtime.sendMessage({ data, id, type });
    const reply = await validateSchemaAsync<MessageReply>(messageReplySchema, response, {
      // TODO: Localise error message and use ExtensionError instead?
      general: (error) => new Error(`Message reply was invalid: ${error?.message}`),
      undefinedValue: () => new Error('Message reply cannot be validated'),
    });

    if (reply.result === MessageReplyResult.Failure) {
      throw new ExtensionError(reply.reason);
    }

    return reply.data as R;
  }

  private registerMessageListener<D, R>(type: MessageType, messageListener: MessageServiceListenerConfig<D, R>): void {
    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
      let validMessage: Message;

      try {
        validMessage = validateSchema(messageSchema, message, {
          // TODO: Localise error message and use ExtensionError instead?
          general: (error) => new Error(`Message was invalid: ${error?.message}`),
          undefinedValue: () => new Error('Message cannot be validated'),
        });
      } catch (e) {
        this.logger.error(`Failed to validate '${type}' message against schema:`, e);
        return false;
      }

      if (validMessage.type !== type) {
        return false;
      }

      this.logger.trace(`Received '${validMessage.type}' message[${validMessage.id}]:`, message.data);

      const messageSender = MessageService.toMessageSender(sender);

      if (messageListener.reply) {
        messageListener.listener(validMessage.data as D, messageSender).then(
          (response) => {
            this.logger.trace(`Replying to '${validMessage.type}' message[${validMessage.id}]:`, response);

            sendResponse({
              data: response,
              id: validMessage.id,
              result: MessageReplyResult.Success,
            } as MessageReply);
          },
          (error: Error) => {
            this.logger.error(`Failed to process '${validMessage.type}' message[${validMessage.id}]:`, error);

            // TODO: Localise fallback reason
            sendResponse({
              id: validMessage.id,
              reason: error instanceof ExtensionError ? error.message : 'Failed to reply to message',
              result: MessageReplyResult.Failure,
            } as MessageReply);
          },
        );
        return true;
      }

      messageListener.listener(validMessage.data as D, messageSender).catch((error: Error) => {
        this.logger.error(`Failed to process '${validMessage.type}' message[${validMessage.id}]:`, error);
      });
      return false;
    });
  }

  private static toMessageSender(sender: browser.runtime.MessageSender): MessageSender {
    return {
      extensionId: sender.id,
      frameId: sender.frameId,
      tab: sender.tab as Tab | undefined,
      url: sender.url,
    };
  }
}

export type MessageServiceAddMessageListenerOptions<D> = {
  readonly schemas: {
    readonly message: Joi.Schema<D>;
  };
  readonly type: MessageType;
};

export type MessageServiceAddMessageListenerWithReplyOptions<D, R> = {
  readonly schemas: {
    readonly message: Joi.Schema<D>;
    readonly reply: Joi.Schema<R>;
  };
  readonly type: MessageType;
};

export type MessageServiceListener<D> = (data: D, sender: MessageSender) => Promise<void>;

export type MessageServiceListenerWithReply<D, R> = (data: D, sender: MessageSender) => Promise<R>;

type MessageServiceListenerConfig<D, R> =
  | {
      readonly listener: MessageServiceListener<D>;
      readonly reply: false;
      readonly schemas: {
        readonly message: Joi.Schema<D>;
      };
    }
  | {
      readonly listener: MessageServiceListenerWithReply<D, R>;
      readonly reply: true;
      readonly schemas: {
        readonly message: Joi.Schema<D>;
        readonly reply: Joi.Schema<R>;
      };
    };
