import { TemplateContextCategory } from 'extension/template/context/template-context-category.enum';
import { TemplateContextDataType } from 'extension/template/context/template-context-data-type.enum';
import { TemplateContextName } from 'extension/template/context/template-context-name.enum';
import { type TemplateContextEntryDefinition } from 'extension/template/context/template-context.model';

/** Always empty; template usage statistics are no longer tracked. */
export const popular: TemplateContextEntryDefinition = {
  name: TemplateContextName.Popular,
  added: '1.0.0',
  deprecated: '2.0.0',
  categories: {
    [TemplateContextCategory.Collection]: {
      descriptionKey: 'context_deprecated_popular_collection_description',
      dataType: TemplateContextDataType.Object,
      valueDataType: TemplateContextDataType.String,
    },
  },
  render: () => null,
};
