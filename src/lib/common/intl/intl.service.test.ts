import { beforeEach, describe, expect, it, type vi } from 'vitest';
import { IntlService } from 'extension/common/intl/intl.service';
import { TextDirectionEdge } from 'extension/common/intl/text-direction-edge.enum';
import { TextDirection } from 'extension/common/intl/text-direction.enum';
import { getBrowserApiMock } from 'extension/test/browser-api.mock';

type I18nMock = {
  getMessage: ReturnType<typeof vi.fn>;
  getUILanguage: ReturnType<typeof vi.fn>;
  getAcceptLanguages: ReturnType<typeof vi.fn>;
};

const i18nMock = (): I18nMock => {
  const i18n = getBrowserApiMock().i18n as unknown as I18nMock;
  i18n.getAcceptLanguages.mockResolvedValue(['en-GB', 'en']);
  return i18n;
};

describe('IntlService', () => {
  let i18n: I18nMock;
  let service: IntlService;

  beforeEach(() => {
    i18n = i18nMock();
    service = new IntlService();
  });

  describe('getMessage', () => {
    it('localizes via browser.i18n with formatted substitutions', () => {
      i18n.getMessage.mockReturnValue('Hello Sam');

      expect(service.getMessage('changelog_version_heading', 'Sam')).toBe('Hello Sam');
      expect(i18n.getMessage).toHaveBeenCalledWith('changelog_version_heading', ['Sam']);
    });

    it('falls back to a bang-wrapped key when the message is missing', () => {
      i18n.getMessage.mockReturnValue('');

      expect(service.getMessage('changelog_empty')).toBe('!changelog_empty!');
    });
  });

  describe('getTextDirection', () => {
    it('returns the bidi direction reported by the browser', () => {
      i18n.getMessage.mockReturnValue(TextDirection.RightToLeft);

      expect(service.getTextDirection()).toBe(TextDirection.RightToLeft);
    });

    it('caches the direction after the first lookup', () => {
      i18n.getMessage.mockReturnValue(TextDirection.LeftToRight);

      service.getTextDirection();
      service.getTextDirection();

      expect(i18n.getMessage).toHaveBeenCalledTimes(1);
    });

    it('reverses the direction when asked', () => {
      i18n.getMessage.mockReturnValue(TextDirection.LeftToRight);

      expect(service.getTextDirection(true)).toBe(TextDirection.RightToLeft);
    });

    it('throws for an unsupported direction', () => {
      i18n.getMessage.mockReturnValue('sideways');

      expect(() => service.getTextDirection()).toThrow(/Unsupported text direction/);
    });
  });

  describe('text direction edges', () => {
    it('maps LTR to start=left, end=right', () => {
      i18n.getMessage.mockReturnValue(TextDirection.LeftToRight);

      expect(service.getTextDirectionStart()).toBe(TextDirectionEdge.Left);
      expect(service.getTextDirectionEnd()).toBe(TextDirectionEdge.Right);
    });

    it('maps RTL to start=right, end=left', () => {
      i18n.getMessage.mockReturnValue(TextDirection.RightToLeft);

      expect(service.getTextDirectionStart()).toBe(TextDirectionEdge.Right);
      expect(service.getTextDirectionEnd()).toBe(TextDirectionEdge.Left);
    });
  });

  describe('locales', () => {
    it('prefers the accept-languages list', async () => {
      await expect(service.getLocale()).resolves.toBe('en-GB');
      await expect(service.getLocales()).resolves.toEqual(['en-GB', 'en']);
    });

    it('falls back to the UI language when no accept-languages are set', async () => {
      i18n.getAcceptLanguages.mockResolvedValue([]);
      i18n.getUILanguage.mockReturnValue('fr');

      await expect(service.getLocale()).resolves.toBe('fr');
    });

    it('returns a fresh array copy each time', async () => {
      const first = await service.getLocales();
      const second = await service.getLocales();

      expect(first).not.toBe(second);
      expect(first).toEqual(second);
    });
  });
});
