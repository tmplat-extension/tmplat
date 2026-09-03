import { TemplateContextCategory } from 'extension/template/context/template-context-category.enum';
import { TemplateContextDataType } from 'extension/template/context/template-context-data-type.enum';
import { TemplateContextName } from 'extension/template/context/template-context-name.enum';
import { type TemplateContextEntryDefinition } from 'extension/template/context/template-context.model';

export const templateCustomCount: TemplateContextEntryDefinition = {
  name: TemplateContextName.TemplateCustomCount,
  added: '2.0.0',
  categories: {
    [TemplateContextCategory.Standard]: {
      descriptionKey: 'entry_standard_template_custom_count',
      dataType: TemplateContextDataType.Number,
    },
  },
  render: (manager) => {
    return () =>
      manager.computeCacheIfAbsent(TemplateContextName.TemplateCustomCount, async () => {
        const templates = await manager.getTemplates();

        return templates.filter((template) => !template.predefined).length;
      });
  },
};
