import { isUndefined } from 'lodash-es';

import { reduceToObject } from 'extension/common/array.utils';

export interface DataStorage {
  addChangeListener(listener: DataStorageChangeListener): void;

  all(): Promise<Record<string, any>>;

  clear(): Promise<void>;

  get(key: string, defaultValueProvider?: DefaultDataValueProvider): Promise<any>;

  getAll(keys: string[]): Promise<Record<string, any>>;

  remove(key: string): Promise<void>;

  removeAll(keys: string[]): Promise<void>;

  set(key: string, value: any): Promise<void>;

  setAll(data: Record<string, any>): Promise<void>;
}

export class ChromeDataStorage implements DataStorage {
  constructor(
    private readonly storageAreaName: chrome.storage.AreaName,
    private readonly storageArea: chrome.storage.StorageArea,
  ) {}

  addChangeListener(listener: DataStorageChangeListener) {
    // TODO: Simplify with chrome.storage.StorageArea.onChanged once supported by @types/chrome
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (this.storageAreaName === areaName) {
        listener(changes);
      }
    });
  }

  all(): Promise<Record<string, any>> {
    return this.storageArea.get(null);
  }

  clear(): Promise<void> {
    return this.storageArea.clear();
  }

  async get(key: string, defaultValueProvider?: DefaultDataValueProvider): Promise<any> {
    const data = await this.storageArea.get([key]);
    const value = data[key];
    if (isUndefined(value) && defaultValueProvider) {
      return defaultValueProvider();
    }

    return value;
  }

  getAll(keys: string[]): Promise<Record<string, any>> {
    return this.storageArea.get(keys);
  }

  remove(key: string): Promise<void> {
    return this.storageArea.remove(key);
  }

  removeAll(keys: string[]): Promise<void> {
    return this.storageArea.remove(keys);
  }

  set(key: string, value: any): Promise<void> {
    return this.storageArea.set({ [key]: value });
  }

  setAll(data: Record<string, any>): Promise<void> {
    return this.storageArea.set(data);
  }

  static forLocal(): ChromeDataStorage {
    return new ChromeDataStorage('local', chrome.storage.local);
  }

  static forSync(): ChromeDataStorage {
    return new ChromeDataStorage('sync', chrome.storage.sync);
  }
}

export class DomDataStorage implements DataStorage {
  constructor(private readonly storage: Storage) {}

  addChangeListener() {
    throw new Error('DomDataStorage#addChangeListener is not supported');
  }

  async all(): Promise<Record<string, any>> {
    return reduceToObject(Object.entries(this.storage), ([key, value]) => [key, JSON.parse(value)]);
  }

  async clear(): Promise<void> {
    this.storage.clear();
  }

  async get(key: string, defaultValueProvider?: DefaultDataValueProvider): Promise<any> {
    const value = this.getJsonValue(key);
    if (isUndefined(value) && defaultValueProvider) {
      return defaultValueProvider();
    }

    return value;
  }

  async getAll(keys: string[]): Promise<Record<string, any>> {
    return reduceToObject(keys, (key) => [key, this.getJsonValue(key)]);
  }

  async remove(key: string): Promise<void> {
    this.storage.removeItem(key);
  }

  async removeAll(keys: string[]): Promise<void> {
    keys.forEach((key) => this.storage.removeItem(key));
  }

  async set(key: string, value: any): Promise<void> {
    this.setJsonValue(key, value);
  }

  async setAll(data: Record<string, any>): Promise<void> {
    Object.entries(data).forEach(([key, value]) => {
      this.setJsonValue(key, value);
    });
  }

  private getJsonValue(key: string): any {
    const value = this.storage.getItem(key);
    if (value == null) {
      return;
    }

    return JSON.parse(value);
  }

  private setJsonValue(key: string, value: any) {
    this.storage.setItem(key, JSON.stringify(value));
  }

  static forLocal(): DomDataStorage {
    return new DomDataStorage(localStorage);
  }
}

export type DefaultDataValueProvider = () => any;

export type DataStorageChange<T = any> = {
  newValue?: T;
  oldValue?: T;
};

export type DataStorageChangeListener = (changes: Record<string, DataStorageChange>) => void;
