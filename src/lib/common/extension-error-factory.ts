import { injectable } from 'inversify';
import { inject } from 'extension/common/di';
import { ExtensionError } from 'extension/common/extension-error';
import { IntlMessageKey } from 'extension/common/intl/intl-message-key';
import { IntlService, IntlServiceToken } from 'extension/common/intl/intl.service';

export const ExtensionErrorFactoryToken = Symbol('ExtensionErrorFactory');

@injectable()
export class ExtensionErrorFactory {
  readonly #intl: IntlService;

  constructor(@inject(IntlServiceToken) intl: IntlService) {
    this.#intl = intl;
  }

  create(message: string): ExtensionError {
    return new ExtensionError(message);
  }

  intl(key: IntlMessageKey, ...substitutions: string[]): ExtensionError {
    return new ExtensionError(this.#intl.getMessage(key, ...substitutions));
  }
}
