import { ExtensionVersion } from 'extension/common/extension-version.enum';
import { TemplateContextName } from 'extension/template/context/template-context-name.enum';
import { TemplateContextEntryDefinitionAlias } from 'extension/template/context/template-context.model';

export const selectionLinks: TemplateContextEntryDefinitionAlias = {
  name: TemplateContextName.SelectionLinks,
  aliasOf: TemplateContextName.SelectedLinks,
  added: ExtensionVersion.V1_0_0,
  deprecated: ExtensionVersion.V1_0_0,
};
