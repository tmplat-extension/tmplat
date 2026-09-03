// TODO: Complete
export const enum TemplateContextName {
  /** @deprecated Deprecated since 2.0.0, use `Hash` instead. */
  Anchor = 'anchor',
  /** @deprecated Deprecated since 1.2.5, use `Options` instead. */
  AnchorTarget = 'anchorTarget',
  /** @deprecated Deprecated since 1.2.5, use `Options` instead. */
  AnchorTitle = 'anchorTitle',
  Author = 'author',
  Authority = 'authority',
  /** @deprecated Deprecated since 2.0.0, use `Origin` instead. */
  Base = 'base',
  /** @deprecated Deprecated since 2.0.0, use `Options` instead. */
  Bitly = 'bitly',
  /** @deprecated Deprecated since 2.0.0, use `Options` instead. */
  BitlyAccount = 'bitlyAccount',
  /** @deprecated Deprecated since 2.0.0, use `BrowserName` instead. */
  Browser = 'browser',
  BrowserFullVersion = 'browserFullVersion',
  BrowserMajorVersion = 'browserMajorVersion',
  BrowserName = 'browserName',
  /** @deprecated Deprecated since 2.0.0, use `BrowserFullVersion` instead. */
  BrowserVersion = 'browserVersion',
  CamelCase = 'camelCase',
  /** @deprecated Deprecated since 2.0.0, use `Capitalize` instead. */
  Capitalise = 'capitalise',
  Capitalize = 'capitalize',
  CharacterSet = 'characterSet',
  /** @deprecated Deprecated since 1.0.0, use `Options` instead. */
  ContextMenu = 'contextMenu',
  Cookie = 'cookie',
  CookieNames = 'cookieNames',
  Cookies = 'cookies',
  CookiesEnabled = 'cookiesEnabled',
  Coords = 'coords',
  /** @deprecated Deprecated since 2.0.0, use `TemplateCount` instead. */
  Count = 'count',
  /** @deprecated Deprecated since 2.0.0, use `TemplateCustomCount` instead. */
  CustomCount = 'customCount',
  DateTime = 'dateTime',
  Deburr = 'deburr',
  /** @deprecated Deprecated since 2.0.0, use `DecodeUriComponent` instead. */
  Decode = 'decode',
  DecodeBase64 = 'decodeBase64',
  DecodeUriComponent = 'decodeUriComponent',
  /** @deprecated Deprecated since 2.0.0, use `ScreenColorDepth` instead. */
  Depth = 'depth',
  Description = 'description',
  Directory = 'directory',
  /** @deprecated Deprecated since 1.0.0, use `Options` instead. */
  DoAnchorTarget = 'doAnchorTarget',
  /** @deprecated Deprecated since 1.0.0, use `Options` instead. */
  DoAnchorTitle = 'doAnchorTitle',
  /** @deprecated Deprecated since 2.0.0, use `EncodeUriComponent` instead. */
  Encode = 'encode',
  EncodeBase64 = 'encodeBase64',
  EncodeUriComponent = 'encodeUriComponent',
  /** @deprecated Deprecated since 1.0.0, use `EncodeUriComponent` instead. */
  Encoded = 'encoded',
  /** @deprecated Deprecated since 2.0.0, use `EscapeHtml` instead. */
  Escape = 'escape',
  EscapeHtml = 'escapeHtml',
  /** @deprecated Deprecated since 2.0.0, use `FaviconUrl` instead. */
  Favicon = 'favicon',
  FaviconUrl = 'faviconUrl',
  File = 'file',
  /** @deprecated Deprecated since 2.0.0, use `HashSearchParam` instead. */
  Fparam = 'fparam',
  /** @deprecated Deprecated since 2.0.0, use `HashSearchParams` instead. */
  Fparams = 'fparams',
  /** @deprecated Deprecated since 2.0.0, use `HashSegment` instead. */
  Fsegment = 'fsegment',
  /** @deprecated Deprecated since 2.0.0, use `HashSegments` instead. */
  Fsegments = 'fsegments',
  /** @deprecated Deprecated since 2.0.0, use `Hash` instead. */
  Fragment = 'fragment',
  /** @deprecated Deprecated since 2.0.0, Google URL shortener has been removed. */
  Googl = 'googl',
  /** @deprecated Deprecated since 2.0.0, Google URL shortener has been removed. */
  GooglAccount = 'googlAccount',
  /** @deprecated Deprecated since 1.0.0, use `GoogleAccount` instead. */
  GooglOAuth = 'googlOAuth',
  Hash = 'hash',
  HashSearchParam = 'hashSearchParam',
  HashSearchParams = 'hashSearchParams',
  HashSegment = 'hashSegment',
  HashSegments = 'hashSegments',
  Height = 'height',
  Host = 'host',
  Html = 'html',
  Image = 'image',
  Images = 'images',
  /** @deprecated Deprecated since 2.0.0, is false is all modern browsers. */
  Java = 'java',
  KebabCase = 'kebabCase',
  Keyword = 'keyword',
  Keywords = 'keywords',
  LastModified = 'lastModified',
  Length = 'length',
  LinkHtml = 'linkHtml',
  LinkMarkdown = 'linkMarkdown',
  Links = 'links',
  /** @deprecated Deprecated since 2.0.0, use `Options` instead. */
  LinksTarget = 'linksTarget',
  /** @deprecated Deprecated since 2.0.0, use `Options` instead. */
  LinksTitle = 'linksTitle',
  LinkText = 'linkText',
  Locale = 'locale',
  LocalStorage = 'localStorage',
  Lower = 'lower',
  LowerCase = 'lowerCase',
  Markdown = 'markdown',
  /** @deprecated Deprecated since 2.0.0, use `Options` instead. */
  MarkdownInline = 'markdownInline',
  /** @deprecated Deprecated since 1.0.0, use `Options` instead. */
  Menu = 'menu',
  /** @deprecated Deprecated since 2.0.0, use `Options` instead. */
  MenuOptions = 'menuOptions',
  /** @deprecated Deprecated since 2.0.0, use `Options` instead. */
  MenuPaste = 'menuPaste',
  Meta = 'meta',
  /** @deprecated Deprecated since 1.2.7, no longer configurable. */
  NotificationDuration = 'notificationDuration',
  /** @deprecated Deprecated since 2.0.0, use `Options` instead. */
  Notifications = 'notifications',
  Offline = 'offline',
  Options = 'options',
  Origin = 'origin',
  /** @deprecated Deprecated since 1.0.0, use `Url` instead. */
  OriginalSource = 'originalSource',
  /** @deprecated Deprecated since 2.0.0, use `Title` instead. */
  OriginalTitle = 'originalTitle',
  /** @deprecated Deprecated since 2.0.0, use `Url` instead. */
  OriginalUrl = 'originalUrl',
  Os = 'os',
  /** @deprecated Deprecated since 2.0.0, use `Height` instead. */
  PageHeight = 'pageHeight',
  /** @deprecated Deprecated since 2.0.0, use `Width` instead. */
  PageWidth = 'pageWidth',
  /** @deprecated Deprecated since 2.0.0, use `SearchParam` instead. */
  Param = 'param',
  /** @deprecated Deprecated since 2.0.0, use `SearchParams` instead. */
  Params = 'params',
  Password = 'password',
  Path = 'path',
  Plugins = 'plugins',
  /** @deprecated Deprecated since 2.0.0, no longer tracked. */
  Popular = 'popular',
  PopUrl = 'popUrl',
  Port = 'port',
  Protocol = 'protocol',
  PushUrl = 'pushUrl',
  /** @deprecated Deprecated since 2.0.0, use `Search` instead. */
  Query = 'query',
  Referrer = 'referrer',
  Relative = 'relative',
  ScreenColorDepth = 'screenColorDepth',
  ScreenHeight = 'screenHeight',
  ScreenWidth = 'screenWidth',
  Scripts = 'scripts',
  Search = 'search',
  SearchParam = 'searchParam',
  SearchParams = 'searchParams',
  Segment = 'segment',
  Segments = 'segments',
  Select = 'select',
  SelectAll = 'selectAll',
  SelectAllHtml = 'selectAllHtml',
  SelectAllMarkdown = 'selectAllMarkdown',
  SelectedImages = 'selectedImages',
  SelectedLinks = 'selectedLinks',
  SelectHtml = 'selectHtml',
  Selection = 'selection',
  SelectionHtml = 'selectionHtml',
  /** @deprecated Deprecated since 1.0.0, use `SelectedLinks` instead. */
  SelectionLinks = 'selectionLinks',
  SelectionMarkdown = 'selectionMarkdown',
  SelectMarkdown = 'selectMarkdown',
  SessionStorage = 'sessionStorage',
  /** @deprecated Deprecated since 1.0.0, use `Shorten` instead. */
  Short = 'short',
  Shorten = 'shorten',
  /** @deprecated Deprecated since 2.0.0, use `Options` instead. */
  Shortcuts = 'shortcuts',
  /** @deprecated Deprecated since 2.0.0, use `Options` instead. */
  ShortcutsPaste = 'shortcutsPaste',
  SnakeCase = 'snakeCase',
  Source = 'source',
  StartCase = 'startCase',
  StyleSheets = 'styleSheets',
  Tabs = 'tabs',
  Template = 'template',
  TemplateCount = 'templateCount',
  TemplateCustomCount = 'templateCustomCount',
  Text = 'text',
  Tidy = 'tidy',
  Title = 'title',
  /** @deprecated Deprecated since 2.0.0, use `Options` instead. */
  ToolbarClose = 'toolbarClose',
  /** @deprecated Deprecated since 1.0.0, use the inverse of `ToolbarPopup` instead. */
  ToolbarFeature = 'toolbarFeature',
  /** @deprecated Deprecated since 1.0.0, use `ToolbarStyle` instead. */
  ToolbarFeatureDetails = 'toolbarFeatureDetails',
  /** @deprecated Deprecated since 1.0.0, use `ToolbarKey` instead. */
  ToolbarFeatureName = 'toolbarFeatureName',
  /** @deprecated Deprecated since 2.0.0, use `Options` instead. */
  ToolbarKey = 'toolbarKey',
  /** @deprecated Deprecated since 2.0.0, use `Options` instead. */
  ToolbarOptions = 'toolbarOptions',
  /** @deprecated Deprecated since 2.0.0, use `Options` instead. */
  ToolbarPopup = 'toolbarPopup',
  /** @deprecated Deprecated since 1.1.0, no longer supported. */
  ToolbarStyle = 'toolbarStyle',
  Trim = 'trim',
  TrimEnd = 'trimEnd',
  /** @deprecated Deprecated since 2.0.0, use `TrimStart` instead. */
  TrimLeft = 'trimLeft',
  /** @deprecated Deprecated since 2.0.0, use `TrimEnd` instead. */
  TrimRight = 'trimRight',
  TrimStart = 'trimStart',
  /** @deprecated Deprecated since 2.0.0, use `UnescapeHtml` instead. */
  Unescape = 'unescape',
  UnescapeHtml = 'unescapeHtml',
  Upper = 'upper',
  UpperCase = 'upperCase',
  Url = 'url',
  User = 'user',
  UserInfo = 'userInfo',
  Uuid = 'uuid',
  Version = 'version',
  Width = 'width',
  WordCount = 'wordCount',
  Xpath = 'xpath',
  XpathAll = 'xpathAll',
  XpathAllHtml = 'xpathAllHtml',
  XpathAllMarkdown = 'xpathAllMarkdown',
  XpathHtml = 'xpathHtml',
  XpathMarkdown = 'xpathMarkdown',
  /** @deprecated Deprecated since 2.0.0, use `Options` instead. */
  Yourls = 'yourls',
  /** @deprecated Deprecated since 2.0.0, use `Options` instead. */
  YourlsAuthentication = 'yourlsAuthentication',
  /** @deprecated Deprecated since 2.0.0, use `Options` instead. */
  YourlsPassword = 'yourlsPassword',
  /** @deprecated Deprecated since 2.0.0, use `Options` instead. */
  YourlsSignature = 'yourlsSignature',
  /** @deprecated Deprecated since 2.0.0, use `Options` instead. */
  YourlsUrl = 'yourlsUrl',
  /** @deprecated Deprecated since 2.0.0, use `Options` instead. */
  YourlsUsername = 'yourlsUsername',
}
