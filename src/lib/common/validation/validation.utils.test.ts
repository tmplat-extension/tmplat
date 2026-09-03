import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { ExtensionError } from 'extension/common/error/extension-error';
import { isValidSchema, validateSchema } from 'extension/common/validation/validation.utils';
import { createLoggerMock } from 'extension/test/logger.mock';

const Schema = z
  .object({
    enabled: z.boolean(),
    name: z.string(),
  })
  .meta({ id: 'TestSchema' });

describe('isValidSchema', () => {
  it('returns true for valid input', () => {
    expect(isValidSchema({ enabled: true, name: 'a' }, Schema)).toBe(true);
  });

  it.each([
    ['a missing property', { enabled: true }],
    ['a property of the wrong type', { enabled: 'yes', name: 'a' }],
    ['a non-object', 'a'],
    ['null', null],
  ])('returns false for %s', (_label, input) => {
    expect(isValidSchema(input, Schema)).toBe(false);
  });

  it('does not throw for invalid input', () => {
    expect(() => isValidSchema(null, Schema)).not.toThrow();
  });
});

describe('validateSchema', () => {
  it('returns the parsed output for valid input', () => {
    const logger = createLoggerMock();
    const input = { enabled: true, name: 'a' };

    expect(validateSchema(input, Schema, { code: 'ERR422000', logger })).toEqual(input);
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('strips unknown properties, returning the schema output rather than the input', () => {
    const logger = createLoggerMock();

    expect(validateSchema({ enabled: true, extra: 'x', name: 'a' }, Schema, { code: 'ERR422000', logger })).toEqual({
      enabled: true,
      name: 'a',
    });
  });

  it('throws an ExtensionError carrying the supplied code for invalid input', () => {
    const logger = createLoggerMock();

    expect.assertions(2);

    try {
      validateSchema({ enabled: 'yes' }, Schema, { code: 'ERR422000', logger });
    } catch (e) {
      expect(e).toBeInstanceOf(ExtensionError);
      expect((e as ExtensionError).code).toBe('ERR422000');
    }
  });

  it('attaches a field error per issue, prefixed with the parent path', () => {
    const logger = createLoggerMock();

    expect.assertions(1);

    try {
      validateSchema({ enabled: 'yes' }, Schema, { code: 'ERR422000', logger, parentPath: ['settings'] });
    } catch (e) {
      expect((e as ExtensionError).fieldErrors?.map((fieldError) => fieldError.path)).toEqual([
        ['settings', 'enabled'],
        ['settings', 'name'],
      ]);
    }
  });

  it('logs the failure against the schema id', () => {
    const logger = createLoggerMock();

    expect(() => validateSchema(null, Schema, { code: 'ERR422000', logger })).toThrow(ExtensionError);
    expect(logger.error).toHaveBeenCalledOnce();
    expect(logger.error.mock.calls[0][0]).toContain('TestSchema');
  });

  it("logs against an id of 'unknown' for a schema without metadata", () => {
    const logger = createLoggerMock();

    expect(() => validateSchema(null, z.string(), { code: 'ERR422000', logger })).toThrow(ExtensionError);
    expect(logger.error.mock.calls[0][0]).toContain('unknown');
  });

  it('retains the underlying ZodError as the cause', () => {
    const logger = createLoggerMock();

    expect.assertions(1);

    try {
      validateSchema(null, Schema, { code: 'ERR422000', logger });
    } catch (e) {
      expect((e as ExtensionError).cause).toBeInstanceOf(z.ZodError);
    }
  });
});
