import { ExtensionVersion } from 'extension/common/extension-version.enum';

export type Changelog = ChangelogEntry[];

export type ChangelogEntry = {
  readonly date: string;
  readonly features?: string[];
  readonly fixes?: string[];
  readonly improvements?: string[];
  readonly knownIssues?: string[];
  readonly version: ExtensionVersion;
};
