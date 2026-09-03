import { TemplateContextCategory } from 'extension/template/context/template-context-category.enum';
import { TemplateContextDataType } from 'extension/template/context/template-context-data-type.enum';
import { TemplateContextName } from 'extension/template/context/template-context-name.enum';
import { type TemplateContextEntryDefinition } from 'extension/template/context/template-context.model';

export const offline: TemplateContextEntryDefinition = {
  name: TemplateContextName.Offline,
  added: '2.0.0',
  categories: {
    [TemplateContextCategory.Standard]: {
      descriptionKey: 'context_offline_standard_description',
      dataType: TemplateContextDataType.Boolean,
    },
  },
  render: () => () => !navigator.onLine,
};
