import { ExtensionVersion } from 'extension/common/extension-version.enum';
import { TemplateContextCategory } from 'extension/template/context/template-context-category.enum';
import { TemplateContextDataType } from 'extension/template/context/template-context-data-type.enum';
import { TemplateContextName } from 'extension/template/context/template-context-name.enum';
import { TemplateContextEntryDefinition } from 'extension/template/context/template-context.model';
import { createOptionRenderer } from 'extension/template/context/template-context.utils';

export const yourlsSignature: TemplateContextEntryDefinition = {
  name: TemplateContextName.YourlsSignature,
  added: ExtensionVersion.V1_0_0,
  deprecated: ExtensionVersion.V2_0_0,
  categories: {
    [TemplateContextCategory.Standard]: {
      descriptionKey: 'context_deprecated_yourls_signature_standard_description',
      dataType: TemplateContextDataType.String,
      isDeprecatedOption: true,
    },
  },
  render: createOptionRenderer(({ urlShorteners }) => urlShorteners.yourls.auth.signature),
};
