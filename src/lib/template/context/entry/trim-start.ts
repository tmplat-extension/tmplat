import { TemplateContextCategory } from 'extension/template/context/template-context-category.enum';
import { TemplateContextDataType } from 'extension/template/context/template-context-data-type.enum';
import { TemplateContextName } from 'extension/template/context/template-context-name.enum';
import { type TemplateContextEntryDefinition } from 'extension/template/context/template-context.model';

export const trimStart: TemplateContextEntryDefinition = {
  name: TemplateContextName.TrimStart,
  added: '2.0.0',
  categories: {
    [TemplateContextCategory.Operation]: {
      descriptionKey: 'context_trim_start_operation_description',
      inputDataType: TemplateContextDataType.String,
      outputDataType: TemplateContextDataType.String,
    },
  },
  render: (manager) => {
    return () => {
      return (text, render) => manager.renderTrimStart(text, render);
    };
  },
};
