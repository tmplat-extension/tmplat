import { ExtensionVersion } from 'extension/common/extension-version.enum';
import { TemplateContextName } from 'extension/template/context/template-context-name.enum';
import { TemplateContextEntryDefinitionAlias } from 'extension/template/context/template-context.model';

export const trimLeft: TemplateContextEntryDefinitionAlias = {
  name: TemplateContextName.TrimLeft,
  aliasOf: TemplateContextName.TrimStart,
  added: ExtensionVersion.V1_0_9,
  deprecated: ExtensionVersion.V2_0_0,
};
