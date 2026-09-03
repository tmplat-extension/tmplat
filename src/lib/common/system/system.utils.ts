// TODO: Find out how to replace this with an import
// eslint-disable-next-line @typescript-eslint/triple-slash-reference
///<reference path="../../../../node_modules/user-agent-data-types/index.d.ts" />

// `navigator` is read lazily, on every call, rather than captured at module-evaluation time. Reading it eagerly made
// the module's behaviour depend on *when* it happened to be imported, which is both fragile in the extension (the
// module can be pulled into a service worker before a page's `navigator` exists) and unusable under a shared test
// module registry. The reads are trivial, so there is nothing to gain from caching them.
const getPlatform = (): string => navigator.userAgentData?.platform ?? navigator.platform;

const isMac = (): boolean => {
  const uaPlatform = navigator.userAgentData?.platform;
  return uaPlatform ? uaPlatform === 'macOS' : navigator.platform.startsWith('Mac');
};

const findBrowserBrand = (): NavigatorUABrandVersion | undefined => {
  const brands = navigator.userAgentData?.brands ?? [];
  // TODO: Should the last entry always be given precedence?
  return brands[brands.length - 1];
};

export const getBrowserInfo = (): BrowserInfo | undefined => {
  const brand = findBrowserBrand();
  return brand ? { name: brand.brand, version: brand.version } : undefined;
};

export const getOs = (): string => getPlatform();

export const getFullBrowserInfo = async (): Promise<BrowserInfo | undefined> => {
  const brand = findBrowserBrand();
  if (!brand) {
    return;
  }

  let fullVersion: string | undefined;
  try {
    const values = await navigator.userAgentData?.getHighEntropyValues(['fullVersionList', 'uaFullVersion']);
    if (values?.fullVersionList) {
      // TODO: Should the last entry always be given precedence?
      fullVersion = values.fullVersionList[values.fullVersionList.length - 1]?.version;
    } else {
      fullVersion = values?.uaFullVersion;
    }
  } catch (_) {
    // Do nothing
  }

  return {
    name: brand.brand,
    version: fullVersion ?? brand.version,
  };
};

export const getShortcutModifier = (): string => (isMac() ? '⇧⌥' : 'Ctrl+Alt+');

export const isShortcutModifierActive = (event: KeyboardEvent): boolean =>
  isMac() ? event.shiftKey && event.altKey : event.ctrlKey && event.altKey;

export type BrowserInfo = {
  readonly name: string;
  readonly version: string;
};
