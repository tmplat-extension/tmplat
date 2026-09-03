import { TemplateContextName } from 'extension/template/context/template-context-name.enum';
import { type TemplateContextEntryDefinitionAlias } from 'extension/template/context/template-context.model';

export const trimRight: TemplateContextEntryDefinitionAlias = {
  name: TemplateContextName.TrimRight,
  aliasOf: TemplateContextName.TrimEnd,
  added: '1.0.9',
  deprecated: '2.0.0',
};
