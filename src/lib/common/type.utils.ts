import _isPlainObject from 'lodash.isplainobject';

export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

export function isFunction(value: unknown): value is (...args: unknown[]) => unknown {
  return typeof value === 'function';
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number';
}

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return _isPlainObject(value);
}

export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function isUndefined(value: unknown): value is undefined {
  return typeof value === 'undefined';
}
