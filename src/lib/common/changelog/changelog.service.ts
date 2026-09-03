import { type Changelog, ChangelogSchema } from 'extension/common/changelog/changelog.schema';
import { inject, injectable } from 'extension/common/di';
import { ExtensionError } from 'extension/common/error/extension-error';
import { type ExtensionInfo, ExtensionInfoToken } from 'extension/common/extension-info';
import { type Logger } from 'extension/common/logging/logger';
import { type LoggingService, LoggingServiceToken } from 'extension/common/logging/logging.service';
import { type ValidationService, ValidationServiceToken } from 'extension/common/validation/validation.service';

const ChangelogServiceName = 'ChangelogService';

/**
 * Path of the changelog data bundled with the extension, which is generated from "docs/changelog.json" at build
 * time.
 */
export const ChangelogFilePath = 'changelog.json';

/**
 * Path of the page that renders the changelog.
 */
export const ChangelogPagePath = 'changelog.html';

export const ChangelogServiceToken = Symbol(ChangelogServiceName);

@injectable()
export class ChangelogService {
  private cachedChangelog: Changelog | undefined;
  private readonly logger: Logger;

  constructor(
    @inject(ExtensionInfoToken) private readonly extensionInfo: ExtensionInfo,
    @inject(LoggingServiceToken) logging: LoggingService,
    @inject(ValidationServiceToken) private readonly validationService: ValidationService,
  ) {
    this.logger = logging.getLogger(ChangelogServiceName);
  }

  /**
   * Returns every documented version, ordered from oldest to newest.
   */
  async getChangelog(): Promise<Changelog> {
    if (!this.cachedChangelog) {
      const url = this.extensionInfo.createExtensionUrlString(ChangelogFilePath);
      const response = await fetch(url);
      if (!response.ok) {
        this.logger.error('Failed to load changelog', { url, status: response.status });

        throw ExtensionError.from('CHA500000');
      }

      const body = await response.json();
      this.cachedChangelog = this.validationService.validateSchema(body, ChangelogSchema, {
        code: 'CHA422000',
        parentLogger: this.logger,
      });
    }

    return [...this.cachedChangelog];
  }
}
