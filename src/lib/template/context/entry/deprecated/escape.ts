import { TemplateContextName } from 'extension/template/context/template-context-name.enum';
import { type TemplateContextEntryDefinitionAlias } from 'extension/template/context/template-context.model';

export const escape: TemplateContextEntryDefinitionAlias = {
  name: TemplateContextName.Escape,
  aliasOf: TemplateContextName.EscapeHtml,
  added: '1.2.1',
  deprecated: '2.0.0',
};
