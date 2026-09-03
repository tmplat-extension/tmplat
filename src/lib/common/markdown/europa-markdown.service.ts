import Europa from 'europa';
import { injectable } from 'extension/common/di';
import { MarkdownService, MarkdownServiceConvertOptions } from 'extension/common/markdown/markdown.service';

/**
 * Converts HTML into Markdown using Europa, which requires a DOM and can therefore only be used from a document (e.g.
 * the offscreen document) and never from the service worker.
 */
@injectable()
export class EuropaMarkdownService extends MarkdownService {
  async convert(html: string, options: MarkdownServiceConvertOptions = {}): Promise<string> {
    if (!html) {
      return '';
    }

    return new Europa({ inline: options.inline ?? false }).convert(html);
  }
}
