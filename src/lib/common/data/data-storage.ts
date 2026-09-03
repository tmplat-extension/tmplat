import { joinQuoted } from 'extension/common/array.utils';
import { ExtensionError } from 'extension/common/error/extension-error';
import { type Logger } from 'extension/common/logging/logger';
import { type LoggingService } from 'extension/common/logging/logging.service';
import { getOwnKeysMissing } from 'extension/common/object.utils';

export interface DataStorage {
  addChangeListener(listener: DataStorageChangeListener): void;

  all<V = unknown, K extends string = string>(): Promise<Record<K, V>>;

  clear(): Promise<void>;

  get<V = unknown, K extends string = string>(key: K): Promise<V>;

  getAll<V = unknown, K extends string = string>(keys: K[]): Promise<Record<K, V>>;

  getAny<V = unknown, K extends string = string>(keys: K[]): Promise<Record<K, V | undefined>>;

  getOptional<V = unknown, K extends string = string>(key: K): Promise<V | undefined>;

  has<K extends string = string>(key: K): Promise<boolean>;

  hasAll<K extends string = string>(keys: K[]): Promise<boolean>;

  hasAny<K extends string = string>(keys: K[]): Promise<boolean>;

  keys<K extends string = string>(): Promise<K[]>;

  remove<K extends string = string>(key: K): Promise<void>;

  removeAll<K extends string = string>(keys: K[]): Promise<void>;

  set<V = unknown, K extends string = string>(key: K, value: V): Promise<void>;

  setAll<V = unknown, K extends string = string>(data: Record<K, V>): Promise<void>;

  size(): Promise<number>;
}

export class BrowserDataStorage implements DataStorage {
  private readonly logger: Logger;
  private readonly storage: browser.storage.StorageArea;

  constructor(
    private readonly storageName: BrowserDataStorageName,
    private readonly logging: LoggingService,
  ) {
    this.logger = logging.getLogger(`BrowserDataStorage.${storageName}`);
    this.storage = browser.storage[storageName];

    if (!this.storage) {
      throw new Error(`BrowserDataStorage.${storageName} is not available`);
    }
  }

  addChangeListener(listener: DataStorageChangeListener) {
    this.storage.onChanged.addListener(listener);
  }

  all<V = unknown, K extends string = string>(): Promise<Record<K, V>> {
    return this.storage.get();
  }

  clear() {
    return this.storage.clear();
  }

  async get<V = unknown, K extends string = string>(key: K): Promise<V> {
    const data = await this.storage.get<Record<K, V>>([key]);
    const value = data[key];
    if (value === undefined) {
      this.logger.error(`Data not found for "${key}" in browser.storage.${this.storageName}`);

      throw ExtensionError.from('DAT404000', `"${key}"`);
    }

    return value;
  }

  async getAll<V = unknown, K extends string = string>(keys: K[]): Promise<Record<K, V>> {
    const data = await this.storage.get<Record<K, V>>(keys);
    const missingKeys = getOwnKeysMissing(data, keys);
    if (missingKeys.length) {
      const quotedMissingKeys = joinQuoted(missingKeys);
      this.logger.error(`Data not found for ${quotedMissingKeys} in browser.storage.${this.storageName}`);

      throw ExtensionError.from('DAT404010', quotedMissingKeys);
    }

    return data;
  }

  async getAny<V = unknown, K extends string = string>(keys: K[]): Promise<Record<K, V | undefined>> {
    return this.storage.get(keys);
  }

  async getOptional<V = unknown, K extends string = string>(key: K): Promise<V | undefined> {
    const data = await this.storage.get<Record<K, V>>([key]);
    return data[key];
  }

  async has<K extends string = string>(key: K): Promise<boolean> {
    const data = await this.storage.get([key]);
    return Object.hasOwn(data, key);
  }

  async hasAll<K extends string = string>(keys: K[]): Promise<boolean> {
    if (!keys.length) {
      return true;
    }

    const data = await this.storage.get(keys);
    return keys.every((key) => Object.hasOwn(data, key));
  }

  async hasAny<K extends string = string>(keys: K[]): Promise<boolean> {
    if (!keys.length) {
      return false;
    }

    const data = await this.storage.get(keys);
    return keys.some((key) => Object.hasOwn(data, key));
  }

  async keys<K extends string = string>(): Promise<K[]> {
    return (await this.storage.getKeys()) as K[];
  }

  remove<K extends string = string>(key: K) {
    return this.storage.remove(key);
  }

  async removeAll<K extends string = string>(keys: K[]) {
    if (keys.length) {
      await this.storage.remove(keys);
    }
  }

  set<V = unknown, K extends string = string>(key: K, value: V) {
    return this.storage.set({ [key]: value });
  }

  setAll<V = unknown, K extends string = string>(data: Record<K, V>) {
    return this.storage.set(data);
  }

  async size(): Promise<number> {
    return (await this.storage.getKeys()).length;
  }
}

export class DomDataStorage implements DataStorage {
  private readonly changeListeners: DataStorageChangeListener[] = [];
  private readonly logger: Logger;
  private readonly storage: Storage;

  constructor(
    private readonly storageName: DomDataStorageName,
    loggingService: LoggingService,
  ) {
    this.logger = loggingService.getLogger(`DomDataStorage.${storageName}`);
    this.storage = window[storageName];

    if (!this.storage) {
      throw new Error(`DomDataStorage.${storageName} is not available`);
    }
  }

  addChangeListener(listener: DataStorageChangeListener) {
    // TODO: Log warning of dangers using this as external changes will not trigger listeners?
    // Not using storage event as "clear" operation is not compatible
    this.changeListeners.push(listener);
  }

  async all<V = unknown, K extends string = string>(): Promise<Record<K, V>> {
    return this.getAllSync<V, K>();
  }

  async clear() {
    const dataEntries = Object.entries(this.getAllSync());

    this.storage.clear();

    if (dataEntries.length) {
      this.notifyChanges(Object.fromEntries(dataEntries.map(([key, oldValue]) => [key, { oldValue }])));
    }
  }

  async get<V = unknown, K extends string = string>(key: K): Promise<V> {
    const value = this.getOptionalSync<V, K>(key);
    if (value === undefined) {
      this.logger.error(`Data not found for "${key}" in ${this.storageName}`);

      throw ExtensionError.from('DAT404000', `"${key}"`);
    }

    return value;
  }

  async getAll<V = unknown, K extends string = string>(keys: K[]): Promise<Record<K, V>> {
    const data = this.getAllSync<V, K>(keys);
    const missingKeys = getOwnKeysMissing(data, keys);
    if (missingKeys.length) {
      const quotedMissingKeys = joinQuoted(missingKeys);
      this.logger.error(`Data not found for ${quotedMissingKeys} in ${this.storageName}`);

      throw ExtensionError.from('DAT404010', quotedMissingKeys);
    }

    return data;
  }

  async getAny<V = unknown, K extends string = string>(keys: K[]): Promise<Record<K, V | undefined>> {
    return this.getAllSync<V, K>(keys);
  }

  async getOptional<V = unknown, K extends string = string>(key: K): Promise<V | undefined> {
    return this.getOptionalSync<V, K>(key);
  }

  async has<K extends string = string>(key: K): Promise<boolean> {
    return this.hasSync(key);
  }

  async hasAll<K extends string = string>(keys: K[]): Promise<boolean> {
    return keys.every((key) => this.hasSync(key));
  }

  async hasAny<K extends string = string>(keys: K[]): Promise<boolean> {
    return keys.some((key) => this.hasSync(key));
  }

  async keys<K extends string = string>(): Promise<K[]> {
    return this.keysSync();
  }

  async remove<K extends string = string>(key: K) {
    const oldValue = this.getOptionalSync(key);

    if (oldValue !== undefined) {
      this.storage.removeItem(key);

      this.notifyChanges({ [key]: { oldValue } });
    }
  }

  async removeAll<K extends string = string>(keys: K[]) {
    const changes: Record<string, DataStorageChange> = {};
    let changeCount = 0;

    keys.forEach((key) => {
      const oldValue = this.getOptionalSync(key);

      if (oldValue !== undefined) {
        this.storage.removeItem(key);

        changes[key] = { oldValue };
        changeCount++;
      }
    });

    if (changeCount) {
      this.notifyChanges(changes);
    }
  }

  async set<V = unknown, K extends string = string>(key: K, value: V) {
    const oldValue = this.getOptionalSync<V, K>(key);

    this.setSync(key, value);

    this.notifyChanges({ [key]: { newValue: value, oldValue } });
  }

  async setAll<V = unknown, K extends string = string>(data: Record<K, V>) {
    const changes: Record<string, DataStorageChange> = {};
    let changeCount = 0;

    for (const [key, value] of Object.entries(data)) {
      const oldValue = this.getOptionalSync<V, K>(key as K);

      this.setSync(key, value);

      changes[key] = { newValue: value, oldValue };
      changeCount++;
    }

    if (changeCount) {
      this.notifyChanges(changes);
    }
  }

  async size(): Promise<number> {
    return this.storage.length;
  }

  private getAllSync<V = unknown, K extends string = string>(keys?: K[]): Record<K, V> {
    const data: Record<string, V> = {};
    const keySet = keys ? new Set<string>(keys) : undefined;

    for (let i = 0, l = this.storage.length; i < l; i++) {
      const key = this.storage.key(i);
      if (key === null || (keySet && !keySet.has(key))) {
        continue;
      }

      const value = this.storage.getItem(key);
      if (value === null) {
        continue;
      }

      data[key] = JSON.parse(value);
    }

    return data;
  }

  private getOptionalSync<V = unknown, K extends string = string>(key: K): V | undefined {
    const value = this.storage.getItem(key);
    if (value === null) {
      return;
    }

    return JSON.parse(value);
  }

  private hasSync<K extends string = string>(key: K): boolean {
    return this.storage.getItem(key) !== null;
  }

  private keysSync<K extends string = string>(): K[] {
    const keys: K[] = [];

    for (let i = 0, l = this.storage.length; i < l; i++) {
      const key = this.storage.key(i);
      if (key !== null) {
        keys.push(key as K);
      }
    }

    return keys;
  }

  private notifyChanges(changes: DataStorageChanges) {
    this.changeListeners.forEach((listener) => listener(changes));
  }

  private setSync<V = unknown, K extends string = string>(key: K, value: V) {
    this.storage.setItem(key, JSON.stringify(value));
  }
}

export type BrowserDataStorageName = browser.storage.AreaName;

export type DataStorageChange<NewValue = unknown, OldValue = NewValue> = {
  readonly newValue?: NewValue;
  readonly oldValue?: OldValue;
};

export type DataStorageChanges<Key extends string = string, NewValue = unknown, OldValue = NewValue> = Readonly<
  Record<Key, DataStorageChange<NewValue, OldValue>>
>;

export type DataStorageChangeListener<Key extends string = string, NewValue = unknown, OldValue = NewValue> = (
  changes: DataStorageChanges<Key, NewValue, OldValue>,
) => void;

export type DomDataStorageName = keyof Pick<Window, 'localStorage' | 'sessionStorage'>;
