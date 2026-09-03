const FILE_INFO_REGEX = /(\/(?:.(?![^/]*\.[^/.]+))*\/?)?([^/]*)/;

const injectableProtocols = new Set<string>(['http:', 'https:']);

const restrictedInjectionUrls: RestrictedUrl[] = [
  // Chrome marks the Web Store as non-scriptable. While this isn't clearly documented anywhere it can be verified by
  // looking at the Chromium source code:
  // https://chromium.googlesource.com/chromium/src/+/0ed7ca2ecc1fbf5d5333ae0250c2d37d507f97a4/chrome/common/extensions/chrome_extensions_client.cc#148
  // https://chromium.googlesource.com/chromium/src/+/0ed7ca2ecc1fbf5d5333ae0250c2d37d507f97a4/extensions/common/extension_urls.cc#41
  { hostname: 'chromewebstore.google.com' },
  { hostname: 'chrome.google.com', pathname: 'webstore' },
  // Firefox marks the Add-ons site as non-scriptable:
  // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Content_scripts#restricted_domains
  { hostname: 'accounts-static.cdn.mozilla.net' },
  { hostname: 'accounts.firefox.com' },
  { hostname: 'addons.cdn.mozilla.net' },
  { hostname: 'addons.mozilla.org' },
  { hostname: 'api.accounts.firefox.com' },
  { hostname: 'content.cdn.mozilla.net' },
  { hostname: 'discovery.addons.mozilla.org' },
  { hostname: 'install.mozilla.org' },
  { hostname: 'oauth.accounts.firefox.com' },
  { hostname: 'profile.accounts.firefox.com' },
  { hostname: 'support.mozilla.org' },
  { hostname: 'sync.services.mozilla.com' },
  // Edge does not have any known restrictions on scriptable URLs, however, assume their Add-ons site is non-scriptable
  { hostname: 'microsoftedge.microsoft.com', pathname: 'addons' },
];

const getMatchAtIndex = (match: RegExpMatchArray | null, index: number): string => (match ? (match[index] ?? '') : '');

export const getPathSegments = (path: string): string[] => {
  const segments = path.replace(/^\/+|\/+$/g, '').split('/');
  if (segments.length === 1 && !segments[0].length) {
    return [];
  }

  return segments;
};

export const getUrlFileInfo = (url: URL): UrlFileInfo => {
  const match = url.pathname.match(FILE_INFO_REGEX);

  return {
    directory: getMatchAtIndex(match, 1),
    file: getMatchAtIndex(match, 2),
  };
};

export const hasUrlParams = (url: URL, params: Record<string, string>): boolean =>
  Object.entries(params).every(([name, value]) => url.searchParams.get(name) === value);

export const isHomepageUrl = (url: URL): boolean => url.hostname === 'tmplat.com';

/**
 * Checks whether `value` is a syntactically valid absolute HTTP(S) URL. Useful both for validating user input (e.g.
 * a YOURLS installation URL) and for validating URLs extracted from third-party API responses before trusting them.
 */
export const isHttpUrl = (value: unknown): value is string => {
  if (typeof value !== 'string' || !value) {
    return false;
  }

  try {
    return ['http:', 'https:'].includes(new URL(value).protocol);
  } catch (_) {
    return false;
  }
};

export const isInjectableUrl = (url: URL): boolean => {
  if (!injectableProtocols.has(url.protocol)) {
    return false;
  }

  for (const restrictedUrl of restrictedInjectionUrls) {
    if (
      url.hostname === restrictedUrl.hostname &&
      (!restrictedUrl.pathname || url.pathname.startsWith(restrictedUrl.pathname))
    ) {
      return false;
    }
  }

  return true;
};

type RestrictedUrl = {
  hostname: string;
  pathname?: string;
};

export type UrlFileInfo = {
  readonly directory: string;
  readonly file: string;
};
