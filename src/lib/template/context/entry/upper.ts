import { TemplateContextCategory } from 'extension/template/context/template-context-category.enum';
import { TemplateContextDataType } from 'extension/template/context/template-context-data-type.enum';
import { TemplateContextFeature } from 'extension/template/context/template-context-feature.enum';
import { TemplateContextName } from 'extension/template/context/template-context-name.enum';
import { type TemplateContextEntryDefinition } from 'extension/template/context/template-context.model';
import { createContentRenderer } from 'extension/template/context/template-context.utils';

export const upper: TemplateContextEntryDefinition = {
  name: TemplateContextName.Upper,
  added: '2.0.0',
  categories: {
    [TemplateContextCategory.Operation]: {
      descriptionKey: 'context_upper_operation_description',
      inputDataType: TemplateContextDataType.String,
      outputDataType: TemplateContextDataType.String,
    },
  },
  features: [TemplateContextFeature.Intl],
  render: createContentRenderer(async (content, manager) => {
    const locale = await manager.getLocale();
    return content.toLocaleUpperCase(locale);
  }),
};
