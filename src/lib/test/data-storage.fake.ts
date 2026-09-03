import { joinQuoted } from 'extension/common/array.utils';
import {
  type DataStorage,
  type DataStorageChangeListener,
  type DataStorageChanges,
} from 'extension/common/data/data-storage';
import { ExtensionError } from 'extension/common/error/extension-error';
import { getOwnKeysMissing } from 'extension/common/object.utils';

/**
 * An in-memory {@link DataStorage} for use in tests, avoiding any dependency on the WebExtensions storage or DOM
 * storage APIs.
 *
 * Its behavior is asserted against the same contract suite as `BrowserDataStorage`/`DomDataStorage` (see
 * `data-storage.test.ts`), so a test using this fake cannot pass against behavior the real implementations do not
 * have. Change listeners are only notified when a test calls {@link notifyChanges} explicitly.
 */
export class FakeDataStorage implements DataStorage {
  private readonly data: Map<string, unknown>;
  readonly listeners: DataStorageChangeListener[] = [];

  constructor(initialData: Record<string, unknown> = {}) {
    // Values are cloned in and out, as both `BrowserDataStorage` (structured clone) and `DomDataStorage` (JSON round
    // trip) do, so a test cannot accidentally depend on holding the same object reference as the storage
    this.data = new Map(Object.entries(initialData).map(([key, value]) => [key, structuredClone(value)]));
  }

  addChangeListener(listener: DataStorageChangeListener) {
    this.listeners.push(listener);
  }

  async all<V = unknown, K extends string = string>(): Promise<Record<K, V>> {
    return this.snapshot() as Record<K, V>;
  }

  async clear(): Promise<void> {
    this.data.clear();
  }

  async get<V = unknown, K extends string = string>(key: K): Promise<V> {
    const value = structuredClone(this.data.get(key)) as V;
    if (value === undefined) {
      throw ExtensionError.from('DAT404000', `"${key}"`);
    }

    return value;
  }

  async getAll<V = unknown, K extends string = string>(keys: K[]): Promise<Record<K, V>> {
    const data = await this.getAny<V, K>(keys);
    const missingKeys = getOwnKeysMissing(data, keys);
    if (missingKeys.length) {
      throw ExtensionError.from('DAT404010', joinQuoted(missingKeys));
    }

    return data as Record<K, V>;
  }

  async getAny<V = unknown, K extends string = string>(keys: K[]): Promise<Record<K, V | undefined>> {
    return Object.fromEntries(
      keys.filter((key) => this.data.has(key)).map((key) => [key, structuredClone(this.data.get(key))]),
    ) as Record<K, V | undefined>;
  }

  async getOptional<V = unknown, K extends string = string>(key: K): Promise<V | undefined> {
    return structuredClone(this.data.get(key)) as V | undefined;
  }

  async has<K extends string = string>(key: K): Promise<boolean> {
    return this.data.has(key);
  }

  async hasAll<K extends string = string>(keys: K[]): Promise<boolean> {
    return keys.every((key) => this.data.has(key));
  }

  async hasAny<K extends string = string>(keys: K[]): Promise<boolean> {
    return keys.some((key) => this.data.has(key));
  }

  async keys<K extends string = string>(): Promise<K[]> {
    return [...this.data.keys()] as K[];
  }

  async remove<K extends string = string>(key: K): Promise<void> {
    this.data.delete(key);
  }

  async removeAll<K extends string = string>(keys: K[]): Promise<void> {
    for (const key of keys) {
      this.data.delete(key);
    }
  }

  async set<V = unknown, K extends string = string>(key: K, value: V): Promise<void> {
    this.data.set(key, structuredClone(value));
  }

  async setAll<V = unknown, K extends string = string>(data: Record<K, V>): Promise<void> {
    for (const [key, value] of Object.entries<V>(data)) {
      this.data.set(key, structuredClone(value));
    }
  }

  /** Reads the raw contents synchronously, for asserting on what was persisted. */
  snapshot(): Record<string, unknown> {
    return structuredClone(Object.fromEntries(this.data));
  }

  /** Notifies every registered change listener, for testing code that reacts to storage changes. */
  notifyChanges(changes: DataStorageChanges) {
    this.listeners.forEach((listener) => listener(changes));
  }

  async size(): Promise<number> {
    return this.data.size;
  }
}
