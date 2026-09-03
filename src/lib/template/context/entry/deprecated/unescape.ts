import { TemplateContextName } from 'extension/template/context/template-context-name.enum';
import { type TemplateContextEntryDefinitionAlias } from 'extension/template/context/template-context.model';

export const unescape: TemplateContextEntryDefinitionAlias = {
  name: TemplateContextName.Unescape,
  aliasOf: TemplateContextName.UnescapeHtml,
  added: '1.2.1',
  deprecated: '2.0.0',
};
