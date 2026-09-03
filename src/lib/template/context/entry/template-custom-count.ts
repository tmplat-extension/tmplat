import { DataNamespace } from 'extension/common/data/data-namespace.enum';
import { TemplateContextCategory } from 'extension/template/context/template-context-category.enum';
import { TemplateContextDataType } from 'extension/template/context/template-context-data-type.enum';
import { TemplateContextName } from 'extension/template/context/template-context-name.enum';
import { type TemplateContextEntryDefinition } from 'extension/template/context/template-context.model';

export const templateCustomCount: TemplateContextEntryDefinition = {
  name: TemplateContextName.TemplateCustomCount,
  added: '2.0.0',
  categories: {
    [TemplateContextCategory.Standard]: {
      descriptionKey: 'context_template_custom_count_standard_description',
      dataType: TemplateContextDataType.Number,
    },
  },
  render: (manager) => {
    return () =>
      manager.computeCacheIfAbsent(TemplateContextName.TemplateCustomCount, async () => {
        const { templates } = await manager.getDataNamespace(DataNamespace.Template);

        return templates.filter((template) => !template.predefined).length;
      });
  },
};
