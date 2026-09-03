import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { DataNamespace } from 'extension/common/data/data-namespace.enum';
import { OptionalDataRepository, RequiredDataRepository } from 'extension/common/data/data.repository';
import { ValidationService } from 'extension/common/validation/validation.service';
import { FakeDataStorage } from 'extension/test/data-storage.fake';
import { createLoggingServiceMock } from 'extension/test/logger.mock';

const Schema = z.object({ count: z.number(), name: z.string().nonempty() });

type Data = z.output<typeof Schema>;

const VALID_DATA: Data = { count: 1, name: 'a' };

// The repository classes are abstract only so that each namespace gets its own DI-registered subclass; there is no
// abstract member, so a minimal concrete subclass is all a test needs.
class TestOptionalRepository extends OptionalDataRepository<typeof Schema> {
  constructor(dataStorage?: FakeDataStorage) {
    super({
      dataStorage,
      logger: createLoggingServiceMock().logger as never,
      namespace: DataNamespace.OAuth,
      schema: Schema,
      validationService: new ValidationService(createLoggingServiceMock() as never),
    });
  }
}

class TestRequiredRepository extends RequiredDataRepository<typeof Schema> {
  constructor(dataStorage: FakeDataStorage) {
    super({
      dataStorage,
      logger: createLoggingServiceMock().logger as never,
      namespace: DataNamespace.OAuth,
      schema: Schema,
      validationService: new ValidationService(createLoggingServiceMock() as never),
    });
  }
}

describe('OptionalDataRepository', () => {
  let repository: TestOptionalRepository;
  let storage: FakeDataStorage;

  const givenStored = (data: unknown) => {
    storage = new FakeDataStorage(data === undefined ? {} : { [DataNamespace.OAuth]: data });
    repository = new TestOptionalRepository(storage);
  };

  beforeEach(() => {
    givenStored(undefined);
  });

  it('exposes its namespace', () => {
    expect(repository.namespace).toBe(DataNamespace.OAuth);
  });

  describe('get', () => {
    it('resolves the stored data', async () => {
      givenStored(VALID_DATA);

      await expect(repository.get()).resolves.toEqual(VALID_DATA);
    });

    it('rejects when nothing is stored for the namespace', async () => {
      await expect(repository.get()).rejects.toMatchObject({ code: 'DAT404000' });
    });

    it('reads only its own namespace', async () => {
      storage = new FakeDataStorage({ [DataNamespace.OAuth]: VALID_DATA, other: 'ignored' });
      repository = new TestOptionalRepository(storage);

      await expect(repository.get()).resolves.toEqual(VALID_DATA);
    });
  });

  describe('getOptional', () => {
    it('resolves the stored data', async () => {
      givenStored(VALID_DATA);

      await expect(repository.getOptional()).resolves.toEqual(VALID_DATA);
    });

    it('resolves undefined when nothing is stored', async () => {
      await expect(repository.getOptional()).resolves.toBeUndefined();
    });
  });

  describe('set', () => {
    it('persists valid data under its namespace', async () => {
      await repository.set(VALID_DATA);

      expect(storage.snapshot()).toEqual({ [DataNamespace.OAuth]: VALID_DATA });
    });

    it('rejects invalid data with DAT400000 and persists nothing', async () => {
      await expect(repository.set({ count: 'not-a-number' } as never)).rejects.toMatchObject({ code: 'DAT400000' });
      expect(storage.snapshot()).toEqual({});
    });

    it('rejects data that violates a refinement rather than only a type', async () => {
      await expect(repository.set({ count: 1, name: '' })).rejects.toMatchObject({ code: 'DAT400000' });
    });

    it('persists the schema output, so defaults and coercions are applied', async () => {
      class DefaultingRepository extends OptionalDataRepository<typeof DefaultingSchema> {
        constructor(dataStorage: FakeDataStorage) {
          super({
            dataStorage,
            namespace: DataNamespace.OAuth,
            schema: DefaultingSchema,
            validationService: new ValidationService(createLoggingServiceMock() as never),
          });
        }
      }
      const DefaultingSchema = z.object({ count: z.number().default(7) });

      await new DefaultingRepository(storage).set({} as never);

      expect(storage.snapshot()).toEqual({ [DataNamespace.OAuth]: { count: 7 } });
    });
  });

  describe('init', () => {
    it('stores the initializer result and resolves true when empty', async () => {
      await expect(repository.init(() => VALID_DATA)).resolves.toBe(true);
      expect(storage.snapshot()).toEqual({ [DataNamespace.OAuth]: VALID_DATA });
    });

    it('awaits an asynchronous initializer', async () => {
      await expect(repository.init(async () => VALID_DATA)).resolves.toBe(true);
      expect(storage.snapshot()).toEqual({ [DataNamespace.OAuth]: VALID_DATA });
    });

    it('leaves existing data untouched and resolves false', async () => {
      const existing = { count: 9, name: 'existing' };
      givenStored(existing);

      const initializer = vi.fn(() => VALID_DATA);

      await expect(repository.init(initializer)).resolves.toBe(false);
      expect(initializer).not.toHaveBeenCalled();
      expect(storage.snapshot()).toEqual({ [DataNamespace.OAuth]: existing });
    });

    it('validates the initializer result', async () => {
      await expect(repository.init(() => ({ count: 1, name: '' }))).rejects.toMatchObject({ code: 'DAT400000' });
    });
  });

  describe('mutate', () => {
    it('passes the current data to the mutator and stores the result', async () => {
      givenStored(VALID_DATA);

      await repository.mutate((data) => ({ ...data, count: data.count + 1 }));

      expect(storage.snapshot()).toEqual({ [DataNamespace.OAuth]: { count: 2, name: 'a' } });
    });

    it('awaits an asynchronous mutator', async () => {
      givenStored(VALID_DATA);

      await repository.mutate(async (data) => ({ ...data, name: 'b' }));

      expect(storage.snapshot()).toEqual({ [DataNamespace.OAuth]: { count: 1, name: 'b' } });
    });

    it('validates the mutated data and leaves the stored data unchanged when invalid', async () => {
      givenStored(VALID_DATA);

      await expect(repository.mutate(() => ({ count: 1, name: '' }))).rejects.toMatchObject({ code: 'DAT400000' });
      expect(storage.snapshot()).toEqual({ [DataNamespace.OAuth]: VALID_DATA });
    });

    it('rejects when there is nothing to mutate', async () => {
      const mutator = vi.fn();

      await expect(repository.mutate(mutator)).rejects.toMatchObject({ code: 'DAT404000' });
      expect(mutator).not.toHaveBeenCalled();
    });

    it('hands the mutator a copy, so mutating it in place does not silently persist', async () => {
      givenStored(VALID_DATA);

      await expect(
        repository.mutate((data) => {
          (data as { name: string }).name = '';
          return VALID_DATA;
        }),
      ).resolves.toBeUndefined();
      expect(storage.snapshot()).toEqual({ [DataNamespace.OAuth]: VALID_DATA });
    });
  });

  describe('isEmpty / isNotEmpty', () => {
    it.each([
      ['nothing is stored', undefined, true],
      ['data is stored', VALID_DATA, false],
    ])('reports %s as empty=%s', async (_label, stored, expected) => {
      givenStored(stored);

      await expect(repository.isEmpty()).resolves.toBe(expected);
      await expect(repository.isNotEmpty()).resolves.toBe(!expected);
    });
  });

  describe('clear', () => {
    it('removes only its own namespace', async () => {
      storage = new FakeDataStorage({ [DataNamespace.OAuth]: VALID_DATA, other: 'keep' });
      repository = new TestOptionalRepository(storage);

      await repository.clear();

      expect(storage.snapshot()).toEqual({ other: 'keep' });
    });

    it('is a no-op when already empty', async () => {
      await repository.clear();

      expect(storage.snapshot()).toEqual({});
    });
  });

  describe('addChangeListener', () => {
    it('notifies the listener for changes to its own namespace', async () => {
      const listener = vi.fn();
      repository.addChangeListener(listener);

      storage.notifyChanges({ [DataNamespace.OAuth]: { newValue: VALID_DATA, oldValue: undefined } });

      expect(listener).toHaveBeenCalledWith({ newValue: VALID_DATA, oldValue: undefined });
    });

    it('ignores changes to other namespaces', async () => {
      const listener = vi.fn();
      repository.addChangeListener(listener);

      storage.notifyChanges({ other: { newValue: 1 } });

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('without a data source', () => {
    beforeEach(() => {
      repository = new TestOptionalRepository();
    });

    it('resolves undefined from getOptional rather than throwing', async () => {
      await expect(repository.getOptional()).resolves.toBeUndefined();
    });

    // Every promise-returning member must *reject* rather than throw synchronously, so that a caller writing
    // `repository.get().catch(...)` cannot be caught out by an uncaught error. `get` and `isNotEmpty` previously
    // regressed on this by not being declared `async`.
    it.each([
      ['clear', () => repository.clear()],
      ['get', () => repository.get()],
      ['init', () => repository.init(() => VALID_DATA)],
      ['isEmpty', () => repository.isEmpty()],
      ['isNotEmpty', () => repository.isNotEmpty()],
      ['mutate', () => repository.mutate((data) => data)],
      ['set', () => repository.set(VALID_DATA)],
    ])('rejects %s with DAT405000 rather than throwing synchronously', async (_label, act) => {
      let promise!: Promise<unknown>;

      expect(() => {
        promise = act();
      }).not.toThrow();

      await expect(promise).rejects.toMatchObject({ code: 'DAT405000' });
    });

    it('throws DAT405000 from addChangeListener', () => {
      expect(() => repository.addChangeListener(vi.fn())).toThrow(expect.objectContaining({ code: 'DAT405000' }));
    });
  });
});

describe('RequiredDataRepository', () => {
  it('behaves as an OptionalDataRepository whose data source is mandatory', async () => {
    const storage = new FakeDataStorage();
    const repository = new TestRequiredRepository(storage);

    await repository.set(VALID_DATA);

    await expect(repository.get()).resolves.toEqual(VALID_DATA);
  });
});
