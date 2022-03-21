// TODO: Find out how to replace this with an import
// eslint-disable-next-line @typescript-eslint/triple-slash-reference
///<reference path="../../../../node_modules/user-agent-data-types/index.d.ts" />

export function getBrowserInfo(): BrowserInfo {
  const { brand, version } = findBrowserBrand();

  return {
    name: brand,
    version,
  };
}

export async function getFullBrowserInfo(): Promise<BrowserInfo> {
  const { brand, version } = findBrowserBrand();
  let values: UADataValues | undefined;

  try {
    values = await navigator.userAgentData?.getHighEntropyValues(['uaFullVersion']);
  } catch (_) {
    // Do nothing
  }

  return {
    name: brand,
    version: values?.uaFullVersion ?? version,
  };
}

export function getShortcutModifier() {
  return isMac() ? '⇧⌥' : 'Ctrl+Alt+';
}

export function isShortcutModifierActive(event: KeyboardEvent): boolean {
  return isMac() ? event.shiftKey && event.altKey : event.ctrlKey && event.altKey;
}

function findBrowserBrand(): NavigatorUABrandVersion {
  const brands = navigator.userAgentData!.brands;
  // TODO: Should the last brand always be given precedence?
  const brand = brands[brands.length - 1];
  if (!brand) {
    throw new Error('Browser information could not be derived from User-Agent data');
  }

  return brand;
}

function isMac(): boolean {
  return navigator.userAgentData!.platform === 'macOS';
}

export type BrowserInfo = {
  readonly name: string;
  readonly version: string;
};
