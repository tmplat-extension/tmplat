import { type AnalyticsData, AnalyticsDataSchema } from 'extension/analytics/data/analytics-data.schema';
import { type DataInstallContext } from 'extension/common/data/data-install-context.model';
import { type DataInstaller } from 'extension/common/data/data-installer';
import { DataNamespace } from 'extension/common/data/data-namespace.enum';
import { RequiredDataRepository } from 'extension/common/data/data.repository';
import { type DataService, DataServiceToken } from 'extension/common/data/data.service';
import { inject, injectable } from 'extension/common/di';
import { type LoggingService, LoggingServiceToken } from 'extension/common/logging/logging.service';
import { type ValidationService, ValidationServiceToken } from 'extension/common/validation/validation.service';

const AnalyticsDataRepositoryName = 'AnalyticsDataRepository';

export const AnalyticsDataRepositoryToken = Symbol(AnalyticsDataRepositoryName);

@injectable()
export class AnalyticsDataRepository
  extends RequiredDataRepository<typeof AnalyticsDataSchema, AnalyticsData>
  implements DataInstaller
{
  constructor(
    @inject(DataServiceToken) dataService: DataService,
    @inject(LoggingServiceToken) logging: LoggingService,
    @inject(ValidationServiceToken) validationService: ValidationService,
  ) {
    super({
      dataStorage: dataService.sync,
      schema: AnalyticsDataSchema,
      namespace: DataNamespace.Analytics,
      logger: logging.getLogger(AnalyticsDataRepositoryName),
      validationService: validationService,
    });
  }

  install(_context: DataInstallContext): Promise<boolean> {
    return this.init(() => ({
      clientId: crypto.randomUUID(),
      // TODO: Implement nice way of requesting users to enable this
      enabled: false,
    }));
  }
}
