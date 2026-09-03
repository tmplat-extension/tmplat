import { TemplateContextCategory } from 'extension/template/context/template-context-category.enum';
import { TemplateContextDataType } from 'extension/template/context/template-context-data-type.enum';
import { TemplateContextName } from 'extension/template/context/template-context-name.enum';
import { type TemplateContextEntryDefinition } from 'extension/template/context/template-context.model';
import { createContentRenderer } from 'extension/template/context/template-context.utils';

export const length: TemplateContextEntryDefinition = {
  name: TemplateContextName.Length,
  added: '1.0.9',
  categories: {
    [TemplateContextCategory.Operation]: {
      descriptionKey: 'context_length_operation_description',
      inputDataType: TemplateContextDataType.String,
      outputDataType: TemplateContextDataType.Number,
    },
  },
  render: createContentRenderer((content) => content.length),
};
