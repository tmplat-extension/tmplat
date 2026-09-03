import { describe, expect, it } from 'vitest';
import { isExtensionVersion } from 'extension/common/extension-version.utils';

describe('isExtensionVersion', () => {
  it.each(['0.0.0', '1.2.3', '2.0.0', '10.20.30'])('returns true for %s', (value) => {
    expect(isExtensionVersion(value)).toBe(true);
  });

  it.each([
    ['a two-part version', '1.2'],
    ['a four-part version', '1.2.3.4'],
    ['a pre-release version', '1.2.3-beta'],
    ['a v-prefixed version', 'v1.2.3'],
    ['a version with surrounding whitespace', ' 1.2.3 '],
    ['an empty string', ''],
    ['a non-numeric part', '1.x.3'],
  ])('returns false for %s', (_label, value) => {
    expect(isExtensionVersion(value)).toBe(false);
  });

  it.each([null, undefined, 1, {}, ['1.2.3']])('returns false for the non-string %j', (value) => {
    expect(isExtensionVersion(value)).toBe(false);
  });
});
