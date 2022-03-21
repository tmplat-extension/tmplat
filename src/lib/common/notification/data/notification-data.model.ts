import { VersionSegment } from 'extension/common/version/version-segment.enum';

export type NotificationData = {
  changeLog: NotificationDataChangeLog;
  enabled: boolean;
};

export type NotificationDataChangeLog = {
  enabled: boolean;
  scope: VersionSegment;
};
