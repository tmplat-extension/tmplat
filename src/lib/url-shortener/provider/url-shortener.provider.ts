import { isPlainObject } from 'es-toolkit';
import { ExtensionError } from 'extension/common/error/extension-error';
import { type ExtensionErrorCode } from 'extension/common/error/extension-error-code';
import { type IntlService } from 'extension/common/intl/intl.service';
import { isHttpUrl } from 'extension/common/url.utils';
import { type UrlShortenerDataProvider } from 'extension/url-shortener/data/url-shortener-data.schema';
import { type UrlShortenerProviderName } from 'extension/url-shortener/provider/url-shortener-provider-name.enum';

export const UrlShortenerProviderToken = Symbol('UrlShortenerProvider');

export interface UrlShortenerProvider<D extends UrlShortenerDataProvider> {
  readonly name: UrlShortenerProviderName;

  isDataValid(data: Readonly<D>): boolean | Promise<boolean>;

  shorten(url: URL, data: Readonly<D>): Promise<string>;
}

export abstract class AbstractUrlShortenerProvider<
  D extends UrlShortenerDataProvider,
> implements UrlShortenerProvider<D> {
  protected constructor(
    readonly name: UrlShortenerProviderName,
    protected readonly intl: IntlService,
  ) {}

  abstract isDataValid(data: Readonly<D>): boolean | Promise<boolean>;

  abstract shorten(url: URL, data: Readonly<D>): Promise<string>;

  /**
   * Third-party URL shortener APIs cannot be trusted to only ever return a usable shortened URL when they report
   * success: some return HTTP 200 with an error message in the body instead of the expected field, or a redirect
   * pointing nowhere. Every provider must therefore validate the *shape* of a successful response, not just its
   * response status, before using any part of it, hence this shared, deliberately strict, extraction helper.
   */
  protected extractShortUrl(value: unknown, expectedHostname?: string): string {
    if (!isHttpUrl(value) || (expectedHostname && new URL(value).hostname !== expectedHostname)) {
      throw this.createExtensionError('SHO422100');
    }

    return value;
  }

  /**
   * Reads `field` from a JSON response `body`, throwing unless `body` is an object containing it. Intended to be
   * passed straight into {@link extractShortUrl} so an unexpected/malformed body is treated the same as a missing URL.
   */
  protected extractJsonField(body: unknown, field: string): unknown {
    if (!isPlainObject(body)) {
      throw this.createExtensionError('SHO422100');
    }

    return body[field];
  }

  /**
   * Reads a JSON response `body`, resolving `undefined` instead of throwing when it cannot be parsed.
   *
   * Intended for providers that need to inspect the body of an *error* response: those are frequently HTML or empty
   * (especially for a self-hosted installation sitting behind a reverse proxy), and a `SyntaxError` escaping from
   * here would mask the underlying failure rather than reporting it as one.
   */
  protected async parseJsonBody(response: Response): Promise<unknown> {
    try {
      return await response.json();
    } catch (_) {
      return undefined;
    }
  }

  protected createExtensionError(code: ExtensionErrorCode, cause?: unknown): ExtensionError {
    const providerIntlName = this.intl.getMessage(`url_shortener_name_${this.name}`);

    return ExtensionError.from({
      cause,
      code,
      substitutions: [providerIntlName],
    });
  }
}
