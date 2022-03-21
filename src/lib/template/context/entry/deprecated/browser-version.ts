import { ExtensionVersion } from 'extension/common/extension-version.enum';
import { TemplateContextName } from 'extension/template/context/template-context-name.enum';
import { TemplateContextEntryDefinitionAlias } from 'extension/template/context/template-context.model';

export const browserVersion: TemplateContextEntryDefinitionAlias = {
  name: TemplateContextName.BrowserVersion,
  aliasOf: TemplateContextName.BrowserFullVersion,
  added: ExtensionVersion.V1_0_0,
  deprecated: ExtensionVersion.V2_0_0,
};
