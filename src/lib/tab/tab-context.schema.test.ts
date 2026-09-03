import { describe, expect, it } from 'vitest';
import { ValidationService } from 'extension/common/validation/validation.service';
import { TabContextSchema } from 'extension/tab/tab-context.schema';
import { createLoggingServiceMock } from 'extension/test/logger.mock';
import { createTabContext } from 'extension/test/tab.fake';

const validation = new ValidationService(createLoggingServiceMock() as never);

const parse = (value: unknown) => TabContextSchema.safeParse(value);

describe('TabContextSchema', () => {
  it('accepts a fully-populated context via the real ValidationService', () => {
    const context = createTabContext();

    expect(validation.validateSchema(context, TabContextSchema, 'DAT400000')).toEqual(context);
  });

  it('accepts an optional linkTarget when present', () => {
    const context = createTabContext({ linkTarget: { html: '<a href="/x">x</a>', text: 'x' } });

    expect(parse(context).success).toBe(true);
  });

  it('treats linkTarget as optional when omitted', () => {
    const { linkTarget: _linkTarget, ...withoutLinkTarget } = createTabContext();

    expect(parse(withoutLinkTarget).success).toBe(true);
  });

  it('allows undefined values within the storage records', () => {
    const context = createTabContext({ storage: { local: { a: 'x', b: undefined }, session: {} } });

    expect(parse(context).success).toBe(true);
  });

  it.each([
    ['a missing required field', () => ({ ...createTabContext(), text: undefined })],
    ['a wrong scalar type', () => ({ ...createTabContext(), cookiesEnabled: 'yes' })],
    ['a malformed nested dimension', () => ({ ...createTabContext(), size: { height: 1 } })],
    ['a non-string entry in an array field', () => ({ ...createTabContext(), images: ['ok', 42] })],
    ['a malformed selection', () => ({ ...createTabContext(), selection: { html: '', text: '' } })],
  ])('rejects %s', (_label, build) => {
    expect(parse(build()).success).toBe(false);
  });

  it('rejects invalid data with the supplied error code through ValidationService', () => {
    expect(() => validation.validateSchema({ text: 1 }, TabContextSchema, 'DAT400000')).toThrow(
      expect.objectContaining({ code: 'DAT400000' }),
    );
  });
});
