import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { type DataRepository } from 'extension/common/data/data.repository';
import { DataMigrationStepBuilder } from 'extension/common/data/migration/data-migration-step-builder';
import { DataMigrationStepOutcome } from 'extension/common/data/migration/data-migration-step-outcome.enum';
import { type DataMigrationStepResultDetail } from 'extension/common/data/migration/data-migration.model';
import { ExtensionError } from 'extension/common/error/extension-error';
import { type ExtensionVersion } from 'extension/common/extension-version';
import { type IntlMessageKey } from 'extension/common/intl/intl-message-key';
import { type Logger } from 'extension/common/logging/logger';
import { createLoggerMock, type LoggerMock } from 'extension/test/logger.mock';
import { createMigrationContext, type CreateMigrationContextDataOptions } from 'extension/test/migration.fake';

const OLD_VERSION = '1.0.0' as ExtensionVersion;
const NEW_VERSION = '2.0.0' as ExtensionVersion;
const DESCRIPTION_KEY = 'migration_step_description' as IntlMessageKey;

type TestData = { templates: unknown[] };

const createContext = (
  legacyData: CreateMigrationContextDataOptions<'local' | 'session'>,
  oldVersion: ExtensionVersion = OLD_VERSION,
) => createMigrationContext({ legacyData, newVersion: NEW_VERSION, oldVersion });

// Mirrors the real `DataRepository.mutate` contract: resolves false when the mutator cancels, true otherwise
const createRepositoryStub = (data: TestData) => {
  const saved: TestData[] = [];
  const mutate = vi.fn(async (mutator: (current: TestData, cancel: () => void) => TestData | Promise<TestData>) => {
    let cancelled = false;
    const mutated = await mutator(data, () => {
      cancelled = true;
    });

    if (cancelled) {
      return false;
    }

    saved.push(mutated);

    return true;
  });

  return { data, repository: { mutate } as unknown as DataRepository<TestData>, saved };
};

describe('DataMigrationStepBuilder', () => {
  let builder: DataMigrationStepBuilder;
  let logger: LoggerMock;

  beforeEach(() => {
    logger = createLoggerMock();
    builder = new DataMigrationStepBuilder(logger as unknown as Logger);
  });

  describe('createSimpleStepForRemoval', () => {
    it('exposes the supplied description key', () => {
      const step = builder.createSimpleStepForRemoval(OLD_VERSION, DESCRIPTION_KEY, {
        keys: ['a'],
        storage: 'local',
      });

      expect(step.descriptionKey).toBe(DESCRIPTION_KEY);
    });

    it('is required when the version matches and at least one legacy key is present', async () => {
      const step = builder.createSimpleStepForRemoval(OLD_VERSION, DESCRIPTION_KEY, {
        keys: ['a', 'b'],
        storage: 'local',
      });
      const { context } = createContext({ local: { b: 1 } });

      await expect(step.isRequired(context)).resolves.toBe(true);
    });

    it('is not required when none of the legacy keys are present', async () => {
      const step = builder.createSimpleStepForRemoval(OLD_VERSION, DESCRIPTION_KEY, {
        keys: ['a', 'b'],
        storage: 'local',
      });
      const { context } = createContext({ local: { c: 1 } });

      await expect(step.isRequired(context)).resolves.toBe(false);
    });

    it('is not required when the old version does not match', async () => {
      const step = builder.createSimpleStepForRemoval(OLD_VERSION, DESCRIPTION_KEY, {
        keys: ['a'],
        storage: 'local',
      });
      const { context } = createContext({ local: { a: 1 } }, NEW_VERSION);

      await expect(step.isRequired(context)).resolves.toBe(false);
    });

    it('removes every legacy key, leaving others untouched', async () => {
      const step = builder.createSimpleStepForRemoval(OLD_VERSION, DESCRIPTION_KEY, {
        keys: ['a', 'b'],
        storage: 'local',
      });
      const {
        context,
        legacyData: { local },
      } = createContext({ local: { a: 1, b: 2, c: 3 } });

      await step.migrate(context);

      await expect(local.keys()).resolves.toEqual(['c']);
    });

    it('reads and removes from session storage when asked to', async () => {
      const step = builder.createSimpleStepForRemoval(OLD_VERSION, DESCRIPTION_KEY, {
        keys: ['a'],
        storage: 'session',
      });
      const {
        context,
        legacyData: { local, session },
      } = createContext({ local: { a: 1 }, session: { a: 2 } });

      await expect(step.isRequired(context)).resolves.toBe(true);

      await step.migrate(context);

      // The same key in the other storage must be left alone
      await expect(session.keys()).resolves.toEqual([]);
      await expect(local.keys()).resolves.toEqual(['a']);
    });
  });

  describe('createSimpleStepForTransfer', () => {
    it('is required when the version matches and the legacy key is present', async () => {
      const { repository } = createRepositoryStub({ templates: [] });
      const step = builder.createSimpleStepForTransfer(
        OLD_VERSION,
        DESCRIPTION_KEY,
        { key: 'templates', storage: 'local' },
        repository,
        () => undefined,
      );
      const { context } = createContext({ local: { templates: [] } });

      await expect(step.isRequired(context)).resolves.toBe(true);
    });

    it('is not required when the legacy key is absent', async () => {
      const { repository } = createRepositoryStub({ templates: [] });
      const step = builder.createSimpleStepForTransfer(
        OLD_VERSION,
        DESCRIPTION_KEY,
        { key: 'templates', storage: 'local' },
        repository,
        () => undefined,
      );
      const { context } = createContext({});

      await expect(step.isRequired(context)).resolves.toBe(false);
    });

    it('is not required when the old version does not match', async () => {
      const { repository } = createRepositoryStub({ templates: [] });
      const step = builder.createSimpleStepForTransfer(
        OLD_VERSION,
        DESCRIPTION_KEY,
        { key: 'templates', storage: 'local' },
        repository,
        () => undefined,
      );
      const { context } = createContext({ local: { templates: [] } }, NEW_VERSION);

      await expect(step.isRequired(context)).resolves.toBe(false);
    });

    it('passes the legacy value to the mutator and removes the legacy key afterwards', async () => {
      const { data, repository } = createRepositoryStub({ templates: [] });
      const mutator = vi.fn((target: TestData, legacyData: unknown) => {
        target.templates = legacyData as unknown[];
      });
      const step = builder.createSimpleStepForTransfer(
        OLD_VERSION,
        DESCRIPTION_KEY,
        { key: 'templates', storage: 'local' },
        repository,
        mutator,
      );
      const {
        context,
        legacyData: { local },
      } = createContext({ local: { other: 'keep', templates: [{ id: 'a' }] } });

      await step.migrate(context);

      expect(mutator).toHaveBeenCalledOnce();
      expect(data.templates).toEqual([{ id: 'a' }]);
      await expect(local.keys()).resolves.toEqual(['other']);
    });

    it('reads and removes from session storage when asked to', async () => {
      const { data, repository } = createRepositoryStub({ templates: [] });
      const step = builder.createSimpleStepForTransfer(
        OLD_VERSION,
        DESCRIPTION_KEY,
        { key: 'templates', storage: 'session' },
        repository,
        (target, legacyData) => {
          target.templates = legacyData as unknown[];
        },
      );
      const {
        context,
        legacyData: { local, session },
      } = createContext({ local: { templates: ['local'] }, session: { templates: ['session'] } });

      await step.migrate(context);

      expect(data.templates).toEqual(['session']);
      await expect(session.keys()).resolves.toEqual([]);
      await expect(local.keys()).resolves.toEqual(['templates']);
    });

    it('does not remove the legacy key when the mutation fails', async () => {
      const { repository } = createRepositoryStub({ templates: [] });
      const step = builder.createSimpleStepForTransfer(
        OLD_VERSION,
        DESCRIPTION_KEY,
        { key: 'templates', storage: 'local' },
        repository,
        () => {
          throw new Error('boom');
        },
      );
      const {
        context,
        legacyData: { local },
      } = createContext({ local: { templates: [{ id: 'a' }] } });

      await expect(step.migrate(context)).rejects.toThrow('boom');
      await expect(local.has('templates')).resolves.toBe(true);
    });

    describe('with a schema', () => {
      const schema = z.object({ enabled: z.boolean(), label: z.string().optional() });

      it('passes the parsed value to the mutator, so unknown legacy keys are stripped', async () => {
        const { repository } = createRepositoryStub({ templates: [] });
        const mutator = vi.fn<(data: TestData, legacyData: z.output<typeof schema>) => void>();
        const step = builder.createSimpleStepForTransfer(
          OLD_VERSION,
          DESCRIPTION_KEY,
          { key: 'settings', schema, storage: 'local' },
          repository,
          mutator,
        );
        const {
          context,
          legacyData: { local },
        } = createContext({ local: { settings: { enabled: true, obsolete: 'drop me' } } });

        await step.migrate(context);

        expect(mutator).toHaveBeenCalledWith(expect.anything(), { enabled: true }, context);
        await expect(local.has('settings')).resolves.toBe(false);
      });

      it('rejects with MIG422000 and leaves the legacy key in place when the legacy data is invalid', async () => {
        const { data, repository } = createRepositoryStub({ templates: [] });
        const mutator = vi.fn<(data: TestData, legacyData: z.output<typeof schema>) => void>();
        const step = builder.createSimpleStepForTransfer(
          OLD_VERSION,
          DESCRIPTION_KEY,
          { key: 'settings', schema, storage: 'local' },
          repository,
          mutator,
        );
        const {
          context,
          legacyData: { local },
        } = createContext({ local: { settings: { enabled: 'yes' } } });

        await expect(step.migrate(context)).rejects.toMatchObject({ code: 'MIG422000' });

        // Validating up front means a failed step is retryable: nothing was written and nothing was destroyed
        expect(mutator).not.toHaveBeenCalled();
        expect(data.templates).toEqual([]);
        await expect(local.has('settings')).resolves.toBe(true);
      });

      it('passes the raw legacy value to the mutator when no schema is supplied', async () => {
        const { repository } = createRepositoryStub({ templates: [] });
        const mutator = vi.fn<(data: TestData, legacyData: unknown) => void>();
        const step = builder.createSimpleStepForTransfer(
          OLD_VERSION,
          DESCRIPTION_KEY,
          { key: 'settings', storage: 'local' },
          repository,
          mutator,
        );
        const { context } = createContext({ local: { settings: { enabled: true, obsolete: 'keep me' } } });

        await step.migrate(context);

        expect(mutator).toHaveBeenCalledWith(expect.anything(), { enabled: true, obsolete: 'keep me' }, context);
      });

      it('logs a validation failure through the owning migrator logger, not ValidationService', async () => {
        const { repository } = createRepositoryStub({ templates: [] });
        const step = builder.createSimpleStepForTransfer(
          OLD_VERSION,
          DESCRIPTION_KEY,
          { key: 'settings', schema, storage: 'local' },
          repository,
          () => undefined,
        );
        const { context } = createContext({ local: { settings: null } });

        await expect(step.migrate(context)).rejects.toThrow();

        // The fixture's ValidationService has its own separate logger, so this only passes if `parentLogger` is used
        expect(logger.error).toHaveBeenCalledWith(
          expect.stringContaining('failed validation schema'),
          expect.objectContaining({ code: 'MIG422000' }),
          expect.anything(),
        );
      });
    });

    describe('when the mutator reports a non-passing outcome', () => {
      const createCancellingStep = (detail: DataMigrationStepResultDetail) => {
        const stub = createRepositoryStub({ templates: [] });
        const mutator = vi.fn((target: TestData, legacyData: unknown) => {
          target.templates = legacyData as unknown[];

          return detail;
        });
        const step = builder.createSimpleStepForTransfer(
          OLD_VERSION,
          DESCRIPTION_KEY,
          { key: 'templates', storage: 'local' },
          stub.repository,
          mutator,
        );

        return { ...stub, mutator, step };
      };

      it('cancels the mutation and retains the legacy key when the mutator fails', async () => {
        const detail: DataMigrationStepResultDetail = {
          errors: [ExtensionError.from('MIG500000')],
          outcome: DataMigrationStepOutcome.Failed,
        };
        const { saved, step } = createCancellingStep(detail);
        const {
          context,
          legacyData: { local },
        } = createContext({ local: { templates: [{ id: 'a' }] } });

        await expect(step.migrate(context)).resolves.toBe(detail);

        // Retaining the legacy key is what makes a failed transfer retryable
        expect(saved).toEqual([]);
        await expect(local.has('templates')).resolves.toBe(true);
      });

      it('cancels the mutation and retains the legacy key when the mutator skips', async () => {
        const detail: DataMigrationStepResultDetail = {
          outcome: DataMigrationStepOutcome.Skipped,
          reasons: ['nothing to do'],
        };
        const { saved, step } = createCancellingStep(detail);
        const {
          context,
          legacyData: { local },
        } = createContext({ local: { templates: [{ id: 'a' }] } });

        await expect(step.migrate(context)).resolves.toBe(detail);

        expect(saved).toEqual([]);
        await expect(local.has('templates')).resolves.toBe(true);
      });

      it('saves and removes the legacy key when the mutator explicitly passes', async () => {
        const detail: DataMigrationStepResultDetail = { outcome: DataMigrationStepOutcome.Passed };
        const { saved, step } = createCancellingStep(detail);
        const {
          context,
          legacyData: { local },
        } = createContext({ local: { templates: [{ id: 'a' }] } });

        await expect(step.migrate(context)).resolves.toBe(detail);

        expect(saved).toHaveLength(1);
        await expect(local.has('templates')).resolves.toBe(false);
      });

      it('warns when a transfer is cancelled', async () => {
        const { step } = createCancellingStep({
          errors: [ExtensionError.from('MIG500000')],
          outcome: DataMigrationStepOutcome.Failed,
        });
        const { context } = createContext({ local: { templates: [{ id: 'a' }] } });

        await step.migrate(context);

        expect(logger.warn).toHaveBeenCalledWith(
          expect.stringContaining('Cancelled transfer'),
          expect.objectContaining({ key: 'templates', storage: 'local' }),
        );
      });
    });
  });
});
