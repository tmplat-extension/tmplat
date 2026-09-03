import { TemplateContextName } from 'extension/template/context/template-context-name.enum';
import { type TemplateContextEntryDefinitionAlias } from 'extension/template/context/template-context.model';

export const toolbarFeatureDetails: TemplateContextEntryDefinitionAlias = {
  name: TemplateContextName.ToolbarFeatureDetails,
  aliasOf: TemplateContextName.ToolbarStyle,
  added: '1.0.0',
  deprecated: '1.0.0',
};
