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

  mutate(mutator: DataRepositoryMutator<Data>): Promise<void>;

  set(data: Data): Promise<void>;
}

export abstract class OptionalDataRepository<
  Schema extends z.ZodType,
  Data = z.output<Schema>,
> implements DataRepository<Data> {
  private readonly dataStorage?: DataStorage;
  protected readonly logger?: Logger;
  readonly namespace: DataNamespace;
  private readonly schema: Schema;
  private readonly validationService: ValidationService;

  protected constructor(options: OptionalDataRepositoryOptions<Schema>) {
    this.dataStorage = options.dataStorage;
    this.logger = options.logger;
    this.namespace = options.namespace;
    this.schema = options.schema;
    this.validationService = options.validationService;
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

  async mutate(mutator: DataRepositoryMutator<Data>): Promise<void> {
    const data = await this.requireDataSource('mutate').get<Data>(this.namespace);
    await this.set(await mutator(data));
  }

  async set(data: Data): Promise<void> {
    const validData = this.validationService.validateSchema(data, this.schema, {
      code: 'DAT400000',
      parentLogger: this.logger,
    });

    await this.requireDataSource('set').set(this.namespace, validData);
  }

  private requireDataSource(method: string): DataStorage {
    if (!this.dataStorage) {
      this.logger?.error(`Data source is required for '${this.namespace}' namespace to call '${method}'`);

      throw ExtensionError.from('DAT405000');
    }

    return this.dataStorage;
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

export type DataRepositoryChangeListener<NT, OT> = (change: DataStorageChange<NT, OT>) => void;

export type DataRepositoryInitializer<Data> = () => Data | Promise<Data>;

export type DataRepositoryMutator<Data> = (data: Data) => Data | Promise<Data>;

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
