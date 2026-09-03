import { AnalyticsService, AnalyticsServiceToken } from 'extension/analytics/analytics.service';
import { AppearanceService, AppearanceServiceToken } from 'extension/common/appearance/appearance.service';
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
    @inject(AppearanceServiceToken) private readonly appearanceService: AppearanceService,
    @inject(DataMigrationManagerToken) private readonly dataMigrationManager: DataMigrationManager,
    @inject(DataMigrationServiceToken) private readonly dataMigrationService: DataMigrationService,
    @inject(IntlServiceToken) private readonly intl: IntlService,
  ) {}

  async init(): Promise<void> {
    // Applied immediately (and kept in sync) even though the rest of the page isn't rendered yet, so that native
    // browser UI (e.g. form controls, scrollbars) already respects the user's chosen appearance
    this.appearanceService.applyToDocument();

    /*
     * TODO: Instead of starting migration on load:
     *  1. Check for "version" query string parameter
     *  2. If present, render version migration based on phase (allow user to export legacy data store before beginning migration)
     *  3. If not present, render list migrations in incomplete phase with drilldown available
     */
    // TODO: Run migrations on background worker using message passing and get progress updates the same way
    const { results: _results, version } = await this.dataMigrationManager.migrate();
    const _phase = this.dataMigrationService.getMigrationPhase(version);

    // TODO: Render UI

    await this.analyticsService.trackEvent({
      category: 'Frames',
      action: 'Displayed',
      label: 'Migrate',
    });
  }
}
