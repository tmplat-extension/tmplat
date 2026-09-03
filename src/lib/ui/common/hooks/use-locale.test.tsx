/* oxlint-disable react/jsx-no-constructed-context-values -- Each hook test supplies its own isolated service stub. */
import { renderHook, waitFor } from '@testing-library/react';
import { type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { IntlContext } from 'extension/common/intl/intl.context';
import { type IntlService } from 'extension/common/intl/intl.service';
import { useLocale } from 'extension/ui/common/hooks/use-locale';

function renderUseLocale(getLocale: () => Promise<string>) {
  const intl = { getLocale: vi.fn(getLocale) } as unknown as IntlService;
  const wrapper = ({ children }: { readonly children: ReactNode }) => (
    <IntlContext.Provider value={intl}>{children}</IntlContext.Provider>
  );

  return { ...renderHook(() => useLocale(), { wrapper }), intl };
}

describe('useLocale', () => {
  it('is initially undefined and resolves to the extension locale', async () => {
    const { result } = renderUseLocale(async () => 'fr');

    expect(result.current).toBeUndefined();

    await waitFor(() => expect(result.current).toBe('fr'));
  });

  it('stays undefined when the locale cannot be resolved', async () => {
    const { intl, result } = renderUseLocale(async () => {
      throw new Error('boom');
    });

    await waitFor(() => expect(intl.getLocale).toHaveBeenCalledTimes(1));

    expect(result.current).toBeUndefined();
  });

  /*
   * React no longer warns about state updates on an unmounted component, so this cannot assert on `result.current`
   * (which simply retains its last rendered value either way). Instead it pins that a late resolution is harmless:
   * nothing is logged and no rejection escapes.
   */
  it('ignores a locale that resolves after unmounting', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    let resolve!: (locale: string) => void;
    const { unmount } = renderUseLocale(() => new Promise((done) => (resolve = done)));

    unmount();
    resolve('fr');

    await waitFor(() => expect(consoleError).not.toHaveBeenCalled());
  });
});
