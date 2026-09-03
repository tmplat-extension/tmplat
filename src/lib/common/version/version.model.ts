import { VersionSegment } from 'extension/common/version/version-segment.enum';

export type Version = Readonly<Record<VersionSegment, number>>;

export type VersionDiff = {
  readonly [key in VersionSegment]: number;
} & {
  readonly scope: VersionSegment | null;
};
