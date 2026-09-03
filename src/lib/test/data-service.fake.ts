import { type DataService } from 'extension/common/data/data.service';
import { FakeDataStorage } from 'extension/test/data-storage.fake';

/**
 * A fake {@link DataService} backed by in-memory {@link FakeDataStorage} instances, one per storage area, so a
 * repository can be exercised end-to-end (install, get, set, update) without touching the WebExtensions storage APIs.
 *
 * Each area is a distinct storage, matching production where `local`, `sync`, `session` and `managed` are separate.
 * Tests can reach into a specific area to seed or inspect it.
 */
export class FakeDataService implements Pick<DataService, 'local' | 'managed' | 'session' | 'sync'> {
  readonly local = new FakeDataStorage();
  readonly managed = new FakeDataStorage();
  readonly session = new FakeDataStorage();
  readonly sync = new FakeDataStorage();
}

/** Casts a {@link FakeDataService} to the real type, for passing into a repository constructor. */
export const asDataService = (fake: FakeDataService): DataService => fake as unknown as DataService;
