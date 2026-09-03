declare module '*.scss';
declare module '*.sass';
declare module '*.css';

// Replaced at build time by rolldown's `define` (see rolldown.config.mjs).
declare const process: {
  env: {
    EXT_COMMIT?: string;
    EXT_ENV?: string;
  };
};

// Modern browsers (including Chrome from v152) expose the WebExtensions API as a global `browser`,
// in addition to the Chrome-specific `chrome` global. It is functionally equivalent to `chrome`, so
// it is aliased as a namespace (rather than just `typeof chrome`) to allow referencing nested types
// too, e.g. `browser.tabs.Tab`. See `extension/common/system/browser-api.polyfill` for the runtime
// fallback used on browsers that only expose `chrome`.
import browser = chrome;
