import { type AnalyticsEvent } from 'extension/analytics/analytics.model';
import {
  type AnalyticsDataRepository,
  AnalyticsDataRepositoryToken,
} from 'extension/analytics/data/analytics-data.repository';
import { inject, injectable } from 'extension/common/di';
import { ExtensionError } from 'extension/common/error/extension-error';
import { type Logger } from 'extension/common/logging/logger';
import { type LoggingService, LoggingServiceToken } from 'extension/common/logging/logging.service';

const AnalyticsServiceName = 'AnalyticsService';

export const AnalyticsServiceToken = Symbol(AnalyticsServiceName);

@injectable()
export class AnalyticsService {
  private static readonly ACCOUNT_ID = 'UA-28812528-1';

  private readonly logger: Logger;

  constructor(
    @inject(AnalyticsDataRepositoryToken) private readonly repository: AnalyticsDataRepository,
    @inject(LoggingServiceToken) logging: LoggingService,
  ) {
    this.logger = logging.getLogger(AnalyticsServiceName);
  }

  trackEvent(event: AnalyticsEvent): Promise<void> {
    return this.track({
      t: 'event',
      ec: event.category,
      ea: event.action,
      el: event.label,
      ev: event.value?.toString(),
    });
  }

  async trackPageView(): Promise<void> {
    const pageUrl = new URL(document.documentURI);

    return this.track({
      t: 'pageview',
      dh: pageUrl.origin,
      dp: pageUrl.pathname,
      dt: document.title,
    });
  }

  async isAnalyticsEnabled(): Promise<boolean> {
    return (await this.repository.get()).enabled;
  }

  async setAnalyticsEnabled(enabled: boolean): Promise<void> {
    await this.repository.mutate((data) => {
      data.enabled = enabled;
      return data;
    });
  }

  private async track(params: Record<string, string | null | undefined>): Promise<void> {
    const { clientId, enabled } = await this.repository.get();
    if (!enabled) {
      return;
    }

    const url = new URL('https://www.google-analytics.com/collect');
    url.searchParams.set('v', '1');
    url.searchParams.set('tid', AnalyticsService.ACCOUNT_ID);
    url.searchParams.set('cid', clientId);

    Object.entries(params).forEach(([name, value]) => {
      if (value) {
        url.searchParams.set(name, value);
      }
    });

    const response = await fetch(url.toString(), {
      method: 'POST',
    });

    if (!response.ok) {
      this.logger.error(`Failed to send analytics data:`, response.status);

      throw ExtensionError.from('ANA500000');
    }
  }
}
