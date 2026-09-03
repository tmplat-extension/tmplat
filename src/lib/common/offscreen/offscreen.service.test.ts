import { beforeEach, describe, expect, it, vi } from 'vitest';
import { type ExtensionInfo } from 'extension/common/extension-info';
import { type LoggingService } from 'extension/common/logging/logging.service';
import { type MessageType } from 'extension/common/message/message-type.enum';
import { type MessageService } from 'extension/common/message/message.service';
import { OffscreenService } from 'extension/common/offscreen/offscreen.service';
import { type BrowserApiMock, getBrowserApiMock } from 'extension/test/browser-api.mock';
import { createLoggingServiceMock, type LoggingServiceMock } from 'extension/test/logger.mock';

const MESSAGE_TYPE = 'geolocation' as unknown as MessageType;

const createDeferred = <T>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

describe('OffscreenService', () => {
  let offscreen: BrowserApiMock['offscreen'];
  let getContexts: BrowserApiMock['runtime']['getContexts'];
  let logging: LoggingServiceMock;
  let messageService: { sendMessageAwaitResponse: ReturnType<typeof vi.fn> };
  let service: OffscreenService;

  const extensionInfo = {
    createExtensionUrlString: vi.fn(() => 'chrome-extension://test-extension-id/offscreen.html'),
  } as unknown as ExtensionInfo;

  beforeEach(() => {
    ({ offscreen } = getBrowserApiMock());
    ({ getContexts } = getBrowserApiMock().runtime);
    logging = createLoggingServiceMock();
    messageService = { sendMessageAwaitResponse: vi.fn(async () => 'response') };
    service = new OffscreenService(
      extensionInfo,
      logging as unknown as LoggingService,
      messageService as unknown as MessageService,
    );
  });

  it('creates the document, delegates the message and closes the document', async () => {
    const result = await service.sendMessageAwaitResponse(MESSAGE_TYPE, { lat: 1 });

    expect(result).toBe('response');
    expect(offscreen.createDocument).toHaveBeenCalledTimes(1);
    expect(messageService.sendMessageAwaitResponse).toHaveBeenCalledWith(MESSAGE_TYPE, { lat: 1 });
    expect(offscreen.closeDocument).toHaveBeenCalledTimes(1);
  });

  it('does not create a document when one already exists', async () => {
    getContexts.mockResolvedValue([{ contextType: 'OFFSCREEN_DOCUMENT' }]);

    await service.sendMessageAwaitResponse(MESSAGE_TYPE, {});

    expect(offscreen.createDocument).not.toHaveBeenCalled();
    expect(messageService.sendMessageAwaitResponse).toHaveBeenCalled();
  });

  it('shares a single document across concurrent requests and closes it once', async () => {
    const first = createDeferred<string>();
    const second = createDeferred<string>();
    messageService.sendMessageAwaitResponse
      .mockImplementationOnce(() => first.promise)
      .mockImplementationOnce(() => second.promise);

    const p1 = service.sendMessageAwaitResponse(MESSAGE_TYPE, { n: 1 });
    const p2 = service.sendMessageAwaitResponse(MESSAGE_TYPE, { n: 2 });

    first.resolve('a');
    await p1;
    // The second request is still in flight, so the document must not have been closed yet.
    expect(offscreen.closeDocument).not.toHaveBeenCalled();

    second.resolve('b');
    await p2;

    expect(offscreen.createDocument).toHaveBeenCalledTimes(1);
    expect(offscreen.closeDocument).toHaveBeenCalledTimes(1);
  });

  it('still closes the document (and rethrows) when the delegated message fails', async () => {
    messageService.sendMessageAwaitResponse.mockRejectedValue(new Error('boom'));

    await expect(service.sendMessageAwaitResponse(MESSAGE_TYPE, {})).rejects.toThrow('boom');
    expect(offscreen.closeDocument).toHaveBeenCalledTimes(1);
  });

  it('warns but does not throw when closing the document fails', async () => {
    offscreen.closeDocument.mockRejectedValue(new Error('cannot close'));

    await expect(service.sendMessageAwaitResponse(MESSAGE_TYPE, {})).resolves.toBe('response');
    expect(logging.logger.warn).toHaveBeenCalled();
  });
});
