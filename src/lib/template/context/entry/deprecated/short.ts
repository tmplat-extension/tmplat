import { TemplateContextName } from 'extension/template/context/template-context-name.enum';
import { type TemplateContextEntryDefinitionAlias } from 'extension/template/context/template-context.model';

export const short: TemplateContextEntryDefinitionAlias = {
  name: TemplateContextName.Short,
  aliasOf: TemplateContextName.Shorten,
  added: '1.0.0',
  deprecated: '1.0.0',
};
