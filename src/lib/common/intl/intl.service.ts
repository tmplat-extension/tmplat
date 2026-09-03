import { injectable } from 'extension/common/di';
import { IntlMessageKey } from 'extension/common/intl/intl-message-key';
import { Substitution } from 'extension/common/intl/intl.model';
import { TextDirectionEdge } from 'extension/common/intl/text-direction-edge.enum';
import { TextDirection } from 'extension/common/intl/text-direction.enum';

export const IntlServiceToken = Symbol('IntlService');

@injectable()
export class IntlService {
  private cachedLocales: [string, ...string[]] | undefined;
  private cachedTextDirection: TextDirection | undefined;

  async getLocale(): Promise<string> {
    const [locale] = await this.getCachedLocales();
    return locale;
  }

  async getLocales(): Promise<[string, ...string[]]> {
    const locales = await this.getCachedLocales();
    return [...locales];
  }

  getMessage(key: IntlMessageKey, ...substitutions: Substitution[]): string {
    return browser.i18n.getMessage(key, IntlService.formatSubstitutions(substitutions)) || `!${key}!`;
  }

  getTextDirection(reverse?: boolean): TextDirection {
    if (!this.cachedTextDirection) {
      const direction = browser.i18n.getMessage('@@bidi_dir');
      if (direction === TextDirection.LeftToRight || direction === TextDirection.RightToLeft) {
        this.cachedTextDirection = direction;
      } else {
        throw new Error(`Unsupported text direction: '${direction}'`);
      }
    }

    if (reverse) {
      return this.cachedTextDirection === TextDirection.LeftToRight
        ? TextDirection.RightToLeft
        : TextDirection.LeftToRight;
    }

    return this.cachedTextDirection!;
  }

  getTextDirectionEnd(): TextDirectionEdge {
    const direction = this.getTextDirection();
    return direction === TextDirection.LeftToRight ? TextDirectionEdge.Right : TextDirectionEdge.Left;
  }

  getTextDirectionStart(): TextDirectionEdge {
    const direction = this.getTextDirection();
    return direction === TextDirection.LeftToRight ? TextDirectionEdge.Left : TextDirectionEdge.Right;
  }

  private async getCachedLocales(): Promise<[string, ...string[]]> {
    if (!this.cachedLocales) {
      const preferredLocales = await browser.i18n.getAcceptLanguages();
      if (preferredLocales.length > 0) {
        this.cachedLocales = preferredLocales as [string, ...string[]];
      } else {
        this.cachedLocales = [browser.i18n.getUILanguage()];
      }
    }

    return [...this.cachedLocales];
  }

  private static formatSubstitutions(substitutions: Substitution[]): string[] {
    return substitutions.map((substitution) => {
      switch (typeof substitution) {
        case 'string':
          return substitution;
        case 'boolean':
          return substitution ? 'true' : 'false';
        case 'bigint':
        case 'number':
          return substitution.toString();
        default:
          throw new Error(`Unsupported substitution type: '${typeof substitution}'`);
      }
    });
  }
}
