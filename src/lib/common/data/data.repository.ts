import Joi from 'joi';
import { DataNamespace } from 'extension/common/data/data-namespace.enum';
import { DataStorage, DataStorageChange } from 'extension/common/data/data-storage';
import { isUndefined } from 'extension/common/type.utils';
import { validateSchemaAsync } from 'extension/common/validation.utils';

export interface DataRepository<Data> {
  addChangeListener<OldData = Data>(listener: DataRepositoryChangeListener<Data, OldData>): void;

  clear(): Promise<void>;

  get(): Promise<Data>;

  getOptional(): Promise<Data | undefined>;

  init(initializer: DataRepositoryInitializer<Data>): Promise<boolean>;

  isEmpty(): Promise<boolean>;

  isNotEmpty(): Promise<boolean>;

  mutate(mutator: DataRepositoryMutator<Data>): Promise<void>;

  set(data: Data): Promise<void>;
}

export abstract class OptionalDataRepository<Data> implements DataRepository<Data> {
  protected constructor(
    readonly namespace: DataNamespace,
    private readonly schema: Joi.ObjectSchema<Data>,
    private readonly dataStorage?: DataStorage,
  ) {}

  addChangeListener<OldData = Data>(listener: DataRepositoryChangeListener<Data, OldData>): void {
    this.requireDataSource('addChangeListener').addChangeListener((changes) => {
      const keyChanges = changes[this.namespace];

      if (!isUndefined(keyChanges)) {
        listener(keyChanges as DataStorageChange<Data, OldData>);
      }
    });
  }

  async clear(): Promise<void> {
    return this.requireDataSource('clear').remove(this.namespace);
  }

  get(): Promise<Data> {
    return this.requireDataSource('get').get(this.namespace);
  }

  async getOptional(): Promise<Data | undefined> {
    return this.dataStorage?.getOptional(this.namespace);
  }

  async init(initializer: DataRepositoryInitializer<Data>): Promise<boolean> {
    const data = await this.requireDataSource('init').getOptional<Data>(this.namespace);
    if (!isUndefined(data)) {
      return false;
    }

    await this.set(await initializer());
    return true;
  }

  async isEmpty(): Promise<boolean> {
    return !(await this.requireDataSource('isEmpty').has(this.namespace));
  }

  isNotEmpty(): Promise<boolean> {
    return this.requireDataSource('isNotEmpty').has(this.namespace);
  }

  async mutate(mutator: DataRepositoryMutator<Data>): Promise<void> {
    const data = await this.requireDataSource('mutate').get<Data>(this.namespace);
    await this.set(await mutator(data));
  }

  async set(data: Data): Promise<void> {
    const validData = await validateSchemaAsync(this.schema, data, {
      // TODO: Localise error messages and use ExtensionError instead
      general: (error) => new Error(`Data value is invalid for '${this.namespace}' namespace: ${error?.message}`),
      undefinedValue: () => new Error(`Data value cannot be validated for '${this.namespace}' namespace`),
    });

    await this.requireDataSource('set').set(this.namespace, validData);
  }

  private requireDataSource(method: string): DataStorage {
    if (!this.dataStorage) {
      throw new Error(`Data source is required for '${this.namespace}' namespace to call '${method}'`);
    }

    return this.dataStorage;
  }
}

export abstract class RequiredDataRepository<Data> extends OptionalDataRepository<Data> {
  protected constructor(namespace: DataNamespace, schema: Joi.ObjectSchema<Data>, dataStorage: DataStorage) {
    super(namespace, schema, dataStorage);
  }
}

export type DataRepositoryChangeListener<NT, OT> = (change: DataStorageChange<NT, OT>) => void;

export type DataRepositoryInitializer<Data> = () => Data | Promise<Data>;

export type DataRepositoryMutator<Data> = (data: Data) => Data | Promise<Data>;
