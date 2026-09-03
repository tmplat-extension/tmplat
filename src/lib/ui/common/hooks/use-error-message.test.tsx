/* oxlint-disable react/jsx-no-constructed-context-values -- Each hook test supplies its own isolated service stub. */
import { renderHook } from '@testing-library/react';
import { type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { ExtensionError } from 'extension/common/error/extension-error';
import { IntlContext } from 'extension/common/intl/intl.context';
import { type IntlService } from 'extension/common/intl/intl.service';
import { ErrorMessageContext, useErrorMessage } from 'extension/ui/common/hooks/use-error-message';

function renderUseErrorMessage(fallbackKey?: Parameters<typeof useErrorMessage>[0]) {
  const intl = {
    getMessage: vi.fn((key: string) => `localized:${key}`),
  } as unknown as IntlService;

  const wrapper = ({ children }: { readonly children: ReactNode }) => (
    <IntlContext.Provider value={intl}>
      <ErrorMessageContext.Provider value={'error_snackbar_unknown_message'}>{children}</ErrorMessageContext.Provider>
    </IntlContext.Provider>
  );

  return { ...renderHook(() => useErrorMessage(fallbackKey), { wrapper }), intl };
}

describe('useErrorMessage', () => {
  it('returns the message from an ExtensionError without localizing a fallback', () => {
    const { intl, result } = renderUseErrorMessage('popup_error');
    const error = ExtensionError.from('ERR500000');

    expect(result.current(error, 'popup_open_options_error')).toBe(error.message);
    expect(intl.getMessage).not.toHaveBeenCalled();
  });

  it('localizes an override fallback for non-extension errors first', () => {
    const { intl, result } = renderUseErrorMessage('popup_error');

    expect(result.current(new Error('Boom'), 'popup_open_options_error')).toBe('localized:popup_open_options_error');
    expect(intl.getMessage).toHaveBeenCalledWith('popup_open_options_error');
  });

  it('localizes the hook fallback when no override is provided', () => {
    const { intl, result } = renderUseErrorMessage('popup_error');

    expect(result.current('not an extension error')).toBe('localized:popup_error');
    expect(intl.getMessage).toHaveBeenCalledWith('popup_error');
  });

  it('localizes the context fallback when no override or hook fallback is provided', () => {
    const { intl, result } = renderUseErrorMessage();

    expect(result.current(undefined)).toBe('localized:error_snackbar_unknown_message');
    expect(intl.getMessage).toHaveBeenCalledWith('error_snackbar_unknown_message');
  });
});
