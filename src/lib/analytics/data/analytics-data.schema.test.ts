import { describe, expect, it } from 'vitest';
import { AnalyticsDataSchema } from 'extension/analytics/data/analytics-data.schema';
import { ValidationService } from 'extension/common/validation/validation.service';
import { createLoggingServiceMock } from 'extension/test/logger.mock';

const validation = new ValidationService(createLoggingServiceMock() as never);
const VALID = { clientId: '11111111-1111-4111-8111-111111111111', enabled: true };

describe('AnalyticsDataSchema', () => {
  it('accepts a valid analytics data object', () => {
    expect(validation.validateSchema(VALID, AnalyticsDataSchema, 'DAT400000')).toEqual(VALID);
  });

  it.each([
    ['a non-uuid client id', { ...VALID, clientId: 'not-a-uuid' }],
    ['a missing client id', { enabled: true }],
    ['a non-boolean enabled flag', { ...VALID, enabled: 'yes' }],
    ['a missing enabled flag', { clientId: VALID.clientId }],
  ])('rejects %s', (_label, value) => {
    expect(AnalyticsDataSchema.safeParse(value).success).toBe(false);
  });
});
