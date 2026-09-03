import { injectable } from 'extension/common/di';
import { isEnumStringValue } from 'extension/common/enum.utils';
import { ExtensionEnvironment } from 'extension/common/extension-environment.enum';
import { ExtensionVersion } from 'extension/common/extension-version.enum';
import { hasUrlParams } from 'extension/common/url.utils';

export const ExtensionInfoToken = Symbol('ExtensionInfo');

@injectable()
export class ExtensionInfo {
  private cachedEnvironment: ExtensionEnvironment | undefined;
  private cachedVersion: ExtensionVersion | undefined;

  convertStringToExtensionEnvironment(environment: string | null | undefined): ExtensionEnvironment {
    if (environment == null) {
      throw new Error('Extension environment is not available');
    }
    if (!isEnumStringValue(ExtensionEnvironment, environment)) {
      throw new Error(`Extension environment is unrecognised: '${environment}'`);
    }

    return environment;
  }

  convertStringToExtensionVersion(version: string | null | undefined): ExtensionVersion {
    if (version == null) {
      throw new Error('Extension version is not available');
    }
    if (!isEnumStringValue(ExtensionVersion, version)) {
      throw new Error(`Extension version is unrecognised: '${version}'`);
    }

    return version;
  }

  createExtensionUrl(path = '', params: Record<string, string> = {}): URL {
    const url = new URL(browser.runtime.getURL(path));

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

  getEnvironment(): ExtensionEnvironment {
    if (!this.cachedEnvironment) {
      this.cachedEnvironment = process.env.EXT_ENV
        ? this.convertStringToExtensionEnvironment(process.env.EXT_ENV)
        : ExtensionEnvironment.Production;
    }

    return this.cachedEnvironment;
  }

  getVersion(): ExtensionVersion;
  getVersion(includeCommit: false | undefined): ExtensionVersion;
  getVersion(includeCommit: true): string;
  getVersion(includeCommit?: boolean): string {
    if (!this.cachedVersion) {
      this.cachedVersion = this.convertStringToExtensionVersion(browser.runtime.getVersion());
    }

    if (includeCommit && process.env.EXT_COMMIT) {
      return `${this.cachedVersion}#${process.env.EXT_COMMIT}`;
    }
    return this.cachedVersion;
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

  get id(): string {
    return browser.runtime.id;
  }

  get isProduction(): boolean {
    return this.getEnvironment() === ExtensionEnvironment.Production;
  }
}
