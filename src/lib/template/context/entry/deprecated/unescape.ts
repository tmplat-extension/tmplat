import { ExtensionVersion } from 'extension/common/extension-version.enum';
import { TemplateContextName } from 'extension/template/context/template-context-name.enum';
import { TemplateContextEntryDefinitionAlias } from 'extension/template/context/template-context.model';

export const unescape: TemplateContextEntryDefinitionAlias = {
  name: TemplateContextName.Unescape,
  aliasOf: TemplateContextName.UnescapeHtml,
  added: ExtensionVersion.V1_2_1,
  deprecated: ExtensionVersion.V2_0_0,
};