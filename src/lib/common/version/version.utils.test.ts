import { describe, expect, it } from 'vitest';
import { VersionSegment } from 'extension/common/version/version-segment.enum';
import { type Version } from 'extension/common/version/version.model';
import {
  compareVersions,
  diffVersions,
  isVersionDiffScopeWithin,
  parseVersion,
} from 'extension/common/version/version.utils';

describe('parseVersion', () => {
  it('parses a full major.minor.patch version', () => {
    expect(parseVersion('1.2.3')).toEqual({ major: 1, minor: 2, patch: 3 });
  });

  it('treats missing segments as zero', () => {
    expect(parseVersion('1')).toEqual({ major: 1, minor: 0, patch: 0 });
    expect(parseVersion('1.2')).toEqual({ major: 1, minor: 2, patch: 0 });
  });

  it('ignores a trailing pre-release suffix on a segment', () => {
    expect(parseVersion('1.2.3-beta.4')).toEqual({ major: 1, minor: 2, patch: 3 });
  });

  it('throws when a present segment does not start with a number', () => {
    expect(() => parseVersion('1.x.0')).toThrow(/invalid segment/);
  });
});

describe('diffVersions', () => {
  it('accepts version strings', () => {
    expect(diffVersions('2.0.0', '1.0.0')).toMatchObject({ major: 1, minor: 0, patch: 0 });
  });

  it('accepts parsed Version objects', () => {
    const a: Version = { major: 1, minor: 5, patch: 0 };
    const b: Version = { major: 1, minor: 2, patch: 0 };

    expect(diffVersions(a, b)).toMatchObject({ major: 0, minor: 3, patch: 0 });
  });

  it('computes negative differences when the second version is newer', () => {
    expect(diffVersions('1.0.0', '1.2.0')).toMatchObject({ major: 0, minor: -2, patch: 0 });
  });

  it.each([
    ['a major difference', '2.0.0', '1.9.9', VersionSegment.Major],
    ['a minor difference', '1.2.0', '1.1.9', VersionSegment.Minor],
    ['a patch difference', '1.1.2', '1.1.1', VersionSegment.Patch],
  ] as const)('scopes %s to the highest changed segment', (_label, v1, v2, scope) => {
    expect(diffVersions(v1, v2).scope).toBe(scope);
  });

  it('reports a null scope for identical versions', () => {
    expect(diffVersions('1.2.3', '1.2.3').scope).toBeNull();
  });

  it('only positive differences count towards scope (a downgrade has a null scope)', () => {
    expect(diffVersions('1.0.0', '2.0.0').scope).toBeNull();
  });
});

describe('isVersionDiffScopeWithin', () => {
  it('returns false when there is no scope', () => {
    expect(isVersionDiffScopeWithin(null, VersionSegment.Patch)).toBe(false);
  });

  it('treats any scope as within a patch boundary', () => {
    expect(isVersionDiffScopeWithin(VersionSegment.Major, VersionSegment.Patch)).toBe(true);
    expect(isVersionDiffScopeWithin(VersionSegment.Minor, VersionSegment.Patch)).toBe(true);
    expect(isVersionDiffScopeWithin(VersionSegment.Patch, VersionSegment.Patch)).toBe(true);
  });

  it('treats major and minor scopes as within a minor boundary', () => {
    expect(isVersionDiffScopeWithin(VersionSegment.Major, VersionSegment.Minor)).toBe(true);
    expect(isVersionDiffScopeWithin(VersionSegment.Minor, VersionSegment.Minor)).toBe(true);
    expect(isVersionDiffScopeWithin(VersionSegment.Patch, VersionSegment.Minor)).toBe(false);
  });

  it('only a major scope is within a major boundary', () => {
    expect(isVersionDiffScopeWithin(VersionSegment.Major, VersionSegment.Major)).toBe(true);
    expect(isVersionDiffScopeWithin(VersionSegment.Minor, VersionSegment.Major)).toBe(false);
    expect(isVersionDiffScopeWithin(VersionSegment.Patch, VersionSegment.Major)).toBe(false);
  });
});

describe('compareVersions', () => {
  it.each([
    ['an older major', '1.9.9', '2.0.0'],
    ['an older minor', '1.1.9', '1.2.0'],
    ['an older patch', '1.2.8', '1.2.9'],
  ])('returns a negative number for %s version', (_label, version1, version2) => {
    expect(compareVersions(version1, version2)).toBeLessThan(0);
  });

  it.each([
    ['a newer major', '2.0.0', '1.9.9'],
    ['a newer minor', '1.2.0', '1.1.9'],
    ['a newer patch', '1.2.9', '1.2.8'],
  ])('returns a positive number for %s version', (_label, version1, version2) => {
    expect(compareVersions(version1, version2)).toBeGreaterThan(0);
  });

  it('returns zero for equal versions', () => {
    expect(compareVersions('1.2.3', '1.2.3')).toBe(0);
  });

  it('accepts parsed Version objects', () => {
    const version: Version = { major: 1, minor: 2, patch: 3 };

    expect(compareVersions(version, '1.2.4')).toBeLessThan(0);
  });

  // A naive `major - minor` style comparator would rank 1.10.0 below 1.9.0; the segments must be considered in
  // order of significance
  it('sorts versions oldest first, without lexicographic segment ordering', () => {
    expect(['1.10.0', '2.0.0', '1.9.0', '1.9.10'].toSorted(compareVersions)).toEqual([
      '1.9.0',
      '1.9.10',
      '1.10.0',
      '2.0.0',
    ]);
  });
});
