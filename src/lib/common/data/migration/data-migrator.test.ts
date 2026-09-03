import { describe, expect, it, vi } from 'vitest';
import { DataNamespace } from 'extension/common/data/data-namespace.enum';
import { type DataMigrationStepBuilder } from 'extension/common/data/migration/data-migration-step-builder';
import { DataMigrationStepOutcome } from 'extension/common/data/migration/data-migration-step-outcome.enum';
import { type DataMigrationStep } from 'extension/common/data/migration/data-migration.model';
import { AbstractDataMigrator } from 'extension/common/data/migration/data-migrator';
import { ExtensionError } from 'extension/common/error/extension-error';
import { type IntlMessageKey } from 'extension/common/intl/intl-message-key';
import { asIntlService, createIntlServiceMock } from 'extension/test/intl.mock';
import { createLoggerMock } from 'extension/test/logger.mock';
import { createMigrationContext } from 'extension/test/migration.fake';

class TestDataMigrator extends AbstractDataMigrator {
  constructor(
    private readonly steps: DataMigrationStep[],
    logger = createLoggerMock(),
  ) {
    super({
      intl: asIntlService(createIntlServiceMock()),
      logger,
      namespace: DataNamespace.Template,
    });
  }

  protected getSteps(_builder: DataMigrationStepBuilder): DataMigrationStep[] {
    return this.steps;
  }
}

const createStep = (
  descriptionKey: string,
  migrate: DataMigrationStep['migrate'],
  isRequired = true,
): DataMigrationStep => ({
  descriptionKey: descriptionKey as IntlMessageKey,
  isRequired: vi.fn(async () => isRequired),
  migrate: vi.fn(migrate),
});

// These cover `DataMigrationStep.migrate` *self-reporting* its outcome, which is what lets a step distinguish
// "there was nothing to do" from "I did it" without inventing a throw
describe('AbstractDataMigrator', () => {
  describe('migrate', () => {
    it('reports a step that self-reports Skipped, carrying its reasons', async () => {
      const step = createStep('step', async () => ({
        outcome: DataMigrationStepOutcome.Skipped,
        reasons: ['legacy value was malformed'],
      }));
      const migrator = new TestDataMigrator([step]);
      const { context } = createMigrationContext();

      await expect(migrator.migrate(context)).resolves.toEqual([
        {
          description: 'step',
          outcome: DataMigrationStepOutcome.Skipped,
          reasons: ['legacy value was malformed'],
        },
      ]);
    });

    it('deduplicates and sorts self-reported skip reasons', async () => {
      const step = createStep('step', async () => ({
        outcome: DataMigrationStepOutcome.Skipped,
        reasons: ['b reason', 'a reason', 'b reason'],
      }));
      const migrator = new TestDataMigrator([step]);
      const { context } = createMigrationContext();

      // A step looping over many legacy entries will naturally emit the same reason repeatedly; the user should
      // see it once
      await expect(migrator.migrate(context)).resolves.toEqual([
        {
          description: 'step',
          outcome: DataMigrationStepOutcome.Skipped,
          reasons: ['a reason', 'b reason'],
        },
      ]);
    });

    it('logs a self-reported skip as a warning with its reasons', async () => {
      const logger = createLoggerMock();
      const step = createStep('step', async () => ({
        outcome: DataMigrationStepOutcome.Skipped,
        reasons: ['nothing to transfer'],
      }));
      const migrator = new TestDataMigrator([step], logger);
      const { context } = createMigrationContext();

      await migrator.migrate(context);

      expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining("Skipped 'step' migration step"), [
        'nothing to transfer',
      ]);
    });

    it('reports a step that self-reports Failed, carrying its errors', async () => {
      const error = ExtensionError.from('MIG500000');
      const step = createStep('step', async () => ({
        errors: [error] as [ExtensionError],
        outcome: DataMigrationStepOutcome.Failed,
      }));
      const logger = createLoggerMock();
      const migrator = new TestDataMigrator([step], logger);
      const { context } = createMigrationContext();

      await expect(migrator.migrate(context)).resolves.toEqual([
        { description: 'step', errors: [error], outcome: DataMigrationStepOutcome.Failed },
      ]);
      expect(logger.error).toHaveBeenCalledWith(expect.stringContaining("Failed 'step' migration step"), error);
    });

    it('reports Passed when a step resolves without a detail', async () => {
      const step = createStep('step', async () => undefined);
      const migrator = new TestDataMigrator([step]);
      const { context } = createMigrationContext();

      await expect(migrator.migrate(context)).resolves.toEqual([
        { description: 'step', outcome: DataMigrationStepOutcome.Passed },
      ]);
    });

    it('converts a throwing step into a Failed result rather than rejecting', async () => {
      const cause = new Error('boom');
      const step = createStep('step', async () => {
        throw cause;
      });
      const migrator = new TestDataMigrator([step]);
      const { context } = createMigrationContext();

      const [result] = await migrator.migrate(context);

      // One broken step must not abandon the namespace's remaining steps
      expect(result).toMatchObject({ description: 'step', outcome: DataMigrationStepOutcome.Failed });
      expect(result?.errors?.[0]).toMatchObject({ cause, code: 'MIG500000' });
    });

    // Regression guard for a fixed data-loss bug: steps used to run concurrently via `allFulfilled`, but steps
    // within a namespace mutate the same repository read-modify-write, so the last writer won and every earlier
    // step's changes were silently lost. They must now run strictly one at a time.
    it('runs each step to completion before starting the next', async () => {
      const order: string[] = [];
      const createTrackedStep = (name: string) =>
        createStep(name, async () => {
          order.push(`${name}:start`);
          await Promise.resolve();
          await Promise.resolve();
          order.push(`${name}:end`);
        });
      const migrator = new TestDataMigrator([createTrackedStep('a'), createTrackedStep('b'), createTrackedStep('c')]);
      const { context } = createMigrationContext();

      await migrator.migrate(context);

      expect(order).toEqual(['a:start', 'a:end', 'b:start', 'b:end', 'c:start', 'c:end']);
    });

    it('does not check a step requirement until the previous step has finished migrating', async () => {
      const order: string[] = [];
      const createTrackedStep = (name: string): DataMigrationStep => ({
        descriptionKey: name as IntlMessageKey,
        isRequired: vi.fn(async () => {
          order.push(`${name}:check`);
          return true;
        }),
        migrate: vi.fn(async () => {
          order.push(`${name}:migrate`);
        }),
      });
      const migrator = new TestDataMigrator([createTrackedStep('a'), createTrackedStep('b')]);
      const { context } = createMigrationContext();

      await migrator.migrate(context);

      // Requirement checks read the same data the previous step just wrote, so they must not all run up front
      expect(order).toEqual(['a:check', 'a:migrate', 'b:check', 'b:migrate']);
    });
  });

  describe('isMigrationRequired', () => {
    it('stops checking as soon as one step reports it is required', async () => {
      const first = createStep('a', async () => undefined);
      const second = createStep('b', async () => undefined);
      const migrator = new TestDataMigrator([first, second]);
      const { context } = createMigrationContext();

      await expect(migrator.isMigrationRequired(context)).resolves.toBe(true);

      expect(second.isRequired).not.toHaveBeenCalled();
    });

    it('is not required when no step is required', async () => {
      const migrator = new TestDataMigrator([
        createStep('a', async () => undefined, false),
        createStep('b', async () => undefined, false),
      ]);
      const { context } = createMigrationContext();

      await expect(migrator.isMigrationRequired(context)).resolves.toBe(false);
    });
  });

  describe('getRequiredMigrationSteps', () => {
    it('describes only the required steps, in declaration order', async () => {
      const migrator = new TestDataMigrator([
        createStep('a', async () => undefined),
        createStep('b', async () => undefined, false),
        createStep('c', async () => undefined),
      ]);
      const { context } = createMigrationContext();

      await expect(migrator.getRequiredMigrationSteps(context)).resolves.toEqual(['a', 'c']);
    });
  });
});
