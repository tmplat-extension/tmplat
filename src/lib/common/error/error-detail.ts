import { ExtensionError } from 'extension/common/error/extension-error';
import { type ExtensionErrorCode } from 'extension/common/error/extension-error-code';
import { type IntlMessageKey } from 'extension/common/intl/intl-message-key';
import { type Substitutions } from 'extension/common/intl/intl.model';
import { type IntlService } from 'extension/common/intl/intl.service';

export const DEFAULT_ERROR_DETAIL_CODE: ExtensionErrorCode = 'ERR500000';
export const DEFAULT_ERROR_DETAIL_MESSAGE_KEY: IntlMessageKey = 'xerr_err500000';

/**
 * Reduces an arbitrary thrown value to the code, message and (where available) stack that should be shown to the
 * user, so that every surface - the error snackbar, desktop notifications, etc. - describes the same failure in the
 * same terms.
 *
 * An {@link ExtensionError} already carries a localized message and a code, so it is used verbatim. Anything else is
 * opaque (it could be a `TypeError`, a rejected DOM promise or a non-`Error` value entirely) and its message is never
 * localized nor safe to show, so `fallback` supplies what the user sees instead.
 */
export const resolveErrorDetail = (
  error: unknown,
  intl: Pick<IntlService, 'getMessage'>,
  fallback: ErrorDetailFallback = {},
): ErrorDetail => {
  if (error instanceof ExtensionError) {
    return {
      code: error.code,
      message: error.message,
      stack: error.stack,
    };
  }

  return {
    code: fallback.code ?? DEFAULT_ERROR_DETAIL_CODE,
    message: intl.getMessage(
      fallback.messageKey ?? DEFAULT_ERROR_DETAIL_MESSAGE_KEY,
      ...(fallback.substitutions ?? []),
    ),
    stack: error instanceof Error ? error.stack : undefined,
  };
};

export type ErrorDetail = {
  code: ExtensionErrorCode;
  message: string;
  stack?: string;
};

/**
 * Describes a failure that could not describe itself. `substitutions` belong to `messageKey` and are only ever
 * applied alongside it.
 */
export type ErrorDetailFallback = {
  code?: ExtensionErrorCode;
  messageKey?: IntlMessageKey;
  substitutions?: Substitutions;
};
