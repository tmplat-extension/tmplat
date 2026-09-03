import { describe, expect, it } from 'vitest';
import {
  getPathSegments,
  getUrlFileInfo,
  hasUrlParams,
  isHomepageUrl,
  isHttpUrl,
  isInjectableUrl,
} from 'extension/common/url.utils';

describe('getPathSegments', () => {
  it.each([
    ['', []],
    ['/', []],
    ['///', []],
    ['/a', ['a']],
    ['/a/b/c', ['a', 'b', 'c']],
    ['a/b/c', ['a', 'b', 'c']],
    ['/a/b/c/', ['a', 'b', 'c']],
    ['/a/b/c.html', ['a', 'b', 'c.html']],
  ])('splits %j into %j', (path, expected) => {
    expect(getPathSegments(path)).toEqual(expected);
  });

  it('preserves empty inner segments', () => {
    expect(getPathSegments('/a//b')).toEqual(['a', '', 'b']);
  });
});

describe('getUrlFileInfo', () => {
  it.each([
    ['https://tmplat.com/', { directory: '/', file: '' }],
    ['https://tmplat.com/index.html', { directory: '/', file: 'index.html' }],
    ['https://tmplat.com/docs/guide.html', { directory: '/docs/', file: 'guide.html' }],
    ['https://tmplat.com/docs/', { directory: '/docs/', file: '' }],
    ['https://tmplat.com/docs/nested/deep/file.tar.gz', { directory: '/docs/nested/deep/', file: 'file.tar.gz' }],
  ])('splits the pathname of %s into a directory and file', (url, expected) => {
    expect(getUrlFileInfo(new URL(url))).toEqual(expected);
  });

  it('ignores the query string and hash', () => {
    expect(getUrlFileInfo(new URL('https://tmplat.com/docs/guide.html?a=1#top'))).toEqual({
      directory: '/docs/',
      file: 'guide.html',
    });
  });
});

describe('hasUrlParams', () => {
  const url = new URL('https://tmplat.com/?a=1&b=2');

  it('returns true when every param matches', () => {
    expect(hasUrlParams(url, { a: '1', b: '2' })).toBe(true);
  });

  it('returns true when only a subset is asserted', () => {
    expect(hasUrlParams(url, { a: '1' })).toBe(true);
  });

  it('returns true when no params are asserted', () => {
    expect(hasUrlParams(url, {})).toBe(true);
  });

  it('returns false when a param has a different value', () => {
    expect(hasUrlParams(url, { a: '2' })).toBe(false);
  });

  it('returns false when a param is absent', () => {
    expect(hasUrlParams(url, { c: '3' })).toBe(false);
  });
});

describe('isHomepageUrl', () => {
  it.each(['https://tmplat.com/', 'http://tmplat.com/guide', 'https://tmplat.com:8080/'])(
    'returns true for %s',
    (url) => {
      expect(isHomepageUrl(new URL(url))).toBe(true);
    },
  );

  it.each(['https://www.tmplat.com/', 'https://tmplat.com.evil.example/', 'https://example.com/'])(
    'returns false for %s',
    (url) => {
      expect(isHomepageUrl(new URL(url))).toBe(false);
    },
  );
});

describe('isHttpUrl', () => {
  it.each(['http://example.com', 'https://example.com', 'https://example.com/a/b?c=1#d'])(
    'returns true for %s',
    (value) => {
      expect(isHttpUrl(value)).toBe(true);
    },
  );

  it.each([
    ['an empty string', ''],
    ['a relative path', '/a/b'],
    ['a bare hostname', 'example.com'],
    ['a non-HTTP protocol', 'ftp://example.com'],
    ['a javascript URL', 'javascript:alert(1)'],
    ['a data URL', 'data:text/plain,hello'],
    ['null', null],
    ['undefined', undefined],
    ['a number', 1],
    ['an object', {}],
  ])('returns false for %s', (_label, value) => {
    expect(isHttpUrl(value)).toBe(false);
  });
});

describe('isInjectableUrl', () => {
  it.each(['https://example.com/', 'http://example.com/', 'https://tmplat.com/'])('returns true for %s', (url) => {
    expect(isInjectableUrl(new URL(url))).toBe(true);
  });

  it.each([
    ['a chrome-extension URL', 'chrome-extension://abc/popup.html'],
    ['a file URL', 'file:///tmp/a.html'],
    ['an about URL', 'about:blank'],
    ['a data URL', 'data:text/html,hi'],
  ])('returns false for %s', (_label, url) => {
    expect(isInjectableUrl(new URL(url))).toBe(false);
  });

  it.each([
    'https://chromewebstore.google.com/',
    'https://chromewebstore.google.com/detail/foo',
    'https://addons.mozilla.org/en-GB/firefox/',
    'https://accounts.firefox.com/signin',
    'https://support.mozilla.org/kb/foo',
    'https://chrome.google.com/webstore/detail/foo',
    'https://microsoftedge.microsoft.com/addons/detail/foo',
  ])('returns false for the restricted URL %s', (url) => {
    expect(isInjectableUrl(new URL(url))).toBe(false);
  });

  it('does not restrict a hostname that merely ends with a restricted hostname', () => {
    expect(isInjectableUrl(new URL('https://not-addons.mozilla.org.example.com/'))).toBe(true);
  });
});
