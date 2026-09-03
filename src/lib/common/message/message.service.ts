import { inject, injectable, multiInject } from 'extension/common/di';
import { ExtensionError } from 'extension/common/error/extension-error';
import { type Logger } from 'extension/common/logging/logger';
import { type LoggingService, LoggingServiceToken } from 'extension/common/logging/logging.service';
import { mapMessageConfigs, type MessageConfig, MessageConfigToken } from 'extension/common/message/message-config';
import { type MessageIdGenerator, MessageIdGeneratorToken } from 'extension/common/message/message-id-generator';
import { type MessageType } from 'extension/common/message/message-type.enum';
import { type MessageSender } from 'extension/common/message/message.model';
import {
  type MessageInput,
  MessageInputSchema,
  type MessageOutputFailure,
  MessageOutputSchema,
  type MessageOutputSuccess,
} from 'extension/common/message/message.schema';
import { type ValidationService, ValidationServiceToken } from 'extension/common/validation/validation.service';

const MessageServiceName = 'MessageService';

export const MessageServiceToken = Symbol(MessageServiceName);

@injectable()
export class MessageService {
  private readonly configs: ReadonlyMap<MessageType, MessageConfig<unknown, unknown>>;
  private readonly logger: Logger;

  constructor(
    @inject(LoggingServiceToken) logging: LoggingService,
    @multiInject(MessageConfigToken) messageConfigs: Array<MessageConfig<unknown, unknown>>,
    @inject(MessageIdGeneratorToken) private readonly messageIdGenerator: MessageIdGenerator,
    @inject(ValidationServiceToken) private readonly validationService: ValidationService,
  ) {
    this.configs = mapMessageConfigs(messageConfigs);
    this.logger = logging.getLogger(MessageServiceName);
  }

  addMessageListener<Input>(type: MessageType, listener: MessageServiceListener<Input>): void {
    this.registerMessageListener(type, listener);
  }

  addMessageListenerWithResponse<Input, Output>(
    type: MessageType,
    listener: MessageServiceListenerWithResponse<Input, Output>,
  ): void {
    this.registerMessageListener(type, listener);
  }

  async sendMessage<Input>(type: MessageType, input: Input): Promise<void> {
    const config = this.getConfig<Input, void>(type);
    const id = this.messageIdGenerator.generate();

    this.logger.trace(`Sending '${type}' message[${id}]:`, input);

    if (config.responds) {
      throw ExtensionError.from('MSG400200', type);
    }

    const data = this.validationService.validateSchema(input, config.schemas.input, {
      code: 'MSG400000',
      parentLogger: this.logger,
      substitutions: [type],
    });

    await browser.runtime.sendMessage({ data, id, type } satisfies MessageInput);
  }

  async sendMessageAwaitResponse<Input, Output>(type: MessageType, input: Input): Promise<Output> {
    const config = this.getConfig<Input, Output>(type);
    const id = this.messageIdGenerator.generate();

    this.logger.trace(`Sending '${type}' message[${id}]:`, input);

    if (!config.responds) {
      throw ExtensionError.from('MSG400201', type);
    }

    const data = this.validationService.validateSchema(input, config.schemas.input, {
      code: 'MSG400000',
      parentLogger: this.logger,
      substitutions: [type],
    });

    const response = await browser.runtime.sendMessage({ data, id, type } satisfies MessageInput);
    const output = this.validationService.validateSchema(response, MessageOutputSchema, {
      code: 'MSG422000',
      parentLogger: this.logger,
      substitutions: [type],
    });

    if (output.result === 'failure') {
      throw ExtensionError.fromJSON(output.error, { logger: this.logger });
    }

    return this.validationService.validateSchema(output.data, config.schemas.output, {
      code: 'MSG422000',
      parentLogger: this.logger,
      substitutions: [type],
    });
  }

  private getConfig<Input, Output>(type: MessageType): MessageConfig<Input, Output> {
    const config = this.configs.get(type);
    if (!config) {
      this.logger.error('Failed to find message config for type:', type);

      throw ExtensionError.from('MSG404100', type);
    }

    return config as MessageConfig<Input, Output>;
  }

  private registerMessageListener<Input, Output>(
    type: MessageType,
    listener: MessageServiceListener<Input> | MessageServiceListenerWithResponse<Input, Output>,
  ): void {
    const config = this.getConfig<Input, Output>(type);

    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
      let validMessage: MessageInput;

      try {
        validMessage = this.validationService.validateSchema(message, MessageInputSchema, {
          code: 'MSG400101',
          parentLogger: this.logger,
          substitutions: [type],
        });
      } catch (e) {
        this.logger.error('Failed to validate message against schema:', e, { message });
        return false;
      }

      if (validMessage.type !== type) {
        return false;
      }

      this.logger.trace(`Received '${validMessage.type}' message[${validMessage.id}]:`, message.data);

      if (config.responds) {
        MessageService.invokeListener(listener, validMessage.data as Input, sender as MessageSender)
          .then((output) => {
            this.logger.trace(`Replying to '${validMessage.type}' message[${validMessage.id}]:`, output);

            const data = this.validationService.validateSchema(output, config.schemas.output, {
              code: 'MSG400100',
              parentLogger: this.logger,
              substitutions: [type],
            });

            sendResponse({
              data,
              id: validMessage.id,
              result: 'success',
            } satisfies MessageOutputSuccess);
          })
          .catch((error) => {
            this.logger.error(`Failed to process '${validMessage.type}' message[${validMessage.id}]:`, error);

            sendResponse({
              error: ExtensionError.fallback(error, 'MSG400101', type).toJSON(),
              id: validMessage.id,
              result: 'failure',
            } satisfies MessageOutputFailure);
          });
        return true;
      }

      MessageService.invokeListener(listener, validMessage.data as Input, sender as MessageSender).catch((error) => {
        this.logger.error(`Failed to process '${validMessage.type}' message[${validMessage.id}]:`, error);
      });
      return false;
    });
  }

  /**
   * Invokes `listener`, ensuring that a listener which throws *synchronously* produces a rejected promise rather than
   * an exception escaping into `browser.runtime`.
   *
   * Listeners are typed as returning a promise, so this only matters for a non-`async` listener that throws before
   * returning one. Since the call happens before any `.then`/`.catch` is attached, such an error would otherwise
   * bypass the rejection handling entirely and leave the sender without a response.
   */
  private static invokeListener<Input, Output>(
    listener: MessageServiceListener<Input> | MessageServiceListenerWithResponse<Input, Output>,
    input: Input,
    sender: MessageSender,
  ): Promise<Awaited<ReturnType<typeof listener>>> {
    try {
      return Promise.resolve(listener(input, sender)) as Promise<Awaited<ReturnType<typeof listener>>>;
    } catch (e) {
      return Promise.reject(e);
    }
  }
}

export type MessageServiceListener<Input> = (input: Input, sender: MessageSender) => Promise<void>;

export type MessageServiceListenerWithResponse<Input, Output> = (
  input: Input,
  sender: MessageSender,
) => Promise<Output>;
