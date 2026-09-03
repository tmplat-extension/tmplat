import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  BrowserDataStorage,
  type DataStorage,
  type DataStorageChanges,
  DomDataStorage,
} from 'extension/common/data/data-storage';
import { getBrowserApiMock } from 'extension/test/browser-api.mock';
import { FakeDataStorage } from 'extension/test/data-storage.fake';
import { createLoggingServiceMock } from 'extension/test/logger.mock';
import { FakeBrowserStorageArea, FakeDomStorage } from 'extension/test/storage-area.fake';

type StorageHarness = {
  /** Reads what was actually persisted, bypassing the storage under test. */
  readonly snapshot: () => Record<string, unknown>;
  readonly storage: DataStorage;
};

const asLoggingService = () => createLoggingServiceMock() as never;

const createBrowserHarness = (initialData: Record<string, unknown> = {}): StorageHarness => {
  const area = new FakeBrowserStorageArea(initialData);

  vi.stubGlobal('browser', { ...getBrowserApiMock(), storage: { local: area } });

  return {
    snapshot: () => area.snapshot(),
    storage: new BrowserDataStorage('local', asLoggingService()),
  };
};

const createDomHarness = (initialData: Record<string, unknown> = {}): StorageHarness => {
  const area = new FakeDomStorage(initialData);

  vi.stubGlobal('window', { localStorage: area });

  return {
    snapshot: () => area.snapshot(),
    storage: new DomDataStorage('localStorage', asLoggingService()),
  };
};

const createFakeHarness = (initialData: Record<string, unknown> = {}): StorageHarness => {
  const storage = new FakeDataStorage(initialData);

  return { snapshot: () => storage.snapshot(), storage };
};

// Both implementations back the same `DataStorage` interface and are used interchangeably through DI, so the contract
// is asserted against both rather than testing either in isolation. Divergence between them is the real risk.
// `FakeDataStorage` is included so that tests written against the fake cannot rely on behavior the real
// implementations do not have.
describe.each([
  ['BrowserDataStorage', createBrowserHarness],
  ['DomDataStorage', createDomHarness],
  ['FakeDataStorage', createFakeHarness],
])('%s', (_name, createHarness) => {
  let snapshot: StorageHarness['snapshot'];
  let storage: DataStorage;

  const givenData = (data: Record<string, unknown>) => {
    ({ snapshot, storage } = createHarness(data));
  };

  beforeEach(() => {
    givenData({});
  });

  describe('all', () => {
    it('resolves an empty object when nothing is stored', async () => {
      await expect(storage.all()).resolves.toEqual({});
    });

    it('resolves everything that is stored', async () => {
      givenData({ a: 1, b: 'two' });

      await expect(storage.all()).resolves.toEqual({ a: 1, b: 'two' });
    });
  });

  describe('get', () => {
    it('resolves the stored value', async () => {
      givenData({ a: { nested: true } });

      await expect(storage.get('a')).resolves.toEqual({ nested: true });
    });

    it('rejects with DAT404000 for a missing key, rather than resolving undefined', async () => {
      await expect(storage.get('missing')).rejects.toMatchObject({ code: 'DAT404000' });
    });

    it.each([
      ['null', null],
      ['false', false],
      ['zero', 0],
      ['an empty string', ''],
    ])('resolves %s rather than treating it as missing', async (_label, value) => {
      givenData({ a: value });

      await expect(storage.get('a')).resolves.toBe(value);
    });
  });

  describe('getOptional', () => {
    it('resolves the stored value', async () => {
      givenData({ a: 1 });

      await expect(storage.getOptional('a')).resolves.toBe(1);
    });

    it('resolves undefined for a missing key', async () => {
      await expect(storage.getOptional('missing')).resolves.toBeUndefined();
    });
  });

  describe('getAll', () => {
    it('resolves only the requested keys', async () => {
      givenData({ a: 1, b: 2, c: 3 });

      await expect(storage.getAll(['a', 'c'])).resolves.toEqual({ a: 1, c: 3 });
    });

    it('resolves an empty object when no keys are requested', async () => {
      givenData({ a: 1 });

      await expect(storage.getAll([])).resolves.toEqual({});
    });

    it('rejects with DAT404010 when any requested key is missing', async () => {
      givenData({ a: 1 });

      await expect(storage.getAll(['a', 'missing'])).rejects.toMatchObject({ code: 'DAT404010' });
    });
  });

  describe('getAny', () => {
    it('resolves the keys that exist and omits those that do not', async () => {
      givenData({ a: 1 });

      await expect(storage.getAny(['a', 'missing'])).resolves.toEqual({ a: 1 });
    });
  });

  describe('has', () => {
    it.each([
      ['a stored key', 'a', true],
      ['a missing key', 'missing', false],
    ])('resolves %s -> %s', async (_label, key, expected) => {
      givenData({ a: 1 });

      await expect(storage.has(key)).resolves.toBe(expected);
    });

    it('resolves true for a key stored as null', async () => {
      givenData({ a: null });

      await expect(storage.has('a')).resolves.toBe(true);
    });
  });

  describe('hasAll', () => {
    it.each([
      ['every key is stored', ['a', 'b'], true],
      ['any key is missing', ['a', 'missing'], false],
      ['no keys are requested', [], true],
    ])('resolves %s -> %s', async (_label, keys, expected) => {
      givenData({ a: 1, b: 2 });

      await expect(storage.hasAll(keys)).resolves.toBe(expected);
    });
  });

  describe('hasAny', () => {
    it.each([
      ['any key is stored', ['a', 'missing'], true],
      ['no key is stored', ['missing', 'other'], false],
      ['no keys are requested', [], false],
    ])('resolves %s -> %s', async (_label, keys, expected) => {
      givenData({ a: 1, b: 2 });

      await expect(storage.hasAny(keys)).resolves.toBe(expected);
    });
  });

  describe('keys', () => {
    it('resolves the stored keys', async () => {
      givenData({ a: 1, b: 2 });

      await expect(storage.keys()).resolves.toEqual(['a', 'b']);
    });

    it('resolves an empty array when nothing is stored', async () => {
      await expect(storage.keys()).resolves.toEqual([]);
    });
  });

  describe('size', () => {
    it('resolves the number of stored keys', async () => {
      givenData({ a: 1, b: 2 });

      await expect(storage.size()).resolves.toBe(2);
    });

    it('resolves zero when nothing is stored', async () => {
      await expect(storage.size()).resolves.toBe(0);
    });
  });

  describe('set', () => {
    it('persists a new value', async () => {
      await storage.set('a', { nested: true });

      expect(snapshot()).toEqual({ a: { nested: true } });
    });

    it('overwrites an existing value', async () => {
      givenData({ a: 1 });

      await storage.set('a', 2);

      expect(snapshot()).toEqual({ a: 2 });
    });

    it('leaves other keys untouched', async () => {
      givenData({ a: 1, b: 2 });

      await storage.set('a', 3);

      expect(snapshot()).toEqual({ a: 3, b: 2 });
    });

    it('stores a value by copy, so later mutation of the caller\u2019s object does not leak in', async () => {
      const value = { nested: true };

      await storage.set('a', value);
      value.nested = false;

      await expect(storage.get('a')).resolves.toEqual({ nested: true });
    });
  });

  describe('setAll', () => {
    it('merges into the existing data rather than replacing it', async () => {
      givenData({ a: 1, b: 2 });

      await storage.setAll({ b: 3, c: 4 });

      expect(snapshot()).toEqual({ a: 1, b: 3, c: 4 });
    });

    it('is a no-op for an empty object', async () => {
      givenData({ a: 1 });

      await storage.setAll({});

      expect(snapshot()).toEqual({ a: 1 });
    });
  });

  describe('remove', () => {
    it('removes the key', async () => {
      givenData({ a: 1, b: 2 });

      await storage.remove('a');

      expect(snapshot()).toEqual({ b: 2 });
    });

    it('is a no-op for a missing key', async () => {
      givenData({ a: 1 });

      await storage.remove('missing');

      expect(snapshot()).toEqual({ a: 1 });
    });
  });

  describe('removeAll', () => {
    it('removes every given key', async () => {
      givenData({ a: 1, b: 2, c: 3 });

      await storage.removeAll(['a', 'c']);

      expect(snapshot()).toEqual({ b: 2 });
    });

    it('is a no-op for an empty array', async () => {
      givenData({ a: 1 });

      await storage.removeAll([]);

      expect(snapshot()).toEqual({ a: 1 });
    });
  });

  describe('clear', () => {
    it('removes everything', async () => {
      givenData({ a: 1, b: 2 });

      await storage.clear();

      expect(snapshot()).toEqual({});
    });
  });
});

describe('DomDataStorage change listeners', () => {
  let changes: DataStorageChanges[];
  let storage: DomDataStorage;

  const givenData = (data: Record<string, unknown> = {}) => {
    vi.stubGlobal('window', { localStorage: new FakeDomStorage(data) });

    storage = new DomDataStorage('localStorage', asLoggingService());
    changes = [];

    storage.addChangeListener((change) => changes.push(change));
  };

  beforeEach(() => {
    givenData();
  });

  it('reports the new and old value when a key is set', async () => {
    givenData({ a: 1 });

    await storage.set('a', 2);

    expect(changes).toEqual([{ a: { newValue: 2, oldValue: 1 } }]);
  });

  it('reports an undefined old value when a key is set for the first time', async () => {
    await storage.set('a', 1);

    expect(changes).toEqual([{ a: { newValue: 1, oldValue: undefined } }]);
  });

  it('reports every key in a single notification when setting many', async () => {
    givenData({ a: 1 });

    await storage.setAll({ a: 2, b: 3 });

    expect(changes).toEqual([{ a: { newValue: 2, oldValue: 1 }, b: { newValue: 3, oldValue: undefined } }]);
  });

  it('reports the old value when a key is removed', async () => {
    givenData({ a: 1 });

    await storage.remove('a');

    expect(changes).toEqual([{ a: { oldValue: 1 } }]);
  });

  it('reports every removed key in a single notification', async () => {
    givenData({ a: 1, b: 2 });

    await storage.removeAll(['a', 'b']);

    expect(changes).toEqual([{ a: { oldValue: 1 }, b: { oldValue: 2 } }]);
  });

  it('reports every cleared key in a single notification', async () => {
    givenData({ a: 1, b: 2 });

    await storage.clear();

    expect(changes).toEqual([{ a: { oldValue: 1 }, b: { oldValue: 2 } }]);
  });

  it.each([
    ['removing a missing key', async () => storage.remove('missing')],
    ['removing no keys', async () => storage.removeAll([])],
    ['setting no keys', async () => storage.setAll({})],
    ['clearing empty storage', async () => storage.clear()],
  ])('does not notify when %s', async (_label, act) => {
    await act();

    expect(changes).toEqual([]);
  });

  it('notifies every registered listener', async () => {
    const second = vi.fn();
    storage.addChangeListener(second);

    await storage.set('a', 1);

    expect(changes).toHaveLength(1);
    expect(second).toHaveBeenCalledTimes(1);
  });
});

describe('BrowserDataStorage change listeners', () => {
  it('delegates registration to the underlying storage area', () => {
    const area = new FakeBrowserStorageArea();
    vi.stubGlobal('browser', { ...getBrowserApiMock(), storage: { local: area } });

    const storage = new BrowserDataStorage('local', asLoggingService());
    const listener = vi.fn();

    storage.addChangeListener(listener);

    expect(area.onChanged.addListener).toHaveBeenCalledWith(listener);
  });
});

describe('construction', () => {
  it('throws when the requested browser storage area is unavailable', () => {
    vi.stubGlobal('browser', { ...getBrowserApiMock(), storage: {} });

    expect(() => new BrowserDataStorage('local', asLoggingService())).toThrow(
      'BrowserDataStorage.local is not available',
    );
  });

  it('throws when the requested DOM storage is unavailable', () => {
    vi.stubGlobal('window', {});

    expect(() => new DomDataStorage('localStorage', asLoggingService())).toThrow(
      'DomDataStorage.localStorage is not available',
    );
  });
});
