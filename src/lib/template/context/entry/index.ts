import { author } from 'extension/template/context/entry/author';
import { browserFullVersion } from 'extension/template/context/entry/browser-full-version';
import { browserMajorVersion } from 'extension/template/context/entry/browser-major-version';
import { browserName } from 'extension/template/context/entry/browser-name';
import { camelCase } from 'extension/template/context/entry/camel-case';
import { capitalize } from 'extension/template/context/entry/capitalize';
import { characterSet } from 'extension/template/context/entry/character-set';
import { cookie } from 'extension/template/context/entry/cookie';
import { cookieNames } from 'extension/template/context/entry/cookie-names';
import { cookies } from 'extension/template/context/entry/cookies';
import { cookiesEnabled } from 'extension/template/context/entry/cookies-enabled';
import { dateTime } from 'extension/template/context/entry/date-time';
import { deburr } from 'extension/template/context/entry/deburr';
import { decodeBase64 } from 'extension/template/context/entry/decode-base64';
import { decodeUriComponent } from 'extension/template/context/entry/decode-uri-component';
import { anchor } from 'extension/template/context/entry/deprecated/anchor';
import { anchorTarget } from 'extension/template/context/entry/deprecated/anchor-target';
import { anchorTitle } from 'extension/template/context/entry/deprecated/anchor-title';
import { base } from 'extension/template/context/entry/deprecated/base';
import { bitly } from 'extension/template/context/entry/deprecated/bitly';
import { bitlyAccount } from 'extension/template/context/entry/deprecated/bitly-account';
import { browser } from 'extension/template/context/entry/deprecated/browser';
import { browserVersion } from 'extension/template/context/entry/deprecated/browser-version';
import { capitalise } from 'extension/template/context/entry/deprecated/capitalise';
import { contextMenu } from 'extension/template/context/entry/deprecated/context-menu';
import { count } from 'extension/template/context/entry/deprecated/count';
import { customCount } from 'extension/template/context/entry/deprecated/custom-count';
import { decode } from 'extension/template/context/entry/deprecated/decode';
import { depth } from 'extension/template/context/entry/deprecated/depth';
import { doAnchorTarget } from 'extension/template/context/entry/deprecated/do-anchor-target';
import { doAnchorTitle } from 'extension/template/context/entry/deprecated/do-anchor-title';
import { encode } from 'extension/template/context/entry/deprecated/encode';
import { encoded } from 'extension/template/context/entry/deprecated/encoded';
import { escape } from 'extension/template/context/entry/deprecated/escape';
import { favicon } from 'extension/template/context/entry/deprecated/favicon';
import { fparam } from 'extension/template/context/entry/deprecated/fparam';
import { fparams } from 'extension/template/context/entry/deprecated/fparams';
import { fragment } from 'extension/template/context/entry/deprecated/fragment';
import { fsegment } from 'extension/template/context/entry/deprecated/fsegment';
import { fsegments } from 'extension/template/context/entry/deprecated/fsegments';
import { googl } from 'extension/template/context/entry/deprecated/googl';
import { googlAccount } from 'extension/template/context/entry/deprecated/googl-account';
import { googlOAuth } from 'extension/template/context/entry/deprecated/googl-oauth';
import { java } from 'extension/template/context/entry/deprecated/java';
import { linksTarget } from 'extension/template/context/entry/deprecated/links-target';
import { linksTitle } from 'extension/template/context/entry/deprecated/links-title';
import { menu } from 'extension/template/context/entry/deprecated/menu';
import { originalTitle } from 'extension/template/context/entry/deprecated/original-title';
import { originalUrl } from 'extension/template/context/entry/deprecated/original-url';
import { pageHeight } from 'extension/template/context/entry/deprecated/page-height';
import { pageWidth } from 'extension/template/context/entry/deprecated/page-width';
import { param } from 'extension/template/context/entry/deprecated/param';
import { params } from 'extension/template/context/entry/deprecated/params';
import { query } from 'extension/template/context/entry/deprecated/query';
import { short } from 'extension/template/context/entry/deprecated/short';
import { trimLeft } from 'extension/template/context/entry/deprecated/trim-left';
import { trimRight } from 'extension/template/context/entry/deprecated/trim-right';
import { unescape } from 'extension/template/context/entry/deprecated/unescape';
import { description } from 'extension/template/context/entry/description';
import { directory } from 'extension/template/context/entry/directory';
import { encodeBase64 } from 'extension/template/context/entry/encode-base64';
import { encodeUriComponent } from 'extension/template/context/entry/encode-uri-component';
import { escapeHtml } from 'extension/template/context/entry/escape-html';
import { faviconUrl } from 'extension/template/context/entry/favicon-url';
import { file } from 'extension/template/context/entry/file';
import { hash } from 'extension/template/context/entry/hash';
import { hashSearchParam } from 'extension/template/context/entry/hash-search-param';
import { hashSearchParams } from 'extension/template/context/entry/hash-search-params';
import { hashSegment } from 'extension/template/context/entry/hash-segment';
import { hashSegments } from 'extension/template/context/entry/hash-segments';
import { height } from 'extension/template/context/entry/height';
import { host } from 'extension/template/context/entry/host';
import { html } from 'extension/template/context/entry/html';
import { image } from 'extension/template/context/entry/image';
import { images } from 'extension/template/context/entry/images';
import { kebabCase } from 'extension/template/context/entry/kebab-case';
import { keyword } from 'extension/template/context/entry/keyword';
import { keywords } from 'extension/template/context/entry/keywords';
import { lastModified } from 'extension/template/context/entry/last-modified';
import { length } from 'extension/template/context/entry/length';
import { lower } from 'extension/template/context/entry/lower';
import { lowerCase } from 'extension/template/context/entry/lower-case';
import { origin } from 'extension/template/context/entry/origin';
import { path } from 'extension/template/context/entry/path';
import { popUrl } from 'extension/template/context/entry/pop-url';
import { port } from 'extension/template/context/entry/port';
import { protocol } from 'extension/template/context/entry/protocol';
import { pushUrl } from 'extension/template/context/entry/push-url';
import { relative } from 'extension/template/context/entry/relative';
import { screenColorDepth } from 'extension/template/context/entry/screen-color-depth';
import { search } from 'extension/template/context/entry/search';
import { searchParam } from 'extension/template/context/entry/search-param';
import { searchParams } from 'extension/template/context/entry/search-params';
import { segment } from 'extension/template/context/entry/segment';
import { segments } from 'extension/template/context/entry/segments';
import { shorten } from 'extension/template/context/entry/shorten';
import { snakeCase } from 'extension/template/context/entry/snake-case';
import { startCase } from 'extension/template/context/entry/start-case';
import { templateCount } from 'extension/template/context/entry/template-count';
import { templateCustomCount } from 'extension/template/context/entry/template-custom-count';
import { tidy } from 'extension/template/context/entry/tidy';
import { title } from 'extension/template/context/entry/title';
import { trim } from 'extension/template/context/entry/trim';
import { trimEnd } from 'extension/template/context/entry/trim-end';
import { trimStart } from 'extension/template/context/entry/trim-start';
import { unescapeHtml } from 'extension/template/context/entry/unescape-html';
import { upper } from 'extension/template/context/entry/upper';
import { upperCase } from 'extension/template/context/entry/upper-case';
import { url } from 'extension/template/context/entry/url';
import { uuid } from 'extension/template/context/entry/uuid';
import { version } from 'extension/template/context/entry/version';
import { width } from 'extension/template/context/entry/width';
import { wordCount } from 'extension/template/context/entry/word-count';
import { TemplateContextEntryDefinition } from 'extension/template/context/template-context.model';
import { defineWithAliases } from 'extension/template/context/template-context.utils';

export const templateContextEntriesDefinitions: TemplateContextEntryDefinition[] = [
  author,
  bitly,
  bitlyAccount,
  ...defineWithAliases(browserFullVersion, [browserVersion]),
  ...defineWithAliases(browserName, [browser]),
  browserMajorVersion,
  camelCase,
  ...defineWithAliases(capitalize, [capitalise]),
  characterSet,
  cookie,
  cookieNames,
  cookies,
  cookiesEnabled,
  dateTime,
  deburr,
  decodeBase64,
  ...defineWithAliases(decodeUriComponent, [decode]),
  description,
  directory,
  encodeBase64,
  ...defineWithAliases(encodeUriComponent, [encode]),
  encoded,
  ...defineWithAliases(escapeHtml, [escape]),
  ...defineWithAliases(faviconUrl, [favicon]),
  file,
  googl,
  ...defineWithAliases(googlAccount, [googlOAuth]),
  ...defineWithAliases(hash, [anchor, fragment]),
  ...defineWithAliases(hashSearchParam, [fparam]),
  ...defineWithAliases(hashSearchParams, [fparams]),
  ...defineWithAliases(hashSegment, [fsegment]),
  ...defineWithAliases(hashSegments, [fsegments]),
  ...defineWithAliases(height, [pageHeight]),
  host,
  html,
  image,
  images,
  java,
  kebabCase,
  keyword,
  keywords,
  lastModified,
  length,
  ...defineWithAliases(linksTarget, [anchorTarget, doAnchorTarget]),
  ...defineWithAliases(linksTitle, [anchorTitle, doAnchorTitle]),
  lower,
  lowerCase,
  ...defineWithAliases(menu, [contextMenu]),
  ...defineWithAliases(origin, [base]),
  path,
  popUrl,
  port,
  protocol,
  pushUrl,
  relative,
  ...defineWithAliases(screenColorDepth, [depth]),
  ...defineWithAliases(search, [query]),
  ...defineWithAliases(searchParam, [param]),
  ...defineWithAliases(searchParams, [params]),
  segment,
  segments,
  ...defineWithAliases(shorten, [short]),
  snakeCase,
  startCase,
  ...defineWithAliases(templateCount, [count]),
  ...defineWithAliases(templateCustomCount, [customCount]),
  tidy,
  ...defineWithAliases(title, [originalTitle]),
  trim,
  ...defineWithAliases(trimEnd, [trimRight]),
  ...defineWithAliases(trimStart, [trimLeft]),
  ...defineWithAliases(unescapeHtml, [unescape]),
  upper,
  upperCase,
  ...defineWithAliases(url, [originalUrl]),
  uuid,
  version,
  ...defineWithAliases(width, [pageWidth]),
  wordCount,
];
