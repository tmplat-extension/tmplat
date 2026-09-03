import { TemplateContextName } from 'extension/template/context/template-context-name.enum';
import { type TemplateContextEntryDefinitionAlias } from 'extension/template/context/template-context.model';

export const toolbarFeatureName: TemplateContextEntryDefinitionAlias = {
  name: TemplateContextName.ToolbarFeatureName,
  aliasOf: TemplateContextName.ToolbarKey,
  added: '1.0.0',
  deprecated: '1.0.0',
};
