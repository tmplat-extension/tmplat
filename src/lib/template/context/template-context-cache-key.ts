import { isString } from 'lodash-es';

export class TemplateContextCacheKeyBuilder {
  private readonly values: TemplateContextCacheKeyValue[] = [];

  constructor(...values: TemplateContextCacheKeyValue[]) {
    this.values.push(...values);
  }

  add(value: TemplateContextCacheKeyValue): TemplateContextCacheKeyBuilder {
    this.values.push(value);

    return this;
  }

  addAll(values: TemplateContextCacheKeyValue[]): TemplateContextCacheKeyBuilder {
    this.values.push(...values);

    return this;
  }

  build(): TemplateContextCacheKey {
    return this.values.map((value) => (isString(value) ? value : value.toString())).join(':');
  }
}

export type TemplateContextCacheKey = string;

export type TemplateContextCacheKeyValue = boolean | number | string | URL;
