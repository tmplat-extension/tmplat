import { TemplateContextCategory } from 'extension/template/context/template-context-category.enum';
import { TemplateContextDataType } from 'extension/template/context/template-context-data-type.enum';
import { TemplateContextName } from 'extension/template/context/template-context-name.enum';
import { type TemplateContextEntryDefinition } from 'extension/template/context/template-context.model';

export const bitlyAccount: TemplateContextEntryDefinition = {
  name: TemplateContextName.BitlyAccount,
  added: '1.0.1',
  deprecated: '2.0.0',
  categories: {
    [TemplateContextCategory.Standard]: {
      descriptionKey: 'entry_standard_bitly_account',
      dataType: TemplateContextDataType.Boolean,
      isDeprecatedOption: true,
    },
  },
  // Bitly support was dropped in 2.0.0, so there is never a connected account. See `bitly` for the rationale.
  render: () => false,
};
