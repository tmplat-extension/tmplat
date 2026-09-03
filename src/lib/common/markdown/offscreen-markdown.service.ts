import { inject, injectable } from 'extension/common/di';
import { MarkdownService, MarkdownServiceConvertOptions } from 'extension/common/markdown/markdown.service';
import {
  ConvertMarkdownMessage,
  ConvertMarkdownMessageReply,
} from 'extension/common/markdown/message/convert-markdown-message.model';
import { MessageType } from 'extension/common/message/message-type.enum';
import { OffscreenService, OffscreenServiceToken } from 'extension/common/offscreen/offscreen.service';

/** Converts HTML into Markdown by delegating to the offscreen document, where a DOM is available. */
@injectable()
export class OffscreenMarkdownService extends MarkdownService {
  constructor(@inject(OffscreenServiceToken) private readonly offscreenService: OffscreenService) {
    super();
  }

  async convert(html: string, options: MarkdownServiceConvertOptions = {}): Promise<string> {
    if (!html) {
      return '';
    }

    const { markdown } = await this.offscreenService.sendMessageAndAwaitReply<
      ConvertMarkdownMessage,
      ConvertMarkdownMessageReply
    >(MessageType.ConvertMarkdown, { html, inline: options.inline ?? false });

    return markdown;
  }
}
