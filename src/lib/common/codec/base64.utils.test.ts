import { describe, expect, it } from 'vitest';
import { decodeBase64, decodeBase64Utf8, encodeBase64, encodeBase64Utf8 } from 'extension/common/codec/base64.utils';

describe('decodeBase64', () => {
  it('decodes a Latin-1 base64 string', () => {
    expect(decodeBase64('dG1wbGF0')).toBe('tmplat');
  });

  it.each([
    ['null', null],
    ['an empty string', ''],
  ])('returns an empty string when given %s', (_label, input) => {
    expect(decodeBase64(input)).toBe('');
  });
});

describe('encodeBase64', () => {
  it('encodes a Latin-1 string', () => {
    expect(encodeBase64('tmplat')).toBe('dG1wbGF0');
  });

  it.each([
    ['null', null],
    ['an empty string', ''],
  ])('returns an empty string when given %s', (_label, input) => {
    expect(encodeBase64(input)).toBe('');
  });

  it('throws for characters outside the Latin-1 range', () => {
    expect(() => encodeBase64('😀')).toThrow();
  });
});

describe('encodeBase64Utf8', () => {
  it('encodes a Latin-1 string identically to encodeBase64', () => {
    expect(encodeBase64Utf8('tmplat')).toBe(encodeBase64('tmplat'));
  });

  it.each([
    ['null', null],
    ['an empty string', ''],
  ])('returns an empty string when given %s', (_label, input) => {
    expect(encodeBase64Utf8(input)).toBe('');
  });

  it.each(['😀', 'ünïcödé', '日本語', 'a\u0000b'])('encodes %s without throwing', (input) => {
    expect(() => encodeBase64Utf8(input)).not.toThrow();
  });
});

describe('decodeBase64Utf8', () => {
  it.each([
    ['null', null],
    ['an empty string', ''],
  ])('returns an empty string when given %s', (_label, input) => {
    expect(decodeBase64Utf8(input)).toBe('');
  });

  it.each(['tmplat', '😀', 'ünïcödé', '日本語', 'a\u0000b', '{name} — {url}'])(
    'round-trips %s through encodeBase64Utf8',
    (input) => {
      expect(decodeBase64Utf8(encodeBase64Utf8(input))).toBe(input);
    },
  );
});
