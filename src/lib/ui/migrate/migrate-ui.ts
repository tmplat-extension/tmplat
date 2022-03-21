import { AnalyticsService, AnalyticsServiceToken } from 'extension/analytics/analytics.service';
import {
  DataMigrationManager,
  DataMigrationManagerToken,
} from 'extension/common/data/migration/data-migration-manager';
import {
  DataMigrationService,
  DataMigrationServiceToken,
} from 'extension/common/data/migration/data-migration.service';
import { inject, injectable } from 'extension/common/di';
import { IntlService, IntlServiceToken } from 'extension/common/intl/intl.service';
import { Ui } from 'extension/ui/ui';

@injectable()
export class MigrateUi implements Ui {
  constructor(
    @inject(AnalyticsServiceToken) private readonly analyticsService: AnalyticsService,
    @inject(DataMigrationManagerToken) private readonly dataMigrationManager: DataMigrationManager,
    @inject(DataMigrationServiceToken) private readonly dataMigrationService: DataMigrationService,
    @inject(IntlServiceToken) private readonly intl: IntlService,
  ) {}

  async init(): Promise<void> {
    const { results, version } = await this.dataMigrationManager.migrate();
    const phase = this.dataMigrationService.getMigrationPhase(version);

    // TODO: Render UI

    await this.analyticsService.trackEvent({
      category: 'Frames',
      action: 'Displayed',
      label: 'Migrate',
    });
  }
}
