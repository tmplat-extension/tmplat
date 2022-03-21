import { isString } from 'lodash-es';

import { VersionSegment } from 'extension/common/version/version-segment.enum';
import { Version, VersionDiff } from 'extension/common/version/version.model';

const VERSION_SEGMENT_VALUE_REGEX = /^(\d+)/;

export function diffVersions(version1: string | Version, version2: string | Version): VersionDiff {
  if (isString(version1)) {
    version1 = parseVersion(version1);
  }
  if (isString(version2)) {
    version2 = parseVersion(version2);
  }

  const major = version1.major - version2.major;
  const minor = version1.minor - version2.minor;
  const patch = version1.patch - version2.patch;

  return {
    scope: calculateDiffScope(major, minor, patch),
    major,
    minor,
    patch,
  };
}

export function isVersionDiffScopeWithin(scope: VersionSegment | null, other: VersionSegment): boolean {
  if (!scope) {
    return false;
  }

  switch (other) {
    case VersionSegment.Major:
      return scope === VersionSegment.Major;
    case VersionSegment.Minor:
      return scope === VersionSegment.Major || scope === VersionSegment.Minor;
    case VersionSegment.Patch:
      return true;
  }
}

export function parseVersion(version: string): Version {
  const segments = version.split('.');
  const major = parseVersionSegment(segments[0], version);
  const minor = parseVersionSegment(segments[1], version);
  const patch = parseVersionSegment(segments[2], version);

  return { major, minor, patch };
}

function calculateDiffScope(major: number, minor: number, patch: number): VersionSegment | null {
  if (major > 0) {
    return VersionSegment.Major;
  }
  if (minor > 0) {
    return VersionSegment.Minor;
  }
  if (patch > 0) {
    return VersionSegment.Patch;
  }

  return null;
}

function parseVersionSegment(segment: string | undefined, version: string): number {
  if (!segment) {
    return 0;
  }

  const match = segment.match(VERSION_SEGMENT_VALUE_REGEX);
  if (!match) {
    throw new Error(`Unable to parse version '${version}' due to invalid segment: '${segment}'`);
  }

  return parseInt(match[0], 10);
}
