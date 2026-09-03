import Europa from 'europa';
import { inject, injectable } from 'extension/common/di';
import { type Logger } from 'extension/common/logging/logger';
import { type LoggingService, LoggingServiceToken } from 'extension/common/logging/logging.service';
import {
  type ConvertMarkdownMessageInput,
  type ConvertMarkdownMessageOutput,
} from 'extension/common/markdown/message/convert-markdown-message.schema';
import { MessageType } from 'extension/common/message/message-type.enum';
import { type OffscreenService, OffscreenServiceToken } from 'extension/common/offscreen/offscreen.service';

export const MarkdownServiceToken = Symbol('MarkdownService');

/**
 * Converts HTML into Markdown.
 *
 * The conversion depends on DOM APIs that are unavailable to the service worker, so implementations either perform the
 * conversion directly (where a DOM is available) or delegate it to the offscreen document.
 */
export interface MarkdownService {
  convert(html: string, options?: MarkdownServiceConvertOptions): Promise<string>;
}

export type MarkdownServiceConvertOptions = {
  readonly inline?: boolean;
};

/**
 * Converts HTML into Markdown using Europa, which requires a DOM and can therefore only be used from a document (e.g.
 * the offscreen document) and never from the service worker.
 */
@injectable()
export class EuropaMarkdownService implements MarkdownService {
  private readonly logger: Logger;

  constructor(@inject(LoggingServiceToken) logging: LoggingService) {
    this.logger = logging.getLogger('EuropaMarkdownService');
  }

  async convert(html: string, options: MarkdownServiceConvertOptions = {}): Promise<string> {
    this.logger.trace('Converting HTML to Markdown', { html, options });

    if (!html) {
      return '';
    }

    const europa = new Europa({ inline: options.inline ?? false });
    const markdown = europa.convert(html);

    this.logger.debug('Successfully converted HTML to Markdown', { html, markdown, options });

    return markdown;
  }
}

/** Converts HTML into Markdown by delegating to the offscreen document, where a DOM is available. */
@injectable()
export class OffscreenMarkdownService implements MarkdownService {
  private readonly logger: Logger;

  constructor(
    @inject(LoggingServiceToken) logging: LoggingService,
    @inject(OffscreenServiceToken) private readonly offscreenService: OffscreenService,
  ) {
    this.logger = logging.getLogger('OffscreenMarkdownService');
  }

  async convert(html: string, options: MarkdownServiceConvertOptions = {}): Promise<string> {
    this.logger.trace('Converting HTML to Markdown', { html, options });

    if (!html) {
      return '';
    }

    const { markdown } = await this.offscreenService.sendMessageAwaitResponse<
      ConvertMarkdownMessageInput,
      ConvertMarkdownMessageOutput
    >(MessageType.ConvertMarkdown, { html, inline: options.inline ?? false });

    this.logger.debug('Successfully converted HTML to Markdown', { html, markdown, options });

    return markdown;
  }
}
