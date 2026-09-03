import { vi } from 'vitest';

/**
 * An in-memory stand-in for a `browser.storage` area (e.g. `browser.storage.local`).
 *
 * Only the members used by `BrowserDataStorage` are implemented. Values are structurally cloned on the way in and out,
 * mirroring the real API, so a test cannot accidentally depend on holding the same object reference.
 */
export class FakeBrowserStorageArea {
  readonly onChanged = {
    addListener: vi.fn(),
    removeListener: vi.fn(),
  };

  private data: Record<string, unknown> = {};

  constructor(initialData: Record<string, unknown> = {}) {
    this.setSync(initialData);
  }

  async clear(): Promise<void> {
    this.data = {};
  }

  async get(keys?: string | string[]): Promise<Record<string, unknown>> {
    if (keys == null) {
      return structuredClone(this.data);
    }

    const result: Record<string, unknown> = {};

    for (const key of Array.isArray(keys) ? keys : [keys]) {
      if (Object.hasOwn(this.data, key)) {
        result[key] = structuredClone(this.data[key]);
      }
    }

    return result;
  }

  async getKeys(): Promise<string[]> {
    return Object.keys(this.data);
  }

  async remove(keys: string | string[]): Promise<void> {
    for (const key of Array.isArray(keys) ? keys : [keys]) {
      delete this.data[key];
    }
  }

  async set(data: Record<string, unknown>): Promise<void> {
    this.setSync(data);
  }

  /** Reads the raw contents, for asserting on what was persisted without going through the API under test. */
  snapshot(): Record<string, unknown> {
    return structuredClone(this.data);
  }

  private setSync(data: Record<string, unknown>) {
    for (const [key, value] of Object.entries(data)) {
      this.data[key] = structuredClone(value);
    }
  }
}

/**
 * An in-memory implementation of the DOM {@link Storage} interface, for testing `DomDataStorage` without a real
 * `window.localStorage`/`window.sessionStorage`.
 */
export class FakeDomStorage implements Storage {
  private data = new Map<string, string>();

  constructor(initialData: Record<string, unknown> = {}) {
    for (const [key, value] of Object.entries(initialData)) {
      this.data.set(key, JSON.stringify(value));
    }
  }

  get length(): number {
    return this.data.size;
  }

  clear() {
    this.data.clear();
  }

  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }

  key(index: number): string | null {
    return [...this.data.keys()][index] ?? null;
  }

  removeItem(key: string) {
    this.data.delete(key);
  }

  setItem(key: string, value: string) {
    this.data.set(key, String(value));
  }

  /** Reads the raw contents, for asserting on what was persisted without going through the API under test. */
  snapshot(): Record<string, unknown> {
    return Object.fromEntries([...this.data].map(([key, value]) => [key, JSON.parse(value)]));
  }
}
