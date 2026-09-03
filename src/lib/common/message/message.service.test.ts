import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { type LoggingService } from 'extension/common/logging/logging.service';
import {
  defineMessageConfig,
  defineMessageConfigWithResponse,
  type MessageConfig,
} from 'extension/common/message/message-config';
import { type MessageIdGenerator } from 'extension/common/message/message-id-generator';
import { MessageType } from 'extension/common/message/message-type.enum';
import { type MessageSender } from 'extension/common/message/message.model';
import { MessageService } from 'extension/common/message/message.service';
import { ValidationService } from 'extension/common/validation/validation.service';
import { createLoggingServiceMock, type LoggingServiceMock } from 'extension/test/logger.mock';
import { installRuntimeMessagingFake, type RuntimeMessagingFake } from 'extension/test/messaging.fake';

const MESSAGE_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const RESPONSE_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const SENDER = { id: 'sender' } as unknown as MessageSender;

const COPY_CONFIG = defineMessageConfigWithResponse(MessageType.Copy, {
  input: z.object({ content: z.string() }),
  output: z.object({ copied: z.boolean() }),
});

const TAB_CONTENT_CONFIG = defineMessageConfig(MessageType.TabContent, {
  input: z.object({ tabId: z.number() }),
});

const failureError = () => ({
  code: 'CLI500000',
  message: 'boom',
  name: 'ExtensionError(CLI500000)',
});

describe('MessageService', () => {
  let logging: LoggingServiceMock;
  let runtime: RuntimeMessagingFake;
  let service: MessageService;

  const createService = (configs = [COPY_CONFIG, TAB_CONTENT_CONFIG] as Array<MessageConfig<unknown, unknown>>) => {
    const messageIdGenerator = { generate: vi.fn(() => MESSAGE_ID) } as unknown as MessageIdGenerator;
    return new MessageService(
      logging as unknown as LoggingService,
      configs,
      messageIdGenerator,
      new ValidationService(createLoggingServiceMock() as never),
    );
  };

  beforeEach(() => {
    logging = createLoggingServiceMock();
    runtime = installRuntimeMessagingFake();
    service = createService();
  });

  describe('sendMessage', () => {
    it('posts a message with the generated id, type and validated data for a non-responding type', async () => {
      runtime.sendMessage.mockResolvedValue(undefined);

      await service.sendMessage(MessageType.TabContent, { tabId: 7 });

      expect(runtime.sendMessage).toHaveBeenCalledWith({
        data: { tabId: 7 },
        id: MESSAGE_ID,
        type: MessageType.TabContent,
      });
    });

    it('rejects with MSG400200 when used for a type that expects a response', async () => {
      await expect(service.sendMessage(MessageType.Copy, { content: 'hi' })).rejects.toMatchObject({
        code: 'MSG400200',
      });
      expect(runtime.sendMessage).not.toHaveBeenCalled();
    });

    it('rejects with MSG400000 when the input fails its schema', async () => {
      await expect(service.sendMessage(MessageType.TabContent, { tabId: 'nope' })).rejects.toMatchObject({
        code: 'MSG400000',
      });
      expect(runtime.sendMessage).not.toHaveBeenCalled();
    });

    it('rejects with MSG404100 for an unregistered message type', async () => {
      await expect(service.sendMessage(MessageType.Geolocation, {})).rejects.toMatchObject({ code: 'MSG404100' });
    });
  });

  describe('sendMessageAwaitResponse', () => {
    it('returns the validated response data on success', async () => {
      runtime.sendMessage.mockResolvedValue({ data: { copied: true }, id: RESPONSE_ID, result: 'success' });

      await expect(service.sendMessageAwaitResponse(MessageType.Copy, { content: 'hi' })).resolves.toEqual({
        copied: true,
      });
      expect(runtime.sendMessage).toHaveBeenCalledWith({
        data: { content: 'hi' },
        id: MESSAGE_ID,
        type: MessageType.Copy,
      });
    });

    it('rejects with MSG400201 when used for a type that expects no response', async () => {
      await expect(service.sendMessageAwaitResponse(MessageType.TabContent, { tabId: 1 })).rejects.toMatchObject({
        code: 'MSG400201',
      });
      expect(runtime.sendMessage).not.toHaveBeenCalled();
    });

    it('rejects with MSG400000 when the input fails its schema', async () => {
      await expect(service.sendMessageAwaitResponse(MessageType.Copy, { content: 123 })).rejects.toMatchObject({
        code: 'MSG400000',
      });
      expect(runtime.sendMessage).not.toHaveBeenCalled();
    });

    it('rethrows the original error carried by a failure response', async () => {
      runtime.sendMessage.mockResolvedValue({ error: failureError(), id: RESPONSE_ID, result: 'failure' });

      await expect(service.sendMessageAwaitResponse(MessageType.Copy, { content: 'hi' })).rejects.toMatchObject({
        code: 'CLI500000',
      });
    });

    it('rejects with MSG422000 when the response does not match the output envelope', async () => {
      runtime.sendMessage.mockResolvedValue({ unexpected: true });

      await expect(service.sendMessageAwaitResponse(MessageType.Copy, { content: 'hi' })).rejects.toMatchObject({
        code: 'MSG422000',
      });
    });

    it('rejects with MSG422000 when the success payload does not match the output schema', async () => {
      runtime.sendMessage.mockResolvedValue({ data: { copied: 'yes' }, id: RESPONSE_ID, result: 'success' });

      await expect(service.sendMessageAwaitResponse(MessageType.Copy, { content: 'hi' })).rejects.toMatchObject({
        code: 'MSG422000',
      });
    });

    it('rejects with MSG404100 for an unregistered message type', async () => {
      await expect(service.sendMessageAwaitResponse(MessageType.Geolocation, {})).rejects.toMatchObject({
        code: 'MSG404100',
      });
    });
  });

  describe('addMessageListenerWithResponse', () => {
    const validMessage = (data: unknown = { content: 'hi' }) => ({ data, id: MESSAGE_ID, type: MessageType.Copy });

    it('invokes the listener with the message data and sender, and replies with a success envelope', async () => {
      const listener = vi.fn(async () => ({ copied: true }));
      service.addMessageListenerWithResponse(MessageType.Copy, listener);

      const { keptChannelOpen, response } = runtime.dispatch(validMessage(), SENDER);

      expect(keptChannelOpen).toBe(true);
      await expect(response).resolves.toEqual({ data: { copied: true }, id: MESSAGE_ID, result: 'success' });
      expect(listener).toHaveBeenCalledWith({ content: 'hi' }, SENDER);
    });

    it('replies with a failure envelope when the listener rejects', async () => {
      const listener = vi.fn(async () => {
        throw new Error('kaboom');
      });
      service.addMessageListenerWithResponse(MessageType.Copy, listener);

      const { keptChannelOpen, response } = runtime.dispatch(validMessage(), SENDER);

      expect(keptChannelOpen).toBe(true);
      await expect(response).resolves.toMatchObject({ id: MESSAGE_ID, result: 'failure' });
    });

    it('ignores messages of a different type', async () => {
      const listener = vi.fn(async () => ({ copied: true }));
      service.addMessageListenerWithResponse(MessageType.Copy, listener);

      const { keptChannelOpen } = runtime.dispatch({ data: {}, id: MESSAGE_ID, type: MessageType.TabContent });

      expect(keptChannelOpen).toBe(false);
      expect(listener).not.toHaveBeenCalled();
    });

    it('ignores messages that do not match the envelope schema', async () => {
      const listener = vi.fn(async () => ({ copied: true }));
      service.addMessageListenerWithResponse(MessageType.Copy, listener);

      const { keptChannelOpen } = runtime.dispatch({ data: {}, id: 'not-a-uuid', type: MessageType.Copy });

      expect(keptChannelOpen).toBe(false);
      expect(listener).not.toHaveBeenCalled();
    });

    // A responding listener that resolves with output failing its own output schema must be reported back to the
    // sender as a failure envelope, exactly like a *rejected* listener. Getting this wrong leaves the message channel
    // open and hangs the sender (in Chrome its `sendMessage` resolves with `undefined`, surfacing as a confusing
    // MSG422000 downstream) while the error escapes as an unhandled rejection. The trailing `.catch` in
    // `registerMessageListener` is what covers this: the second argument of a two-argument `.then(onFulfilled,
    // onRejected)` is a *sibling* of the success handler and never sees what that handler throws.
    it('replies with a failure when the listener output fails validation', async () => {
      const rejections: unknown[] = [];
      const onUnhandled = (reason: unknown) => rejections.push(reason);
      const nodeProcess = (
        globalThis as unknown as {
          process: {
            off(event: 'unhandledRejection', listener: (reason: unknown) => void): void;
            on(event: 'unhandledRejection', listener: (reason: unknown) => void): void;
          };
        }
      ).process;
      nodeProcess.on('unhandledRejection', onUnhandled);

      const listener = vi.fn(async () => ({ copied: 'not-a-boolean' }) as never);
      service.addMessageListenerWithResponse(MessageType.Copy, listener);

      const { keptChannelOpen, response } = runtime.dispatch(validMessage(), SENDER);

      expect(keptChannelOpen).toBe(true);
      await expect(response).resolves.toMatchObject({
        error: { code: 'MSG400100' },
        id: MESSAGE_ID,
        result: 'failure',
      });

      await new Promise((resolve) => setTimeout(resolve, 20));
      nodeProcess.off('unhandledRejection', onUnhandled);

      // The error is reported to the sender rather than escaping the floating promise chain.
      expect(rejections).toHaveLength(0);
    });

    // As above, but on the responding branch: a synchronous throw must still produce a failure envelope rather than
    // escaping the listener callback and leaving the sender waiting forever.
    it('replies with a failure when the listener throws synchronously', async () => {
      const listener = vi.fn((() => {
        throw new Error('sync kaboom');
      }) as unknown as () => Promise<never>);
      service.addMessageListenerWithResponse(MessageType.Copy, listener);

      let dispatched!: ReturnType<typeof runtime.dispatch>;

      expect(() => {
        dispatched = runtime.dispatch(validMessage(), SENDER);
      }).not.toThrow();

      expect(dispatched.keptChannelOpen).toBe(true);
      await expect(dispatched.response).resolves.toMatchObject({ id: MESSAGE_ID, result: 'failure' });
    });

    // `ExtensionError.fallback` returns an existing `ExtensionError` untouched, so routing the success branch through
    // the shared failure handler preserves the specific MSG400100 output-validation code rather than flattening it
    // into the MSG400101 fallback used for arbitrary listener rejections.
    it('preserves the output validation error code rather than the generic fallback', async () => {
      const listener = vi.fn(async () => ({ copied: 'not-a-boolean' }) as never);
      service.addMessageListenerWithResponse(MessageType.Copy, listener);

      const { response } = runtime.dispatch(validMessage(), SENDER);

      await expect(response).resolves.toMatchObject({ error: { code: 'MSG400100' } });
    });
  });

  describe('addMessageListener', () => {
    const validMessage = (data: unknown = { tabId: 1 }) => ({ data, id: MESSAGE_ID, type: MessageType.TabContent });

    it('invokes the listener without keeping the message channel open', async () => {
      const listener = vi.fn(async () => undefined);
      service.addMessageListener(MessageType.TabContent, listener);

      const { keptChannelOpen } = runtime.dispatch(validMessage(), SENDER);

      expect(keptChannelOpen).toBe(false);
      expect(listener).toHaveBeenCalledWith({ tabId: 1 }, SENDER);
    });

    it('swallows and logs a rejection from the listener', async () => {
      const listener = vi.fn(async () => {
        throw new Error('kaboom');
      });
      service.addMessageListener(MessageType.TabContent, listener);

      expect(() => runtime.dispatch(validMessage())).not.toThrow();
      await Promise.resolve();

      expect(logging.logger.error).toHaveBeenCalled();
    });

    // A listener is typed as returning a promise, but a non-`async` listener can still throw synchronously. Because
    // the call happens before `.catch` is attached, such an error would escape into `browser.runtime` rather than
    // being logged like a rejection (see `MessageService.invokeListener`).
    it('swallows and logs a listener that throws synchronously', async () => {
      const listener = vi.fn((() => {
        throw new Error('sync kaboom');
      }) as unknown as () => Promise<void>);
      service.addMessageListener(MessageType.TabContent, listener);

      expect(() => runtime.dispatch(validMessage())).not.toThrow();
      await Promise.resolve();

      expect(logging.logger.error).toHaveBeenCalled();
    });

    it('ignores messages of a different type', async () => {
      const listener = vi.fn(async () => undefined);
      service.addMessageListener(MessageType.TabContent, listener);

      runtime.dispatch({ data: { content: 'hi' }, id: MESSAGE_ID, type: MessageType.Copy });

      expect(listener).not.toHaveBeenCalled();
    });
  });
});
