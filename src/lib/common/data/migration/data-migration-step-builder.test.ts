import { beforeEach, describe, expect, it, vi } from 'vitest';
import { type DataRepository } from 'extension/common/data/data.repository';
import { type LegacyDataService } from 'extension/common/data/legacy-data.service';
import { DataMigrationStepBuilder } from 'extension/common/data/migration/data-migration-step-builder';
import { type DataMigrationContext } from 'extension/common/data/migration/data-migration.model';
import { type ExtensionVersion } from 'extension/common/extension-version';
import { type IntlMessageKey } from 'extension/common/intl/intl-message-key';
import { FakeDataStorage } from 'extension/test/data-storage.fake';

const OLD_VERSION = '1.0.0' as ExtensionVersion;
const NEW_VERSION = '2.0.0' as ExtensionVersion;
const DESCRIPTION_KEY = 'migration_step_description' as IntlMessageKey;

type TestData = { templates: unknown[] };

const createContext = (local: FakeDataStorage, oldVersion: ExtensionVersion = OLD_VERSION): DataMigrationContext => ({
  legacyDataService: { local, session: new FakeDataStorage() } as unknown as LegacyDataService,
  newVersion: NEW_VERSION,
  oldVersion,
});

const createRepositoryStub = (data: TestData) => {
  const mutate = vi.fn(async (mutator: (current: TestData) => TestData) => {
    mutator(data);
  });

  return { data, repository: { mutate } as unknown as DataRepository<TestData> };
};

describe('DataMigrationStepBuilder', () => {
  let builder: DataMigrationStepBuilder;

  beforeEach(() => {
    builder = new DataMigrationStepBuilder();
  });

  describe('createSimpleStepForRemoval', () => {
    it('exposes the supplied description key', () => {
      const step = builder.createSimpleStepForRemoval(OLD_VERSION, DESCRIPTION_KEY, ['a']);

      expect(step.descriptionKey).toBe(DESCRIPTION_KEY);
    });

    it('is required when the version matches and at least one legacy key is present', async () => {
      const step = builder.createSimpleStepForRemoval(OLD_VERSION, DESCRIPTION_KEY, ['a', 'b']);

      await expect(step.isRequired(createContext(new FakeDataStorage({ b: 1 })))).resolves.toBe(true);
    });

    it('is not required when none of the legacy keys are present', async () => {
      const step = builder.createSimpleStepForRemoval(OLD_VERSION, DESCRIPTION_KEY, ['a', 'b']);

      await expect(step.isRequired(createContext(new FakeDataStorage({ c: 1 })))).resolves.toBe(false);
    });

    it('is not required when the old version does not match', async () => {
      const step = builder.createSimpleStepForRemoval(OLD_VERSION, DESCRIPTION_KEY, ['a']);

      await expect(step.isRequired(createContext(new FakeDataStorage({ a: 1 }), NEW_VERSION))).resolves.toBe(false);
    });

    it('removes every legacy key, leaving others untouched', async () => {
      const local = new FakeDataStorage({ a: 1, b: 2, c: 3 });
      const step = builder.createSimpleStepForRemoval(OLD_VERSION, DESCRIPTION_KEY, ['a', 'b']);

      await step.migrate(createContext(local));

      await expect(local.keys()).resolves.toEqual(['c']);
    });
  });

  describe('createSimpleStepForTransfer', () => {
    it('is required when the version matches and the legacy key is present', async () => {
      const { repository } = createRepositoryStub({ templates: [] });
      const step = builder.createSimpleStepForTransfer(
        OLD_VERSION,
        DESCRIPTION_KEY,
        'templates',
        repository,
        () => undefined,
      );

      await expect(step.isRequired(createContext(new FakeDataStorage({ templates: [] })))).resolves.toBe(true);
    });

    it('is not required when the legacy key is absent', async () => {
      const { repository } = createRepositoryStub({ templates: [] });
      const step = builder.createSimpleStepForTransfer(
        OLD_VERSION,
        DESCRIPTION_KEY,
        'templates',
        repository,
        () => undefined,
      );

      await expect(step.isRequired(createContext(new FakeDataStorage()))).resolves.toBe(false);
    });

    it('is not required when the old version does not match', async () => {
      const { repository } = createRepositoryStub({ templates: [] });
      const step = builder.createSimpleStepForTransfer(
        OLD_VERSION,
        DESCRIPTION_KEY,
        'templates',
        repository,
        () => undefined,
      );

      await expect(step.isRequired(createContext(new FakeDataStorage({ templates: [] }), NEW_VERSION))).resolves.toBe(
        false,
      );
    });

    it('passes the legacy value to the mutator and removes the legacy key afterwards', async () => {
      const local = new FakeDataStorage({ other: 'keep', templates: [{ id: 'a' }] });
      const { data, repository } = createRepositoryStub({ templates: [] });
      const mutator = vi.fn((target: TestData, legacyData: unknown) => {
        target.templates = legacyData as unknown[];
      });

      const step = builder.createSimpleStepForTransfer(OLD_VERSION, DESCRIPTION_KEY, 'templates', repository, mutator);

      await step.migrate(createContext(local));

      expect(mutator).toHaveBeenCalledOnce();
      expect(data.templates).toEqual([{ id: 'a' }]);
      await expect(local.keys()).resolves.toEqual(['other']);
    });

    it('does not remove the legacy key when the mutation fails', async () => {
      const local = new FakeDataStorage({ templates: [{ id: 'a' }] });
      const { repository } = createRepositoryStub({ templates: [] });

      const step = builder.createSimpleStepForTransfer(OLD_VERSION, DESCRIPTION_KEY, 'templates', repository, () => {
        throw new Error('boom');
      });

      await expect(step.migrate(createContext(local))).rejects.toThrow('boom');
      await expect(local.has('templates')).resolves.toBe(true);
    });
  });
});
