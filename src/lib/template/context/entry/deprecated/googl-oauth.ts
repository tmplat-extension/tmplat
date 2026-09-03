import { TemplateContextName } from 'extension/template/context/template-context-name.enum';
import { type TemplateContextEntryDefinitionAlias } from 'extension/template/context/template-context.model';

export const googlOAuth: TemplateContextEntryDefinitionAlias = {
  name: TemplateContextName.GooglOAuth,
  aliasOf: TemplateContextName.GooglAccount,
  added: '1.0.0',
  deprecated: '1.0.0',
};
