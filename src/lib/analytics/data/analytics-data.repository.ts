import { AnalyticsData } from 'extension/analytics/data/analytics-data.model';
import { analyticsDataSchema } from 'extension/analytics/data/analytics-data.schema';
import { DataInstallContext } from 'extension/common/data/data-install-context.model';
import { DataInstaller } from 'extension/common/data/data-installer';
import { DataNamespace } from 'extension/common/data/data-namespace.enum';
import { RequiredDataRepository } from 'extension/common/data/data.repository';
import { DataService, DataServiceToken } from 'extension/common/data/data.service';
import { inject, injectable } from 'extension/common/di';

export const AnalyticsDataRepositoryToken = Symbol('AnalyticsDataRepository');

@injectable()
export class AnalyticsDataRepository extends RequiredDataRepository<AnalyticsData> implements DataInstaller {
  constructor(@inject(DataServiceToken) dataService: DataService) {
    super(DataNamespace.Analytics, analyticsDataSchema, dataService.sync);
  }

  install(_context: DataInstallContext): Promise<boolean> {
    return this.init(() => ({
      clientId: crypto.randomUUID(),
      // TODO: Implement nice way of requesting users to enable this
      enabled: false,
    }));
  }
}
