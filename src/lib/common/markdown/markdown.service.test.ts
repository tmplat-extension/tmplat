import { beforeEach, describe, expect, it, vi } from 'vitest';
import { type LoggingService } from 'extension/common/logging/logging.service';
import { EuropaMarkdownService, OffscreenMarkdownService } from 'extension/common/markdown/markdown.service';
import { MessageType } from 'extension/common/message/message-type.enum';
import { type OffscreenService } from 'extension/common/offscreen/offscreen.service';
import { createLoggingServiceMock, type LoggingServiceMock } from 'extension/test/logger.mock';

// `markdown.service` imports Europa at module load, and Europa both references the browser-only `self` global while
// being evaluated and walks real DOM nodes while converting. This file is therefore routed into the `dom` (jsdom)
// project by `vitest.config.mts` even though it lives in a `node` tree - see the `domOverrides` note there.
describe('EuropaMarkdownService', () => {
  let logging: LoggingServiceMock;
  let service: EuropaMarkdownService;

  beforeEach(() => {
    logging = createLoggingServiceMock();
    service = new EuropaMarkdownService(logging as unknown as LoggingService);
  });

  describe('convert', () => {
    it('returns an empty string for empty input without invoking Europa', async () => {
      await expect(service.convert('')).resolves.toBe('');

      expect(logging.logger.debug).not.toHaveBeenCalled();
    });

    it('converts block-level HTML into Markdown', async () => {
      await expect(service.convert('<h1>Title</h1><p>Hello <b>world</b></p>')).resolves.toBe(
        '# Title\n\nHello **world**',
      );
    });

    it('converts a list into Markdown', async () => {
      await expect(service.convert('<ul><li>a</li><li>b</li></ul>')).resolves.toBe('* a\n* b');
    });

    it('returns plain text unchanged', async () => {
      await expect(service.convert('just text')).resolves.toBe('just text');
    });

    it('decodes HTML entities', async () => {
      await expect(service.convert('<p>a &amp; b &lt;c&gt;</p>')).resolves.toBe('a & b <c>');
    });

    it('drops script elements rather than emitting their source', async () => {
      await expect(service.convert('<p>hi</p><script>alert(1)</script>')).resolves.toBe('hi');
    });

    // The `inline` option controls how links and images are emitted, and nothing else: reference-style definitions
    // collected at the end of the output by default, or inline URLs when set. It is what makes `{selectionMarkdown}`
    // usable inside a larger template, where a trailing block of link definitions would be misplaced.
    describe('inline option', () => {
      it('emits reference-style links by default', async () => {
        await expect(service.convert('<a href="https://example.com/a">x</a>')).resolves.toBe(
          '[x][link1]\n\n[link1]: https://example.com/a',
        );
      });

      it('emits inline links when inline is enabled', async () => {
        await expect(service.convert('<a href="https://example.com/a">x</a>', { inline: true })).resolves.toBe(
          '[x](https://example.com/a)',
        );
      });

      it('emits reference-style images by default', async () => {
        await expect(service.convert('<img src="https://example.com/i.png" alt="pic">')).resolves.toBe(
          '![pic][image1]\n\n[image1]: https://example.com/i.png',
        );
      });

      it('emits inline images when inline is enabled', async () => {
        await expect(
          service.convert('<img src="https://example.com/i.png" alt="pic">', { inline: true }),
        ).resolves.toBe('![pic](https://example.com/i.png)');
      });

      it('makes no difference to content containing neither links nor images', async () => {
        const html = '<ul><li>a</li><li>b</li></ul>';

        await expect(service.convert(html, { inline: true })).resolves.toBe(await service.convert(html));
      });
    });

    // Characterization of Europa's own output, not a tmplat behavior: the inner `<code>` of a `<pre><code>` block is
    // emitted verbatim inside the fence rather than being unwrapped. Pinned so an upstream Europa change is noticed
    // here rather than in a user's clipboard.
    it('emits the inner code element verbatim inside a fenced code block', async () => {
      await expect(service.convert('<pre><code>const a = 1;</code></pre>')).resolves.toBe(
        '```\n<code>const a = 1;</code>\n```',
      );
    });

    it('logs the input before converting and the result afterwards', async () => {
      await service.convert('<b>hi</b>', { inline: true });

      expect(logging.logger.trace).toHaveBeenCalledWith('Converting HTML to Markdown', {
        html: '<b>hi</b>',
        options: { inline: true },
      });
      expect(logging.logger.debug).toHaveBeenCalledWith('Successfully converted HTML to Markdown', {
        html: '<b>hi</b>',
        markdown: '**hi**',
        options: { inline: true },
      });
    });
  });
});

describe('OffscreenMarkdownService', () => {
  let logging: LoggingServiceMock;
  let sendMessageAwaitResponse: ReturnType<typeof vi.fn>;
  let service: OffscreenMarkdownService;

  beforeEach(() => {
    logging = createLoggingServiceMock();
    sendMessageAwaitResponse = vi.fn();
    const offscreenService = { sendMessageAwaitResponse } as unknown as OffscreenService;
    service = new OffscreenMarkdownService(logging as unknown as LoggingService, offscreenService);
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
