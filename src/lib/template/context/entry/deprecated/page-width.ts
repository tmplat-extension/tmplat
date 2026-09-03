import { TemplateContextName } from 'extension/template/context/template-context-name.enum';
import { type TemplateContextEntryDefinitionAlias } from 'extension/template/context/template-context.model';

export const pageWidth: TemplateContextEntryDefinitionAlias = {
  name: TemplateContextName.PageWidth,
  aliasOf: TemplateContextName.Width,
  added: '1.0.0',
  deprecated: '2.0.0',
};
