import { Changelog } from 'extension/common/changelog/changelog.model';
import { changelogSchema } from 'extension/common/changelog/changelog.schema';
import { inject, injectable } from 'extension/common/di';
import { ExtensionInfo, ExtensionInfoToken } from 'extension/common/extension-info';
import { validateSchemaAsync } from 'extension/common/validation.utils';

/**
 * Path of the changelog data bundled with the extension, which is generated from "docs/changelog.json" at build
 * time.
 */
export const ChangelogFilePath = 'changelog.json';

/**
 * Path of the page that renders the changelog.
 */
export const ChangelogPagePath = 'changelog.html';

export const ChangelogServiceToken = Symbol('ChangelogService');

@injectable()
export class ChangelogService {
  private cachedChangelog: Changelog | undefined;

  constructor(@inject(ExtensionInfoToken) private readonly extensionInfo: ExtensionInfo) {}

  /**
   * Returns every documented version, ordered from oldest to newest.
   */
  async getChangelog(): Promise<Changelog> {
    if (!this.cachedChangelog) {
      const url = this.extensionInfo.createExtensionUrlString(ChangelogFilePath);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Changelog could not be loaded: ${response.status} ${response.statusText}`);
      }

      this.cachedChangelog = await validateSchemaAsync<Changelog>(changelogSchema, await response.json(), {
        general: (error) => new Error(`Changelog is invalid: ${error?.message}`),
        undefinedValue: () => new Error('Changelog cannot be validated'),
      });
    }

    return [...this.cachedChangelog];
  }
}
