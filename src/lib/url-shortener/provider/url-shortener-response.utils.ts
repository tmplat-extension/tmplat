import { ExtensionError } from 'extension/common/extension-error';
import { ExtensionErrorFactory } from 'extension/common/extension-error-factory';
import { isPlainObject } from 'extension/common/type.utils';
import { isHttpUrl } from 'extension/common/url.utils';
import { UrlShortenerProviderName } from 'extension/url-shortener/provider/url-shortener-provider-name.enum';

/**
 * Third-party URL shortener APIs cannot be trusted to only ever return a usable shortened URL when they report
 * success: some return HTTP 200 with an error message in the body instead of the expected field, or a redirect
 * pointing nowhere. Every provider must therefore validate the *shape* of a successful response, not just its
 * response status, before using any part of it, hence this shared, deliberately strict, extraction helper.
 */
export function extractShortUrl(
  errorFactory: ExtensionErrorFactory,
  providerName: UrlShortenerProviderName,
  value: unknown,
  expectedHostname?: string,
): string {
  if (!isHttpUrl(value) || (expectedHostname && new URL(value).hostname !== expectedHostname)) {
    throw createUnexpectedResponseError(errorFactory, providerName);
  }

  return value;
}

/**
 * Reads `field` from a JSON response `body`, throwing unless `body` is an object containing it. Intended to be
 * passed straight into {@link extractShortUrl} so an unexpected/malformed body is treated the same as a missing URL.
 */
export function extractJsonField(
  errorFactory: ExtensionErrorFactory,
  providerName: UrlShortenerProviderName,
  body: unknown,
  field: string,
): unknown {
  if (!isPlainObject(body)) {
    throw createUnexpectedResponseError(errorFactory, providerName);
  }

  return body[field];
}

export function createUnexpectedResponseError(
  errorFactory: ExtensionErrorFactory,
  providerName: UrlShortenerProviderName,
): ExtensionError {
  return errorFactory.intl('url_shortener_error_unexpected_response_description', providerName);
}
