import { createContext, useCallback, useContext } from 'react';
import { ExtensionError } from 'extension/common/error/extension-error';
import { type IntlMessageKey } from 'extension/common/intl/intl-message-key';
import { useIntl } from 'extension/common/intl/intl.context';

export const ErrorMessageContext = createContext<IntlMessageKey>('error_snackbar_unknown_message');

// The returned callback is memoized because consumers list it in effect dependency arrays. Returning a new closure
// per render made those effects re-run on every render, and an effect that also sets state then re-rendered and
// re-ran itself indefinitely (see `settings-dialog.tsx`).
export const useErrorMessage = (fallbackKey?: IntlMessageKey): ErrorMessageProvider => {
  const contextFallbackKey = useContext(ErrorMessageContext);
  const intl = useIntl();

  return useCallback(
    (error: unknown, overrideFallbackKey?: IntlMessageKey): string => {
      if (error instanceof ExtensionError) {
        return error.message;
      }

      return intl.getMessage(overrideFallbackKey ?? fallbackKey ?? contextFallbackKey);
    },
    [contextFallbackKey, fallbackKey, intl],
  );
};

export type ErrorMessageProvider = (error: unknown, fallbackKey?: IntlMessageKey) => string;
