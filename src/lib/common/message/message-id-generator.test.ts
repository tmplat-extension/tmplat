import { describe, expect, it, vi } from 'vitest';
import { MessageIdGenerator } from 'extension/common/message/message-id-generator';

describe('MessageIdGenerator', () => {
  describe('generate', () => {
    it('returns a freshly generated UUID', () => {
      vi.stubGlobal('crypto', { randomUUID: vi.fn(() => '11111111-1111-4111-8111-111111111111') });

      expect(new MessageIdGenerator().generate()).toBe('11111111-1111-4111-8111-111111111111');
    });

    it('returns a distinct value on each call', () => {
      const generator = new MessageIdGenerator();

      expect(generator.generate()).not.toBe(generator.generate());
    });
  });
});
