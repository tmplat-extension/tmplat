// Modern browsers (including Chrome from v152) expose the WebExtensions API as a global `browser`,
// functionally equivalent to the Chrome-specific `chrome` global (see `extension/declarations.d.ts`).
// Older browsers only expose `chrome`, so this ensures `browser` is always available, allowing code
// to reference `browser` instead of (or as well as) `chrome` for improved cross-browser compatibility.
if (typeof globalThis.browser === 'undefined') {
  globalThis.browser = chrome;
}

export {};
