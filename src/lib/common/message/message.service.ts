import Joi from 'joi';

import { inject, injectable } from 'extension/common/di';
import { ExtensionError } from 'extension/common/extension-error';
import { LogService, LogServiceToken } from 'extension/common/log/log.service';
import { Logger } from 'extension/common/log/logger';
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
    @inject(LogServiceToken) logService: LogService,
    @inject(MessageIdGeneratorToken) private readonly messageIdGenerator: MessageIdGenerator,
  ) {
    this.logger = logService.createLogger(MessageServiceName);
  }

  addMessageListener<D = any>(
    { type, schemas }: MessageServiceAddMessageListenerOptions<D>,
    listener: MessageServiceListener<D>,
  ) {
    this.registerMessageListener(type, {
      listener,
      reply: false,
      schemas,
    });
  }

  addMessageListenerWithReply<D = any, R = any>(
    { type, schemas }: MessageServiceAddMessageListenerWithReplyOptions<D, R>,
    listener: MessageServiceListenerWithReply<D, R>,
  ) {
    this.registerMessageListener(type, {
      listener,
      reply: true,
      schemas,
    });
  }

  sendMessage<D = any>(type: MessageType, data: D) {
    const id = this.messageIdGenerator.generate();

    this.logger.trace(`Sending '${type}' message[${id}]:`, data);

    chrome.runtime.sendMessage({ data, id, type });
  }

  async sendMessageAndAwaitReply<D = any, R = any>(type: MessageType, data: D): Promise<R> {
    const id = this.messageIdGenerator.generate();

    this.logger.trace(`Sending '${type}' message[${id}]:`, data);

    const response = await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ data, id, type }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    });

    const reply = await validateSchemaAsync<MessageReply>(messageReplySchema, response, {
      // TODO: Localise error message and use ExtensionError instead?
      general: (error) => new Error(`Message reply was invalid: ${error?.message}`),
      undefinedValue: () => new Error('Message reply cannot be validated'),
    });

    if (reply.result === MessageReplyResult.Failure) {
      throw new ExtensionError(reply.reason);
    }

    return reply.data;
  }

  private registerMessageListener(type: MessageType, messageListener: MessageServiceListenerConfig) {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      let validMessage: Message;

      try {
        validMessage = validateSchema(messageSchema, message, {
          // TODO: Localise error message and use ExtensionError instead?
          general: (error) => new Error(`Message was invalid: ${error?.message}`),
          undefinedValue: () => new Error('Message cannot be validated'),
        });
      } catch (e) {
        this.logger.error(e);
        return false;
      }

      if (validMessage.type !== type) {
        return false;
      }

      this.logger.trace(`Received '${validMessage.type}' message[${validMessage.id}]:`, message.data);

      // const messageSender = MessageService.toMessageSender(sender);
      //
      // if (messageListener.reply) {
      //   messageListener.listener(validMessage.data, messageSender).then(
      //     (response) => {
      //       this.logger.trace(`Replying to '${validMessage.type}' message[${validMessage.id}]:`, response);
      //
      //       sendResponse({
      //         data: response,
      //         id: validMessage.id,
      //         result: MessageReplyResult.Success,
      //       } as MessageReply);
      //     },
      //     (error) => {
      //       this.logger.error(`Failed to reply to '${validMessage.type}' message[${validMessage.id}]:`, error);
      //
      //       // TODO: Localise fallback reason
      //       sendResponse({
      //         id: validMessage.id,
      //         reason: error instanceof ExtensionError ? error.message : 'Failed to reply to message',
      //         result: MessageReplyResult.Failure,
      //       } as MessageReply);
      //     },
      //   );
      //   return true;
      // }
      //
      // messageListener.listener(message.data, messageSender);
      // return false;

      messageListener.listener(validMessage.data, MessageService.toMessageSender(sender)).then(
        (response) => {
          if (messageListener.reply) {
            this.logger.trace(`Replying to '${validMessage.type}' message[${validMessage.id}]:`, response);

            sendResponse({
              data: response,
              id: validMessage.id,
              result: MessageReplyResult.Success,
            } as MessageReply);
          } else {
            this.logger.trace(`Replying to '${validMessage.type}' message[${validMessage.id}]`);

            sendResponse({
              data: null,
              id: validMessage.id,
              result: MessageReplyResult.Success,
            } as MessageReply);
          }
        },
        (error) => {
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
    });
  }

  private static toMessageSender(sender: chrome.runtime.MessageSender): MessageSender {
    return {
      extensionId: sender.id,
      frameId: sender.frameId,
      tab: sender.tab as Tab | undefined,
      url: sender.url,
    };
  }
}

export type MessageServiceAddMessageListenerOptions<D = any> = {
  readonly schemas: {
    readonly message: Joi.Schema<D>;
  };
  readonly type: MessageType;
};

export type MessageServiceAddMessageListenerWithReplyOptions<D = any, R = any> = {
  readonly schemas: {
    readonly message: Joi.Schema<D>;
    readonly reply: Joi.Schema<R>;
  };
  readonly type: MessageType;
};

export type MessageServiceListener<D = any> = (data: D, sender: MessageSender) => Promise<void>;

export type MessageServiceListenerWithReply<D = any, R = any> = (data: D, sender: MessageSender) => Promise<R>;

type MessageServiceListenerConfig =
  | {
      readonly listener: MessageServiceListener;
      readonly reply: false;
      readonly schemas: {
        readonly message: Joi.Schema;
      };
    }
  | {
      readonly listener: MessageServiceListenerWithReply;
      readonly reply: true;
      readonly schemas: {
        readonly message: Joi.Schema;
        readonly reply: Joi.Schema;
      };
    };
