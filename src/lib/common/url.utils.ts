import { isUndefined } from 'lodash-es';

const FILE_INFO_REGEX = /(\/(?:.(?![^\/]*\.[^\/.]+))*\/?)?([^\/]*)/;
const HOMEPAGE_HOST_REGEX = /(^tmplat\.com|\.tmplat.com)$/;
const INJECTABLE_PROTOCOL_REGEX = /^https?:\/\//;

export function getPathSegments(path: string): string[] {
  const segments = path.replace(/^\/+|\/+$/g, '').split('/');
  if (segments.length === 1 && !segments[0].length) {
    return [];
  }

  return segments;
}

export function getUrlFileInfo(url: URL): UrlFileInfo {
  const match = url.pathname.match(FILE_INFO_REGEX);

  return {
    directory: getMatchAtIndex(match, 1),
    file: getMatchAtIndex(match, 2),
  };
}

export function hasUrlParams(url: URL, params: Record<string, string>): boolean {
  return Object.entries(params).every(([name, value]) => url.searchParams.get(name) === value);
}

export function isHomepageUrl(value: string | undefined): boolean {
  if (isUndefined(value)) {
    return false;
  }

  const url = new URL(value);

  return HOMEPAGE_HOST_REGEX.test(url.hostname);
}

export function isInjectableUrl(value: string | undefined): boolean {
  return !isUndefined(value) && INJECTABLE_PROTOCOL_REGEX.test(value) && !isWebStoreUrl(value);
}

export function isWebStoreUrl(value: string | undefined): boolean {
  return !isUndefined(value) && !value.indexOf('https://chrome.google.com/webstore');
}

function getMatchAtIndex(match: any[] | null, index: number): string {
  return match ? match[index] ?? '' : '';
}

export type UrlFileInfo = {
  readonly directory: string;
  readonly file: string;
};
