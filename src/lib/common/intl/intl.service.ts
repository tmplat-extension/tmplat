import { injectable } from 'extension/common/di';
import { IntlMessageKey } from 'extension/common/intl/intl-message-key.enum';

export const IntlServiceToken = Symbol('IntlService');

@injectable()
export class IntlService {
  getMessage(key: IntlMessageKey, substitutions?: string | readonly string[]): string {
    const message = chrome.i18n.getMessage(key, substitutions as string | string[]);
    if (message == null) {
      throw new Error(`Message not found with key: '${key}'`);
    }

    return message;
  }

  getLocale(): string {
    return chrome.i18n.getUILanguage();
  }

  getLocales(): Promise<string[]> {
    return new Promise((resolve, reject) => {
      chrome.i18n.getAcceptLanguages((languages) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(languages);
        }
      });
    });
  }
}
