import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { convertZodErrorToFieldErrors, convertZodIssueToFieldError } from 'extension/common/error/field-error.utils';

const Schema = z.object({
  name: z.string(),
  nested: z.object({
    count: z.number(),
  }),
});

const parseFailure = (input: unknown): z.ZodError => {
  const result = Schema.safeParse(input);
  if (result.success) {
    return expect.unreachable('expected the input to fail validation');
  }

  return result.error;
};

describe('convertZodErrorToFieldErrors', () => {
  it('converts every issue into a field error', () => {
    const fieldErrors = convertZodErrorToFieldErrors(parseFailure({ name: 1, nested: { count: 'x' } }));

    expect(fieldErrors).toHaveLength(2);
    expect(fieldErrors.map((fieldError) => fieldError.path)).toEqual([['name'], ['nested', 'count']]);
    expect(fieldErrors.every((fieldError) => fieldError.type === 'invalid_type')).toBe(true);
    expect(fieldErrors.every((fieldError) => fieldError.message.length > 0)).toBe(true);
  });

  it('prefixes every path with the parent path', () => {
    const fieldErrors = convertZodErrorToFieldErrors(parseFailure({ name: 1, nested: { count: 'x' } }), [
      'templates',
      '0',
    ]);

    expect(fieldErrors.map((fieldError) => fieldError.path)).toEqual([
      ['templates', '0', 'name'],
      ['templates', '0', 'nested', 'count'],
    ]);
  });

  it('stringifies numeric array indexes in the path', () => {
    const arraySchema = z.array(z.string());
    const result = arraySchema.safeParse(['a', 2]);
    if (result.success) {
      expect.unreachable('expected the input to fail validation');
    }

    expect(convertZodErrorToFieldErrors(result.error)[0].path).toEqual(['1']);
  });
});

describe('convertZodIssueToFieldError', () => {
  it('maps message, path and code from the issue', () => {
    const issue = parseFailure({ name: 1, nested: { count: 1 } }).issues[0];

    expect(convertZodIssueToFieldError(issue)).toEqual({
      message: issue.message,
      path: ['name'],
      type: 'invalid_type',
    });
  });

  it("falls back to a type of 'custom' when the issue has no code", () => {
    const issue = { ...parseFailure({ name: 1, nested: { count: 1 } }).issues[0], code: undefined };

    expect(convertZodIssueToFieldError(issue as unknown as z.core.$ZodIssue).type).toBe('custom');
  });
});
