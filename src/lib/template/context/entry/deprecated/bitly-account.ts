import { TemplateContextCategory } from 'extension/template/context/template-context-category.enum';
import { TemplateContextDataType } from 'extension/template/context/template-context-data-type.enum';
import { TemplateContextName } from 'extension/template/context/template-context-name.enum';
import { type TemplateContextEntryDefinition } from 'extension/template/context/template-context.model';
import { createOptionRenderer } from 'extension/template/context/template-context.utils';

export const bitlyAccount: TemplateContextEntryDefinition = {
  name: TemplateContextName.BitlyAccount,
  added: '1.0.1',
  deprecated: '2.0.0',
  categories: {
    [TemplateContextCategory.Standard]: {
      descriptionKey: 'context_deprecated_bitly_account_standard_description',
      dataType: TemplateContextDataType.Boolean,
      isDeprecatedOption: true,
    },
  },
  render: createOptionRenderer(({ urlShorteners }) => urlShorteners.bitly.auth.authenticated),
};
