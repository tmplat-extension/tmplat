import { injectable } from 'extension/common/di';
import { isEnumStringValue } from 'extension/common/enum.utils';
import { ExtensionVersion } from 'extension/common/extension-version.enum';
import { hasUrlParams } from 'extension/common/url.utils';

export const ExtensionInfoToken = Symbol('ExtensionInfo');

@injectable()
export class ExtensionInfo {
  readonly productionId = 'dcjnfaoifoefmnbhhlbppaebgnccfddf';

  private cachedVersion: ExtensionVersion | null = null;

  convertStringToExtensionVersion(version: string | undefined | null): ExtensionVersion {
    if (version == null) {
      throw new Error('Extension version is not available');
    }
    if (!isEnumStringValue(ExtensionVersion, version)) {
      throw new Error(`Extension version is unrecognised: '${version}'`);
    }

    return version;
  }

  createExtensionUrl(path = '', params: Record<string, string> = {}): URL {
    const url = new URL(chrome.runtime.getURL(path));

    Object.entries(params).forEach(([name, value]) => {
      if (value) {
        url.searchParams.set(name, value);
      }
    });

    return url;
  }

  createExtensionUrlString(path?: string, params?: Record<string, string>): string {
    return this.createExtensionUrl(path, params).toString();
  }

  isExtensionUrl(url: string, expectedPath?: string, expectedParams?: Record<string, string>): boolean {
    const actualUrl = new URL(url);

    if (expectedPath && expectedPath !== actualUrl.pathname) {
      return false;
    }
    if (expectedParams && !hasUrlParams(actualUrl, expectedParams)) {
      return false;
    }

    const expectedUrl = this.createExtensionUrl();

    return actualUrl.origin === expectedUrl.origin;
  }

  get currentId(): string {
    return chrome.runtime.id;
  }

  get isProduction(): boolean {
    return this.currentId === this.productionId;
  }

  get version(): ExtensionVersion {
    if (!this.cachedVersion) {
      this.cachedVersion = this.convertStringToExtensionVersion(chrome.runtime.getManifest().version);
    }

    return this.cachedVersion;
  }

  get versionHash(): string {
    const hash = process.env.EXTENSION_VERSION_HASH;
    const version = this.version;

    return hash ? `${version}#${hash}` : version;
  }
}
