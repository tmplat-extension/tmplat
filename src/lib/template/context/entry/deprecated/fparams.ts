import { TemplateContextName } from 'extension/template/context/template-context-name.enum';
import { type TemplateContextEntryDefinitionAlias } from 'extension/template/context/template-context.model';

export const fparams: TemplateContextEntryDefinitionAlias = {
  name: TemplateContextName.Fparams,
  aliasOf: TemplateContextName.HashSearchParams,
  added: '1.0.0',
  deprecated: '2.0.0',
};
