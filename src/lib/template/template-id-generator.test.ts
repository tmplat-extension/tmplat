import { describe, expect, it, vi } from 'vitest';
import { TemplateIdGenerator } from 'extension/template/template-id-generator';

describe('TemplateIdGenerator', () => {
  describe('generate', () => {
    it('returns a freshly generated UUID when no exclusions are provided', () => {
      vi.stubGlobal('crypto', { randomUUID: vi.fn(() => '11111111-1111-4111-8111-111111111111') });

      expect(new TemplateIdGenerator().generate()).toBe('11111111-1111-4111-8111-111111111111');
    });

    it('returns a distinct value on each call when no exclusions are provided', () => {
      const generator = new TemplateIdGenerator();

      expect(generator.generate()).not.toBe(generator.generate());
    });

    it('returns a freshly generated UUID when it is not contained within exclusions', () => {
      vi.stubGlobal('crypto', { randomUUID: vi.fn(() => '11111111-1111-4111-8111-111111111111') });

      expect(new TemplateIdGenerator().generate(new Set(['22222222-2222-4222-8222-222222222222']))).toBe(
        '11111111-1111-4111-8111-111111111111',
      );
    });

    it('regenerates the UUID until it is not contained within exclusions', () => {
      const randomUUID = vi
        .fn()
        .mockReturnValueOnce('11111111-1111-4111-8111-111111111111')
        .mockReturnValueOnce('22222222-2222-4222-8222-222222222222')
        .mockReturnValueOnce('33333333-3333-4333-8333-333333333333');
      vi.stubGlobal('crypto', { randomUUID });

      const exclusions = new Set(['11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222']);

      expect(new TemplateIdGenerator().generate(exclusions)).toBe('33333333-3333-4333-8333-333333333333');
      expect(randomUUID).toHaveBeenCalledTimes(3);
    });

    it('returns a distinct value on each call when exclusions are provided', () => {
      const generator = new TemplateIdGenerator();
      const exclusions = new Set<string>();

      const first = generator.generate(exclusions);
      exclusions.add(first);
      const second = generator.generate(exclusions);

      expect(second).not.toBe(first);
    });
  });
});
