import Joi from 'joi';

import { DataNamespace } from 'extension/common/data/data-namespace.enum';
import { DataStorage, DataStorageChange } from 'extension/common/data/data-storage';
import { validateSchemaAsync } from 'extension/common/validation.utils';

export abstract class DataRepository<D> {
  protected constructor(
    readonly namespace: DataNamespace,
    readonly schema: Joi.ObjectSchema<D>,
    private readonly dataStorage: DataStorage,
  ) {}

  addChangeListener(listener: DataRepositoryChangeListener<D>) {
    this.dataStorage.addChangeListener((changes) => {
      const keyChanges = changes[this.namespace];

      if (keyChanges) {
        listener(keyChanges);
      }
    });
  }

  get(): Promise<D> {
    return this.dataStorage.get(this.namespace);
  }

  async isEmpty(): Promise<boolean> {
    return (await this.get()) == null;
  }

  async isNotEmpty(): Promise<boolean> {
    return !(await this.isEmpty());
  }

  async modify(modifier: (data: D) => D | Promise<D>): Promise<void> {
    const data = await this.dataStorage.get(this.namespace);
    await this.set(await modifier(data));
  }

  async set(data: D): Promise<void> {
    const validData = await validateSchemaAsync(this.schema, data, {
      // TODO: Localise error messages and use ExtensionError instead?
      general: (error) => new Error(`Data value is invalid for '${this.namespace}' namespace: ${error?.message}`),
      undefinedValue: () => new Error(`Data value cannot be validated for '${this.namespace}' namespace`),
    });

    await this.dataStorage.set(this.namespace, validData);
  }
}

export type DataRepositoryChangeListener<T> = (change: DataStorageChange<T>) => void;
