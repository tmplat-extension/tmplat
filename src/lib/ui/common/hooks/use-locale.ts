import { useEffect, useState } from 'react';
import { useIntl } from 'extension/common/intl/intl.context';

/**
 * Resolves the user's extension UI locale so that dates, numbers and anything else formatted by the UI follow the
 * same language as the messages around them.
 *
 * `IntlService.getLocale` is asynchronous, so this is `undefined` on the first render. Consumers are expected to
 * treat that as "not known yet" and let the formatting library apply its own default, rather than guessing at a
 * locale that would then change once this resolves.
 */
export function useLocale(): string | undefined {
  const intl = useIntl();
  const [locale, setLocale] = useState<string>();

  useEffect(() => {
    let cancelled = false;

    intl
      .getLocale()
      .then((resolved) => {
        if (!cancelled) {
          setLocale(resolved);
        }
      })
      // A locale that cannot be resolved is not worth surfacing to the user: formatting still works, it just falls
      // back to the runtime default.
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [intl]);

  return locale;
}
