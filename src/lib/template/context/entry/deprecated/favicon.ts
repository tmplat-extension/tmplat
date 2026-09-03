import { ExtensionVersion } from 'extension/common/extension-version.enum';
import { TemplateContextName } from 'extension/template/context/template-context-name.enum';
import { TemplateContextEntryDefinitionAlias } from 'extension/template/context/template-context.model';

export const favicon: TemplateContextEntryDefinitionAlias = {
  name: TemplateContextName.Favicon,
  aliasOf: TemplateContextName.FaviconUrl,
  added: ExtensionVersion.V1_0_0,
  deprecated: ExtensionVersion.V2_0_0,
};
