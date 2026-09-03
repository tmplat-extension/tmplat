import { createContext, useContext } from 'react';
import { type TemplateService } from 'extension/template/template.service';

export const TemplatesContext = createContext<TemplateService>({} as TemplateService);

export const useTemplates = (): TemplateService => useContext(TemplatesContext);
