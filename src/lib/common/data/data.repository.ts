import { type z } from 'zod';
import { type DataNamespace } from 'extension/common/data/data-namespace.enum';
import { type DataStorage, type DataStorageChange } from 'extension/common/data/data-storage';
import { ExtensionError } from 'extension/common/error/extension-error';
import { type Logger } from 'extension/common/logging/logger';
import { type ValidationService } from 'extension/common/validation/validation.service';

export interface DataRepository<Data> {
  addChangeListener<OldData = Data>(listener: DataRepositoryChangeListener<Data, OldData>): void;

  clear(): Promise<void>;

  get(): Promise<Data>;

  getOptional(): Promise<Data | undefined>;

  init(initializer: DataRepositoryInitializer<Data>): Promise<boolean>;

  isEmpty(): Promise<boolean>;

  isNotEmpty(): Promise<boolean>;

  mutate(mutator: DataRepositoryMutator<Data>): Promise<boolean>;

  set(data: Data): Promise<void>;
}

/**
 * The storage plumbing shared by every repository, regardless of whether a namespace holds a single value or a
 * collection.
 *
 * This exists only so that {@link OptionalDataRepository} and {@link CollectionDataRepository} cannot drift in how they
 * resolve their storage, validate against their schema or report failures. It deliberately holds no opinion about how a
 * namespace maps onto storage keys, which is precisely where those two differ.
 */
abstract class BaseDataRepository<Schema extends z.ZodType> {
  protected readonly dataStorage?: DataStorage;
  protected readonly logger?: Logger;
  readonly namespace: DataNamespace;
  protected readonly schema: Schema;
  protected readonly validationService: ValidationService;

  protected constructor(options: OptionalDataRepositoryOptions<Schema>) {
    this.dataStorage = options.dataStorage;
    this.logger = options.logger;
    this.namespace = options.namespace;
    this.schema = options.schema;
    this.validationService = options.validationService;
  }

  protected requireDataSource(method: string): DataStorage {
    if (!this.dataStorage) {
      this.logger?.error(`Data source is required for '${this.namespace}' namespace to call '${method}'`);

      throw ExtensionError.from('DAT405000');
    }

    return this.dataStorage;
  }

  protected validate(data: unknown): z.output<Schema> {
    return this.validationService.validateSchema(data, this.schema, {
      code: 'DAT400000',
      parentLogger: this.logger,
    });
  }
}

export abstract class OptionalDataRepository<Schema extends z.ZodType, Data = z.output<Schema>>
  extends BaseDataRepository<Schema>
  implements DataRepository<Data>
{
  protected constructor(options: OptionalDataRepositoryOptions<Schema>) {
    super(options);
  }

  addChangeListener<OldData = Data>(listener: DataRepositoryChangeListener<Data, OldData>): void {
    this.requireDataSource('addChangeListener').addChangeListener((changes) => {
      const keyChanges = changes[this.namespace];

      if (keyChanges !== undefined) {
        listener(keyChanges as DataStorageChange<Data, OldData>);
      }
    });
  }

  async clear(): Promise<void> {
    return this.requireDataSource('clear').remove(this.namespace);
  }

  async get(): Promise<Data> {
    return this.requireDataSource('get').get(this.namespace);
  }

  async getBytesInUse(): Promise<number> {
    return this.requireDataSource('getBytesInUse').getBytesInUse([this.namespace]);
  }

  // Deliberately tolerates an absent data source, unlike every other read: this is the one method a caller can use to
  // ask "is there anything here?" without first knowing whether the namespace is backed by storage at all
  async getOptional(): Promise<Data | undefined> {
    return this.dataStorage?.getOptional(this.namespace);
  }

  async init(initializer: DataRepositoryInitializer<Data>): Promise<boolean> {
    const data = await this.requireDataSource('init').getOptional<Data>(this.namespace);
    if (data !== undefined) {
      return false;
    }

    await this.set(await initializer());
    return true;
  }

  async isEmpty(): Promise<boolean> {
    return !(await this.requireDataSource('isEmpty').has(this.namespace));
  }

  async isNotEmpty(): Promise<boolean> {
    return this.requireDataSource('isNotEmpty').has(this.namespace);
  }

  async mutate(mutator: DataRepositoryMutator<Data>): Promise<boolean> {
    let cancelled = false;
    const cancel = (): void => {
      cancelled = true;
    };
    const data = await this.requireDataSource('mutate').get<Data>(this.namespace);
    const mutated = await mutator(data, cancel);
    if (!cancelled) {
      await this.set(mutated);
      return true;
    }
    return false;
  }

  async set(data: Data): Promise<void> {
    await this.requireDataSource('set').set(this.namespace, this.validate(data));
  }
}

export abstract class RequiredDataRepository<
  Schema extends z.ZodType,
  Data = z.output<Schema>,
> extends OptionalDataRepository<Schema, Data> {
  protected constructor(options: RequiredDataRepositoryOptions<Schema>) {
    super(options);
  }
}

/**
 * A repository for a namespace holding an ordered collection of items, where each item is stored under its own key.
 *
 * {@link OptionalDataRepository} maps a whole namespace onto a single key, which caps the namespace at whatever
 * per-item limit the storage area enforces (8,192 bytes for `browser.storage.sync`) and makes every write a
 * read-modify-write of the entire collection. Here each item instead lives at `<namespace>:item:<id>`, so an item is
 * bounded by its own content rather than by its siblings, and editing one item cannot clobber a concurrent edit to
 * another.
 *
 * Order is significant to callers but cannot be recovered from the keys, so it is tracked explicitly in a separate
 * `<namespace>:index` key holding an array of ids. That is a distinct key from the settings namespace so that
 * reordering does not rewrite unrelated data, and so the order never leaks into a user-facing export.
 *
 * The index is authoritative for **order** and a key scan is authoritative for **existence**. They can disagree - a
 * write can fail part-way, since no storage area offers a transaction spanning several keys - so reads reconcile the
 * two rather than trusting either blindly: items missing from the index are appended, ids naming no item are ignored,
 * and both are logged. A partially applied write therefore degrades into a recoverable inconsistency instead of
 * silently losing an item.
 */
export abstract class CollectionDataRepository<
  Schema extends z.ZodType,
  Item = z.output<Schema>,
> extends BaseDataRepository<Schema> {
  private readonly getItemId: (item: Item) => string;
  private readonly indexKey: string;
  private readonly itemKeyPrefix: string;

  protected constructor(options: CollectionDataRepositoryOptions<Schema, Item>) {
    super(options);

    this.getItemId = options.getItemId;
    // The item prefix is deliberately distinct from the index key rather than a bare `<namespace>:<id>`, because an id
    // is arbitrary caller-supplied text: an item with the id "index" would otherwise overwrite the order itself
    this.indexKey = `${options.namespace}:index`;
    this.itemKeyPrefix = `${options.namespace}:item:`;
  }

  /**
   * Registers `listener` to be notified of semantic collection changes.
   *
   * Storage reports raw per-key changes, which every consumer would otherwise have to re-derive into "what actually
   * happened to the collection". Doing it once here keeps that logic - and the key naming it depends on - inside the
   * repository.
   */
  addChangeListener(listener: CollectionDataRepositoryChangeListener<Item>): void {
    this.requireDataSource('addChangeListener').addChangeListener((changes) => {
      const added: Item[] = [];
      const removed: Item[] = [];
      const updated: CollectionDataRepositoryItemChange<Item>[] = [];
      let order: string[] | undefined;

      for (const [key, change] of Object.entries(changes)) {
        if (key === this.indexKey) {
          order = change.newValue as string[] | undefined;
          continue;
        }
        if (!key.startsWith(this.itemKeyPrefix)) {
          continue;
        }

        const newValue = change.newValue as Item | undefined;
        const oldValue = change.oldValue as Item | undefined;

        if (newValue && oldValue) {
          updated.push({ newValue, oldValue });
        } else if (newValue) {
          added.push(newValue);
        } else if (oldValue) {
          removed.push(oldValue);
        }
      }

      if (added.length || removed.length || updated.length || order) {
        listener({ added, order, removed, updated });
      }
    });
  }

  /** Appends `items` to the end of the collection, writing the items and the updated order together. */
  async addItems(items: readonly Item[]): Promise<void> {
    if (!items.length) {
      return;
    }

    const dataStorage = this.requireDataSource('addItems');
    const ids = await this.getItemIds();
    const data: Record<string, unknown> = {};

    for (const item of items) {
      const validItem = this.validate(item);
      const id = this.getItemId(validItem as Item);

      if (ids.includes(id)) {
        this.logger?.error(`Cannot add duplicate "${id}" to '${this.namespace}' collection`);

        throw ExtensionError.from('DAT409000', `"${id}"`);
      }

      ids.push(id);
      data[this.toItemKey(id)] = validItem;
    }

    // Items and index go out as one batched write, so the order can never reference an item that was not persisted
    data[this.indexKey] = ids;

    await dataStorage.setAll(data);
  }

  /** Removes every item and the index, leaving the namespace empty. */
  async clear(): Promise<void> {
    const dataStorage = this.requireDataSource('clear');

    await dataStorage.removeAll([this.indexKey, ...(await this.getItemKeys())]);
  }

  /** Returns the total bytes consumed by the index and every item. */
  async getBytesInUse(): Promise<number> {
    const dataStorage = this.requireDataSource('getBytesInUse');

    return dataStorage.getBytesInUse([this.indexKey, ...(await this.getItemKeys())]);
  }

  /** Returns every item, in order. */
  async getItems(): Promise<Item[]> {
    const { items } = await this.read();

    return items;
  }

  async getItem(id: string): Promise<Item | undefined> {
    return this.requireDataSource('getItem').getOptional<Item>(this.toItemKey(id));
  }

  /** Returns the ids of every item, in order, reconciled against the items that actually exist. */
  async getItemIds(): Promise<string[]> {
    const { items } = await this.read();

    return items.map((item) => this.getItemId(item));
  }

  /** Populates the collection from `initializer`, but only when it has never been initialised. */
  async init(initializer: DataRepositoryInitializer<readonly Item[]>): Promise<boolean> {
    if (await this.requireDataSource('init').has(this.indexKey)) {
      return false;
    }

    await this.addItems(await initializer());
    return true;
  }

  async isEmpty(): Promise<boolean> {
    return !(await this.isNotEmpty());
  }

  async isNotEmpty(): Promise<boolean> {
    return !!(await this.getItemKeys()).length;
  }

  /**
   * Removes the items named by `ids`.
   *
   * The index is rewritten first so that a failure between the two writes leaves an item that nothing references -
   * harmless, and tidied up by the next {@link reconcile} - rather than an order referencing an item that is gone.
   */
  async removeItems(ids: readonly string[]): Promise<void> {
    if (!ids.length) {
      return;
    }

    const dataStorage = this.requireDataSource('removeItems');
    const removableIds = new Set(ids);
    const currentIds = await this.getItemIds();

    await dataStorage.set(
      this.indexKey,
      currentIds.filter((id) => !removableIds.has(id)),
    );
    await dataStorage.removeAll([...removableIds].map((id) => this.toItemKey(id)));
  }

  /**
   * Repairs any disagreement between the index and the items that exist, persisting the reconciled order.
   *
   * Reads reconcile in memory on every call, so this is only needed to make that repair durable - which is why it is
   * driven from the install/update path rather than from a read.
   */
  async reconcile(): Promise<boolean> {
    const { consistent, items } = await this.read();
    if (consistent) {
      return false;
    }

    await this.requireDataSource('reconcile').set(
      this.indexKey,
      items.map((item) => this.getItemId(item)),
    );

    return true;
  }

  /** Replaces the order of the collection, which must name exactly the items that exist. */
  async setItemOrder(ids: readonly string[]): Promise<void> {
    const dataStorage = this.requireDataSource('setItemOrder');
    const currentIds = new Set(await this.getItemIds());

    if (ids.length !== currentIds.size || ids.some((id) => !currentIds.has(id))) {
      this.logger?.error(`Cannot order '${this.namespace}' collection by ids that do not match its items`);

      throw ExtensionError.from('DAT409010');
    }

    await dataStorage.set(this.indexKey, [...ids]);
  }

  async size(): Promise<number> {
    return (await this.getItemKeys()).length;
  }

  /**
   * Applies `mutator` to the item named by `id`, writing back only that item.
   *
   * This is the narrow equivalent of {@link OptionalDataRepository.mutate}: it touches a single key, so two concurrent
   * edits to different items cannot lose one another.
   */
  async updateItem(id: string, mutator: DataRepositoryMutator<Item>): Promise<boolean> {
    const dataStorage = this.requireDataSource('updateItem');
    const itemKey = this.toItemKey(id);
    const item = await dataStorage.getOptional<Item>(itemKey);

    if (item === undefined) {
      this.logger?.error(`Data not found for "${id}" in '${this.namespace}' collection`);

      throw ExtensionError.from('DAT404000', `"${id}"`);
    }

    let cancelled = false;
    const mutated = await mutator(item, () => {
      cancelled = true;
    });
    if (cancelled) {
      return false;
    }

    const validItem = this.validate(mutated);
    if (this.getItemId(validItem as Item) !== id) {
      this.logger?.error(`Cannot change the id of "${id}" in '${this.namespace}' collection`);

      throw ExtensionError.from('DAT409020', `"${id}"`);
    }

    await dataStorage.set(itemKey, validItem);

    return true;
  }

  private async getItemKeys(): Promise<string[]> {
    const keys = await this.requireDataSource('getItemKeys').keys();

    return keys.filter((key) => key.startsWith(this.itemKeyPrefix));
  }

  /**
   * Loads every item and orders it by the index, reporting whether the two agreed.
   *
   * An item that fails validation is dropped rather than rejecting the whole read, so one corrupt item costs the user
   * that item instead of the entire collection.
   */
  private async read(): Promise<CollectionDataRepositoryRead<Item>> {
    const dataStorage = this.requireDataSource('read');
    const [itemKeys, order] = await Promise.all([this.getItemKeys(), dataStorage.getOptional<string[]>(this.indexKey)]);
    const data = await dataStorage.getAny<Item>(itemKeys);

    const itemsById = new Map<string, Item>();
    for (const [key, value] of Object.entries(data)) {
      const id = key.slice(this.itemKeyPrefix.length);

      if (value !== undefined && this.validationService.isValidSchema(value, this.schema)) {
        itemsById.set(id, value);
      } else {
        this.logger?.error(`Discarding invalid item "${id}" from '${this.namespace}' collection`);
      }
    }

    const items: Item[] = [];
    const orderedIds = new Set<string>();
    let consistent = true;

    for (const id of order ?? []) {
      const item = itemsById.get(id);

      if (item === undefined) {
        this.logger?.warn(`Ignoring "${id}" in '${this.namespace}' order as no such item exists`);
        consistent = false;
      } else if (orderedIds.has(id)) {
        this.logger?.warn(`Ignoring duplicate "${id}" in '${this.namespace}' order`);
        consistent = false;
      } else {
        orderedIds.add(id);
        items.push(item);
      }
    }

    // Anything the index does not mention still exists, so it is appended rather than hidden. Losing its position is
    // strictly better than losing the item
    for (const [id, item] of itemsById) {
      if (!orderedIds.has(id)) {
        this.logger?.warn(`Appending "${id}" to '${this.namespace}' order as it is absent from the index`);
        consistent = false;
        items.push(item);
      }
    }

    return { consistent, items };
  }

  private toItemKey(id: string): string {
    return `${this.itemKeyPrefix}${id}`;
  }
}

export type CollectionDataRepositoryChange<Item> = {
  readonly added: readonly Item[];
  /** The new order, present only when it changed. */
  readonly order?: readonly string[];
  readonly removed: readonly Item[];
  readonly updated: readonly CollectionDataRepositoryItemChange<Item>[];
};

export type CollectionDataRepositoryChangeListener<Item> = (change: CollectionDataRepositoryChange<Item>) => void;

export type CollectionDataRepositoryItemChange<Item> = {
  readonly newValue: Item;
  readonly oldValue: Item;
};

export type CollectionDataRepositoryOptions<Schema extends z.ZodType, Item> = OptionalDataRepositoryOptions<Schema> & {
  dataStorage: DataStorage;
  getItemId: (item: Item) => string;
};

type CollectionDataRepositoryRead<Item> = {
  readonly consistent: boolean;
  readonly items: Item[];
};

export type DataRepositoryChangeListener<NT, OT> = (change: DataStorageChange<NT, OT>) => void;

export type DataRepositoryInitializer<Data> = () => Data | Promise<Data>;

export type DataRepositoryMutator<Data> = (data: Data, cancel: () => void) => Data | Promise<Data>;

export type OptionalDataRepositoryOptions<Schema extends z.ZodType> = {
  dataStorage?: DataStorage;
  logger?: Logger;
  namespace: DataNamespace;
  schema: Schema;
  validationService: ValidationService;
};

export type RequiredDataRepositoryOptions<Schema extends z.ZodType> = Omit<
  OptionalDataRepositoryOptions<Schema>,
  'dataStorage'
> & {
  dataStorage: DataStorage;
};
