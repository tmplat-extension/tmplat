import { TemplateContextName } from 'extension/template/context/template-context-name.enum';
import { type TemplateContextEntryDefinitionAlias } from 'extension/template/context/template-context.model';

export const originalSource: TemplateContextEntryDefinitionAlias = {
  name: TemplateContextName.OriginalSource,
  aliasOf: TemplateContextName.Url,
  added: '1.0.0',
  deprecated: '1.0.0',
};
