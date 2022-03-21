import { createContext, useContext } from 'react';

import { IntlService } from 'extension/common/intl/intl.service';

export const IntlContext = createContext<IntlService>({} as IntlService);

export function useIntl(): IntlService {
  return useContext(IntlContext);
}
