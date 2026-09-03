import { describe, expect, it } from 'vitest';
import { MigrateUi } from 'extension/ui/migrate/migrate-ui';
import { container } from 'extension/ui/migrate/migrate-ui.config';
import { UiToken } from 'extension/ui/ui';

/*
 * See `src/lib/worker/background/background-worker.config.test.ts` for why this resolves the entry token rather than
 * enumerating bindings, and why these imports are static.
 *
 * This is a regression guard. This container previously omitted `TemplateIdGeneratorToken`, which
 * `TemplateDataMigrator` injects, so `container.get(UiToken)` threw at module scope in
 * `src/lib/ui/migrate/index.ts` - `MigrateUi` was never constructed and the migration never ran at all. Since 1.x
 * users reach 2.0.0 exclusively through this page, that broke the entire upgrade path.
 */
describe('migrate UI container', () => {
  it('resolves the migrate UI entry point with its full dependency graph', () => {
    expect(container.get(UiToken)).toBeInstanceOf(MigrateUi);
  });
});
