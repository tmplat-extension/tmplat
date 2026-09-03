import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { type LoggingService } from 'extension/common/logging/logging.service';
import type * as MarkdownServiceModuleExports from 'extension/common/markdown/markdown.service';
import { MessageType } from 'extension/common/message/message-type.enum';
import { type OffscreenService } from 'extension/common/offscreen/offscreen.service';
import { createLoggingServiceMock, type LoggingServiceMock } from 'extension/test/logger.mock';

// `markdown.service` imports Europa at module load, and Europa references the browser-only `self` global while being
// evaluated. The Node test environment has no `self`, so it is stubbed and the module is imported dynamically after
// the stub is in place. Actual HTML-to-Markdown conversion additionally needs `window`/DOM APIs, so
// `EuropaMarkdownService.convert` cannot be exercised beyond its empty-input short-circuit without a DOM environment
// (see the note on the skipped conversion case below).
type MarkdownServiceModule = typeof MarkdownServiceModuleExports;

let markdownModule: MarkdownServiceModule;

beforeAll(async () => {
  vi.stubGlobal('self', globalThis);
  markdownModule = await import('extension/common/markdown/markdown.service');
});

describe('EuropaMarkdownService', () => {
  let logging: LoggingServiceMock;
  let service: InstanceType<MarkdownServiceModule['EuropaMarkdownService']>;

  beforeEach(() => {
    logging = createLoggingServiceMock();
    service = new markdownModule.EuropaMarkdownService(logging as unknown as LoggingService);
  });

  describe('convert', () => {
    it('returns an empty string for empty input without invoking Europa', async () => {
      await expect(service.convert('')).resolves.toBe('');
    });

    // The non-empty conversion path constructs `new Europa()`, which requires `window`/DOM APIs that the Node test
    // environment does not provide. It is covered by end-to-end/component tests once a DOM environment exists.
  });
});

describe('OffscreenMarkdownService', () => {
  let logging: LoggingServiceMock;
  let sendMessageAwaitResponse: ReturnType<typeof vi.fn>;
  let service: InstanceType<MarkdownServiceModule['OffscreenMarkdownService']>;

  beforeEach(() => {
    logging = createLoggingServiceMock();
    sendMessageAwaitResponse = vi.fn();
    const offscreenService = { sendMessageAwaitResponse } as unknown as OffscreenService;
    service = new markdownModule.OffscreenMarkdownService(logging as unknown as LoggingService, offscreenService);
  });

  describe('convert', () => {
    it('returns an empty string for empty input without contacting the offscreen document', async () => {
      await expect(service.convert('')).resolves.toBe('');

      expect(sendMessageAwaitResponse).not.toHaveBeenCalled();
    });

    it('delegates conversion to the offscreen document, defaulting inline to false', async () => {
      sendMessageAwaitResponse.mockResolvedValue({ markdown: '**hi**' });

      await expect(service.convert('<b>hi</b>')).resolves.toBe('**hi**');
      expect(sendMessageAwaitResponse).toHaveBeenCalledWith(MessageType.ConvertMarkdown, {
        html: '<b>hi</b>',
        inline: false,
      });
    });

    it('forwards an explicit inline option to the offscreen document', async () => {
      sendMessageAwaitResponse.mockResolvedValue({ markdown: 'hi' });

      await service.convert('<b>hi</b>', { inline: true });

      expect(sendMessageAwaitResponse).toHaveBeenCalledWith(MessageType.ConvertMarkdown, {
        html: '<b>hi</b>',
        inline: true,
      });
    });

    it('propagates a rejection from the offscreen document', async () => {
      sendMessageAwaitResponse.mockRejectedValue(new Error('offscreen unavailable'));

      await expect(service.convert('<b>hi</b>')).rejects.toThrow('offscreen unavailable');
    });
  });
});
