import { ExtensionVersion } from 'extension/common/extension-version.enum';
import { TemplateContextCategory } from 'extension/template/context/template-context-category.enum';
import { TemplateContextDataType } from 'extension/template/context/template-context-data-type.enum';
import { TemplateContextName } from 'extension/template/context/template-context-name.enum';
import { TemplateContextEntryDefinition } from 'extension/template/context/template-context.model';

export const googlAccount: TemplateContextEntryDefinition = {
  name: TemplateContextName.GooglAccount,
  added: ExtensionVersion.V1_0_0,
  deprecated: ExtensionVersion.V2_0_0,
  categories: {
    [TemplateContextCategory.Standard]: {
      descriptionKey: 'context_deprecated_googl_account_standard_description',
      dataType: TemplateContextDataType.Boolean,
      isDeprecatedOption: true,
    },
  },
  render: () => false,
};
