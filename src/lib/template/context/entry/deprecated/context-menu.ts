import { ExtensionVersion } from 'extension/common/extension-version.enum';
import { TemplateContextName } from 'extension/template/context/template-context-name.enum';
import { TemplateContextEntryDefinitionAlias } from 'extension/template/context/template-context.model';

export const contextMenu: TemplateContextEntryDefinitionAlias = {
  name: TemplateContextName.ContextMenu,
  aliasOf: TemplateContextName.Menu,
  added: ExtensionVersion.V1_0_0,
  deprecated: ExtensionVersion.V1_0_0,
};
