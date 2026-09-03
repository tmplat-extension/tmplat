import { beforeEach } from 'vitest';
import { installBrowserApiMock } from 'extension/test/browser-api.mock';

// `self` is the global scope in both a service worker and a browser page, and some bundled dependencies (notably
// `europa`, pulled in transitively by the markdown service) read it at *import* time. Node does not define it, so it
// has to be set up here, at module scope, before any test module is imported — a `beforeEach` would run too late.
globalThis.self ??= globalThis as Window & typeof globalThis;

// Code under test references the `browser`/`chrome` globals, which don't exist outside of an extension context, so a
// fresh fake is installed before every test. Vitest unstubs globals after each test (see `vitest.config.ts`).
beforeEach(() => {
  installBrowserApiMock();
});
