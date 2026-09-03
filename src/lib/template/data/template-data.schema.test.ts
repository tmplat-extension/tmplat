import { describe, expect, it } from 'vitest';
import { normalizeTemplateShortcut, TemplateShortcutStringSchema } from 'extension/template/data/template-data.schema';

describe('normalizeTemplateShortcut', () => {
  it.each([
    ['an already canonical shortcut', 'U', 'U'],
    ['a digit', '9', '9'],
    ['a lower-case shortcut', 'u', 'U'],
    ['a shortcut surrounded by whitespace', ' u ', 'U'],
  ])('preserves %s', (_label, value, expected) => {
    expect(normalizeTemplateShortcut(value)).toBe(expected);
  });

  it.each([
    ['more than one character', 'ab'],
    ['not alphanumeric', '!'],
    ['whitespace only', '  '],
    ['empty', ''],
    ['null', null],
    ['undefined', undefined],
  ])('returns null for a shortcut that is %s', (_label, value) => {
    expect(normalizeTemplateShortcut(value)).toBeNull();
  });

  it('only ever returns a value the strict schema accepts', () => {
    const values = ['U', 'u', ' u ', '9', 'ab', '!', '', '  ', null, undefined];

    for (const value of values) {
      const normalized = normalizeTemplateShortcut(value);

      if (normalized !== null) {
        expect(TemplateShortcutStringSchema.safeParse(normalized).success).toBe(true);
      }
    }
  });
});
