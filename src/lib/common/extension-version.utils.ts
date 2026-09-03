import { type ExtensionVersion } from 'extension/common/extension-version';

const versionPattern = /^\d+\.\d+\.\d+$/;

/**
 * Determines whether the specified value is an {@link ExtensionVersion}.
 *
 * Since the known versions are generated from the changelog, only the structure of the value can be checked.
 */
export function isExtensionVersion(value: unknown): value is ExtensionVersion {
  return typeof value === 'string' && versionPattern.test(value);
}
