import { describe, expect, it } from 'vitest';
import { localizeMessage } from 'extension/common/intl/i18n.utils';
import { getBrowserApiMock } from 'extension/test/browser-api.mock';

describe('localizeMessage', () => {
  it('returns the localized message for the key', () => {
    getBrowserApiMock().i18n.getMessage.mockReturnValue('Copied!');

    expect(localizeMessage('copy_success', [])).toBe('Copied!');
  });

  it('passes the key and formatted substitutions through to the i18n API', () => {
    const { i18n } = getBrowserApiMock();
    i18n.getMessage.mockReturnValue('ok');

    localizeMessage('some_key', ['a', 1, true, 2n]);

    expect(i18n.getMessage).toHaveBeenCalledWith('some_key', ['a', '1', 'true', '2']);
  });

  it.each([
    ['a false boolean', false, 'false'],
    ['a negative number', -1, '-1'],
    ['a fractional number', 1.5, '1.5'],
  ])('formats %s substitution as %j', (_label, substitution, expected) => {
    const { i18n } = getBrowserApiMock();
    i18n.getMessage.mockReturnValue('ok');

    localizeMessage('some_key', [substitution]);

    expect(i18n.getMessage).toHaveBeenCalledWith('some_key', [expected]);
  });

  it('throws for an unsupported substitution type', () => {
    expect(() => localizeMessage('some_key', [{} as unknown as string])).toThrow(
      "Unsupported substitution type: 'object'",
    );
  });

  describe('when the message is missing', () => {
    it('falls back to the bang-wrapped key by default', () => {
      getBrowserApiMock().i18n.getMessage.mockReturnValue('');

      expect(localizeMessage('missing_key', [])).toBe('!missing_key!');
    });

    it('uses a string default message when supplied', () => {
      getBrowserApiMock().i18n.getMessage.mockReturnValue('');

      expect(localizeMessage('missing_key', [], 'Fallback')).toBe('Fallback');
    });

    it('invokes a function default message with the key', () => {
      getBrowserApiMock().i18n.getMessage.mockReturnValue('');

      expect(localizeMessage('missing_key', [], (key) => `<${key}>`)).toBe('<missing_key>');
    });
  });
});
