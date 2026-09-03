export const MarkdownServiceToken = Symbol('MarkdownService');

/**
 * Converts HTML into Markdown.
 *
 * The conversion depends on DOM APIs that are unavailable to the service worker, so implementations either perform the
 * conversion directly (where a DOM is available) or delegate it to the offscreen document.
 */
export abstract class MarkdownService {
  abstract convert(html: string, options?: MarkdownServiceConvertOptions): Promise<string>;
}

export type MarkdownServiceConvertOptions = {
  readonly inline?: boolean;
};
