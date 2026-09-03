import { lowerCase as _lowerCase } from 'es-toolkit';
import { TemplateContextCategory } from 'extension/template/context/template-context-category.enum';
import { TemplateContextDataType } from 'extension/template/context/template-context-data-type.enum';
import { TemplateContextName } from 'extension/template/context/template-context-name.enum';
import { type TemplateContextEntryDefinition } from 'extension/template/context/template-context.model';
import { createContentRenderer } from 'extension/template/context/template-context.utils';

export const lowerCase: TemplateContextEntryDefinition = {
  name: TemplateContextName.LowerCase,
  added: '1.0.9',
  categories: {
    [TemplateContextCategory.Operation]: {
      descriptionKey: 'context_lower_case_operation_description',
      inputDataType: TemplateContextDataType.String,
      outputDataType: TemplateContextDataType.String,
    },
  },
  render: createContentRenderer((content) => _lowerCase(content)),
};
