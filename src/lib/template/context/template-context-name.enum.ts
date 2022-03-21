// TODO: Complete
export const enum TemplateContextName {
  /** @deprecated Deprecated since 2.0.0, use `Hash` instead. */
  Anchor = 'anchor',
  /** @deprecated Deprecated since 1.2.5, use `Options` instead. */
  AnchorTarget = 'anchortarget',
  /** @deprecated Deprecated since 1.2.5, use `Options` instead. */
  AnchorTitle = 'anchortitle',
  Author = 'author',
  /** @deprecated Deprecated since 2.0.0, use `Origin` instead. */
  Base = 'base',
  /** @deprecated Deprecated since 2.0.0, use `Options` instead. */
  Bitly = 'bitly',
  /** @deprecated Deprecated since 2.0.0, use `Options` instead. */
  BitlyAccount = 'bitlyaccount',
  /** @deprecated Deprecated since 2.0.0, use `BrowserName` instead. */
  Browser = 'browser',
  BrowserFullVersion = 'browserfullversion',
  BrowserMajorVersion = 'browsermajorversion',
  BrowserName = 'browsername',
  /** @deprecated Deprecated since 2.0.0, use `BrowserFullVersion` instead. */
  BrowserVersion = 'browserversion',
  CamelCase = 'camelcase',
  /** @deprecated Deprecated since 2.0.0, use `Capitalize` instead. */
  Capitalise = 'capitalise',
  Capitalize = 'capitalize',
  CharacterSet = 'characterset',
  /** @deprecated Deprecated since 1.0.0, use `Options` instead. */
  ContextMenu = 'contextmenu',
  Cookie = 'cookie',
  CookieNames = 'cookienames',
  Cookies = 'cookies',
  CookiesEnabled = 'cookiesenabled',
  /** @deprecated Deprecated since 2.0.0, use `TemplateCount` instead. */
  Count = 'count',
  /** @deprecated Deprecated since 2.0.0, use `TemplateCustomCount` instead. */
  CustomCount = 'customcount',
  DateTime = 'datetime',
  Deburr = 'deburr',
  /** @deprecated Deprecated since 2.0.0, use `DecodeUriComponent` instead. */
  Decode = 'decode',
  DecodeBase64 = 'decodebase64',
  DecodeUriComponent = 'decodeuricomponent',
  /** @deprecated Deprecated since 2.0.0, use `ScreenColorDepth` instead. */
  Depth = 'depth',
  Description = 'description',
  Directory = 'directory',
  /** @deprecated Deprecated since 1.0.0, use `Options` instead. */
  DoAnchorTarget = 'doanchortarget',
  /** @deprecated Deprecated since 1.0.0, use `Options` instead. */
  DoAnchorTitle = 'doanchortitle',
  /** @deprecated Deprecated since 2.0.0, use `EncodeUriComponent` instead. */
  Encode = 'encode',
  EncodeBase64 = 'encodebase64',
  EncodeUriComponent = 'encodeuricomponent',
  /** @deprecated Deprecated since 1.0.0, use `EncodeUriComponent` instead. */
  Encoded = 'encoded',
  /** @deprecated Deprecated since 2.0.0, use `EscapeHtml` instead. */
  Escape = 'escape',
  EscapeHtml = 'escapehtml',
  /** @deprecated Deprecated since 2.0.0, use `FaviconUrl` instead. */
  Favicon = 'favicon',
  FaviconUrl = 'faviconUrl',
  File = 'file',
  /** @deprecated Deprecated since 2.0.0, use `HashSearchParam` instead. */
  FParam = 'fparam',
  /** @deprecated Deprecated since 2.0.0, use `HashSearchParams` instead. */
  FParams = 'fparams',
  /** @deprecated Deprecated since 2.0.0, use `HashSegment` instead. */
  FSegment = 'fsegment',
  /** @deprecated Deprecated since 2.0.0, use `HashSegments` instead. */
  FSegments = 'fsegments',
  /** @deprecated Deprecated since 2.0.0, use `Hash` instead. */
  Fragment = 'fragment',
  /** @deprecated Deprecated since 2.0.0, Google URL shortener has been removed. */
  Googl = 'googl',
  /** @deprecated Deprecated since 2.0.0, Google URL shortener has been removed. */
  GooglAccount = 'googlaccount',
  /** @deprecated Deprecated since 1.0.0, use `GoogleAccount` instead. */
  GooglOAuth = 'googloauth',
  Hash = 'hash',
  HashSearchParam = 'hashsearchparam',
  HashSearchParams = 'hashsearchparams',
  HashSegment = 'hashsegment',
  HashSegments = 'hashsegments',
  Height = 'height',
  Host = 'host',
  Html = 'html',
  Image = 'image',
  Images = 'images',
  /** @deprecated Deprecated since 2.0.0, is false is all modern browsers. */
  Java = 'java',
  KebabCase = 'kebabcase',
  Keyword = 'keyword',
  Keywords = 'keywords',
  LastModified = 'lastmodified',
  Length = 'length',
  /** @deprecated Deprecated since 2.0.0, use `Options` instead. */
  LinksTarget = 'linkstarget',
  /** @deprecated Deprecated since 2.0.0, use `Options` instead. */
  LinksTitle = 'linkstitle',
  Lower = 'lower',
  LowerCase = 'lowercase',
  /** @deprecated Deprecated since 1.0.0, use `Options` instead. */
  Menu = 'menu',
  Origin = 'origin',
  /** @deprecated Deprecated since 2.0.0, use `Title` instead. */
  OriginalTitle = 'originaltitle',
  /** @deprecated Deprecated since 2.0.0, use `Url` instead. */
  OriginalUrl = 'originalurl',
  /** @deprecated Deprecated since 2.0.0, use `Height` instead. */
  PageHeight = 'pageheight',
  /** @deprecated Deprecated since 2.0.0, use `Width` instead. */
  PageWidth = 'pagewidth',
  /** @deprecated Deprecated since 2.0.0, use `SearchParam` instead. */
  Param = 'param',
  /** @deprecated Deprecated since 2.0.0, use `SearchParams` instead. */
  Params = 'params',
  Path = 'path',
  PopUrl = 'popurl',
  Port = 'port',
  Protocol = 'protocol',
  PushUrl = 'pushurl',
  /** @deprecated Deprecated since 2.0.0, use `Search` instead. */
  Query = 'query',
  Relative = 'relative',
  ScreenColorDepth = 'screencolordepth',
  Search = 'search',
  SearchParam = 'searchparam',
  SearchParams = 'searchparams',
  Segment = 'segment',
  Segments = 'segments',
  /** @deprecated Deprecated since 1.0.0, use `Shorten` instead. */
  Short = 'short',
  Shorten = 'shorten',
  SnakeCase = 'snakecase',
  StartCase = 'startcase',
  TemplateCount = 'templatecount',
  TemplateCustomCount = 'templatecustomcount',
  Tidy = 'tidy',
  Title = 'title',
  Trim = 'trim',
  TrimEnd = 'trimend',
  /** @deprecated Deprecated since 2.0.0, use `TrimStart` instead. */
  TrimLeft = 'trimleft',
  /** @deprecated Deprecated since 2.0.0, use `TrimEnd` instead. */
  TrimRight = 'trimright',
  TrimStart = 'trimstart',
  /** @deprecated Deprecated since 2.0.0, use `UnescapeHtml` instead. */
  Unescape = 'unescape',
  UnescapeHtml = 'unescapehtml',
  Upper = 'upper',
  UpperCase = 'uppercase',
  Url = 'url',
  Uuid = 'uuid',
  Version = 'version',
  Width = 'width',
  WordCount = 'wordcount',
}
