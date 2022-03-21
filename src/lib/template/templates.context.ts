import { createContext, useContext } from 'react';

import { TemplateService } from 'extension/template/template.service';

export const TemplatesContext = createContext<TemplateService>({} as TemplateService);

export function useTemplates(): TemplateService {
  return useContext(TemplatesContext);
}
