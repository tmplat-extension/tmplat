import { TemplateContextName } from 'extension/template/context/template-context-name.enum';
import { type TemplateContextEntryDefinitionAlias } from 'extension/template/context/template-context.model';

export const selectionLinks: TemplateContextEntryDefinitionAlias = {
  name: TemplateContextName.SelectionLinks,
  aliasOf: TemplateContextName.SelectedLinks,
  added: '1.0.0',
  deprecated: '1.0.0',
};
