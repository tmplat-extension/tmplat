import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ClipboardService } from 'extension/common/clipboard/clipboard.service';
import { type LoggingService } from 'extension/common/logging/logging.service';
import { MessageType } from 'extension/common/message/message-type.enum';
import { type OffscreenService } from 'extension/common/offscreen/offscreen.service';
import { createLoggingServiceMock, type LoggingServiceMock } from 'extension/test/logger.mock';

describe('ClipboardService', () => {
  let logging: LoggingServiceMock;
  let sendMessageAwaitResponse: ReturnType<typeof vi.fn>;
  let service: ClipboardService;

  beforeEach(() => {
    logging = createLoggingServiceMock();
    sendMessageAwaitResponse = vi.fn();
    const offscreenService = { sendMessageAwaitResponse } as unknown as OffscreenService;
    service = new ClipboardService(offscreenService, logging as unknown as LoggingService);
  });

  describe('copy', () => {
    it('delegates to the offscreen document with a copy message carrying the content', async () => {
      sendMessageAwaitResponse.mockResolvedValue({ copied: true });

      await service.copy('hello world');

      expect(sendMessageAwaitResponse).toHaveBeenCalledWith(MessageType.Copy, { content: 'hello world' });
    });

    it('resolves when the offscreen document reports the content was copied', async () => {
      sendMessageAwaitResponse.mockResolvedValue({ copied: true });

      await expect(service.copy('hello')).resolves.toBeUndefined();
    });

    it('rejects with CLI500000 when the offscreen document reports the copy failed', async () => {
      sendMessageAwaitResponse.mockResolvedValue({ copied: false });

      await expect(service.copy('hello')).rejects.toMatchObject({ code: 'CLI500000' });
    });

    it('propagates a rejection from the offscreen document', async () => {
      sendMessageAwaitResponse.mockRejectedValue(new Error('offscreen unavailable'));

      await expect(service.copy('hello')).rejects.toThrow('offscreen unavailable');
    });
  });
});
