import { createContext, useContext } from 'react';
import { type IntlService } from 'extension/common/intl/intl.service';

export const IntlContext = createContext<IntlService>({} as IntlService);

export const useIntl = (): IntlService => useContext(IntlContext);
