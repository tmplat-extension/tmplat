import { DataNamespace } from 'extension/common/data/data-namespace.enum';
import { TemplateContextCategory } from 'extension/template/context/template-context-category.enum';
import { TemplateContextDataType } from 'extension/template/context/template-context-data-type.enum';
import { TemplateContextName } from 'extension/template/context/template-context-name.enum';
import { type TemplateContextEntryDefinition } from 'extension/template/context/template-context.model';
import { createDataNamespaceRenderer } from 'extension/template/context/template-context.utils';

export const templateCount: TemplateContextEntryDefinition = {
  name: TemplateContextName.TemplateCount,
  added: '2.0.0',
  categories: {
    [TemplateContextCategory.Standard]: {
      descriptionKey: 'context_template_count_standard_description',
      dataType: TemplateContextDataType.Number,
    },
  },
  render: createDataNamespaceRenderer(DataNamespace.Template, ({ templates }) => templates.length),
};
