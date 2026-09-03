import { createContext, useCallback, useContext } from 'react';
import { type ErrorDetail, type ErrorDetailFallback, resolveErrorDetail } from 'extension/common/error/error-detail';
import { useIntl } from 'extension/common/intl/intl.context';

export const ErrorDetailContext = createContext<ErrorDetailFallback>({});

// The returned callback is memoized because consumers list it in effect dependency arrays. Returning a new closure
// per render made those effects re-run on every render, and an effect that also sets state then re-rendered and
// re-ran itself indefinitely (see `settings-dialog.tsx`).
export const useErrorDetail = (fallbacks?: ErrorDetailFallback): ErrorDetailProvider => {
  const contextualFallbacks = useContext(ErrorDetailContext);
  const intl = useIntl();

  return useCallback(
    (error: unknown, overrideFallbacks?: ErrorDetailFallback): ErrorDetail => {
      // `messageKey` and `substitutions` are taken from the same layer, since substitutions are positional and only
      // make sense for the message they were written for.
      const messageFallbacks = [overrideFallbacks, fallbacks, contextualFallbacks].find(
        (candidate) => candidate?.messageKey,
      );

      return resolveErrorDetail(error, intl, {
        code: overrideFallbacks?.code ?? fallbacks?.code ?? contextualFallbacks.code,
        messageKey: messageFallbacks?.messageKey,
        substitutions: messageFallbacks?.substitutions,
      });
    },
    [contextualFallbacks, fallbacks, intl],
  );
};

export { type ErrorDetail, type ErrorDetailFallback };

export type ErrorDetailProvider = (error: unknown, overrides?: ErrorDetailFallback) => ErrorDetail;
