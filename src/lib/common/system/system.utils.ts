// `navigator` is read lazily, on every call, rather than captured at module-evaluation time. Reading it eagerly made
// the module's behaviour depend on *when* it happened to be imported, which is both fragile in the extension (the
// module can be pulled into a service worker before a page's `navigator` exists) and unusable under a shared test
// module registry. The reads are trivial, so there is nothing to gain from caching them.
const getPlatform = (): string => navigator.userAgentData?.platform ?? navigator.platform;

const isMac = (): boolean => {
  const uaPlatform = navigator.userAgentData?.platform;
  return uaPlatform ? uaPlatform === 'macOS' : navigator.platform.startsWith('Mac');
};

// Chromium-based browsers intentionally randomize the order of `brands`/`fullVersionList` entries on every
// version release (an anti-fingerprinting measure similar to TLS GREASE), so the real brand can't be picked by
// position (first, last, or otherwise). Each list typically contains: a "greased" fake brand with a name like
// "Not/A)Brand" or "Not;A=Brand" (the exact punctuation/wording varies by design), the generic "Chromium" engine
// brand, and - for browsers that identify themselves - their own product brand (e.g. "Google Chrome", "Microsoft
// Edge"). To find the most accurate brand we filter out the greased entry and prefer whatever isn't "Chromium",
// falling back to "Chromium" itself for forks that don't report their own brand.
const GREASED_BRAND_PATTERN = /not[^a-z0-9]*a[^a-z0-9]*brand/i;

const pickSignificantBrand = <T extends NavigatorUABrandVersion>(brands: readonly T[]): T | undefined => {
  const significant = brands.filter((brand) => !GREASED_BRAND_PATTERN.test(brand.brand));
  return significant.find((brand) => brand.brand !== 'Chromium') ?? significant[0];
};

const findBrowserBrand = (): NavigatorUABrandVersion | undefined => {
  const brands = navigator.userAgentData?.brands ?? [];
  return pickSignificantBrand(brands);
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
      fullVersion = pickSignificantBrand(values.fullVersionList)?.version;
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
