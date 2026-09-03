import { TemplateContextCategory } from 'extension/template/context/template-context-category.enum';
import { TemplateContextDataType } from 'extension/template/context/template-context-data-type.enum';
import { TemplateContextName } from 'extension/template/context/template-context-name.enum';
import { type TemplateContextEntryDefinition } from 'extension/template/context/template-context.model';

export const bitly: TemplateContextEntryDefinition = {
  name: TemplateContextName.Bitly,
  added: '1.0.0',
  deprecated: '2.0.0',
  categories: {
    [TemplateContextCategory.Standard]: {
      descriptionKey: 'entry_standard_bitly',
      dataType: TemplateContextDataType.Boolean,
      isDeprecatedOption: true,
    },
  },
  // Bitly support was dropped in 2.0.0, so this always renders false - the same treatment `googl` gets for a
  // service that no longer exists. The entry is kept so 1.x templates referencing it still render.
  render: () => false,
};
