import { TemplateContextCategory } from 'extension/template/context/template-context-category.enum';
import { TemplateContextDataType } from 'extension/template/context/template-context-data-type.enum';
import { TemplateContextName } from 'extension/template/context/template-context-name.enum';
import { type TemplateContextEntryDefinition } from 'extension/template/context/template-context.model';

export const templateCount: TemplateContextEntryDefinition = {
  name: TemplateContextName.TemplateCount,
  added: '2.0.0',
  categories: {
    [TemplateContextCategory.Standard]: {
      descriptionKey: 'context_template_count_standard_description',
      dataType: TemplateContextDataType.Number,
    },
  },
  render: (manager) => {
    return () =>
      manager.computeCacheIfAbsent(
        TemplateContextName.TemplateCount,
        async () => (await manager.getTemplates()).length,
      );
  },
};
