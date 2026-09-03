import { upperCase as _upperCase } from 'es-toolkit';
import { TemplateContextCategory } from 'extension/template/context/template-context-category.enum';
import { TemplateContextDataType } from 'extension/template/context/template-context-data-type.enum';
import { TemplateContextName } from 'extension/template/context/template-context-name.enum';
import { type TemplateContextEntryDefinition } from 'extension/template/context/template-context.model';
import { createContentRenderer } from 'extension/template/context/template-context.utils';

export const upperCase: TemplateContextEntryDefinition = {
  name: TemplateContextName.UpperCase,
  added: '1.0.9',
  categories: {
    [TemplateContextCategory.Operation]: {
      descriptionKey: 'context_upper_case_operation_description',
      inputDataType: TemplateContextDataType.String,
      outputDataType: TemplateContextDataType.String,
    },
  },
  render: createContentRenderer((content) => _upperCase(content)),
};
