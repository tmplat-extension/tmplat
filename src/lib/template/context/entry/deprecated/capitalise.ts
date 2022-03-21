import { ExtensionVersion } from 'extension/common/extension-version.enum';
import { TemplateContextName } from 'extension/template/context/template-context-name.enum';
import { TemplateContextEntryDefinitionAlias } from 'extension/template/context/template-context.model';

export const capitalise: TemplateContextEntryDefinitionAlias = {
  name: TemplateContextName.Capitalise,
  aliasOf: TemplateContextName.StartCase,
  added: ExtensionVersion.V1_0_9,
  deprecated: ExtensionVersion.V2_0_0,
};
