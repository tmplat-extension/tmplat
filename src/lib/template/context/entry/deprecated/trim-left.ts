import { TemplateContextName } from 'extension/template/context/template-context-name.enum';
import { type TemplateContextEntryDefinitionAlias } from 'extension/template/context/template-context.model';

export const trimLeft: TemplateContextEntryDefinitionAlias = {
  name: TemplateContextName.TrimLeft,
  aliasOf: TemplateContextName.TrimStart,
  added: '1.0.9',
  deprecated: '2.0.0',
};
