export type AnalyticsEvent = {
  readonly action: string;
  readonly category: string;
  readonly label?: string;
  readonly value?: number;
};
