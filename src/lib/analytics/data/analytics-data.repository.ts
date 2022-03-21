import { AnalyticsData } from 'extension/analytics/data/analytics-data.model';
import { analyticsDataSchema } from 'extension/analytics/data/analytics-data.schema';
import { DataInstaller } from 'extension/common/data/data-installer';
import { DataNamespace } from 'extension/common/data/data-namespace.enum';
import { DataRepository } from 'extension/common/data/data.repository';
import { DataService, DataServiceToken } from 'extension/common/data/data.service';
import { inject, injectable } from 'extension/common/di';

export const AnalyticsDataRepositoryToken = Symbol('AnalyticsDataRepository');

@injectable()
export class AnalyticsDataRepository extends DataRepository<AnalyticsData> implements DataInstaller {
  constructor(@inject(DataServiceToken) dataService: DataService) {
    super(DataNamespace.Analytics, analyticsDataSchema, dataService.sync);
  }

  install(): Promise<void> {
    return this.set({
      clientId: crypto.randomUUID(),
      // TODO: Implement nice way of requesting users to enable this
      enabled: false,
    } as any);
  }

  isInstalled(): Promise<boolean> {
    return this.isNotEmpty();
  }
}
