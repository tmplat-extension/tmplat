import { TemplateContextCategory } from 'extension/template/context/template-context-category.enum';
import { TemplateContextDataType } from 'extension/template/context/template-context-data-type.enum';
import { TemplateContextFeature } from 'extension/template/context/template-context-feature.enum';
import { TemplateContextName } from 'extension/template/context/template-context-name.enum';
import { type TemplateContextEntryDefinition } from 'extension/template/context/template-context.model';

export const keywords: TemplateContextEntryDefinition = {
  name: TemplateContextName.Keywords,
  added: '1.0.0',
  categories: {
    [TemplateContextCategory.Collection]: {
      descriptionKey: 'context_keywords_collection_description',
      dataType: TemplateContextDataType.Array,
      itemDataType: TemplateContextDataType.String,
    },
  },
  features: [TemplateContextFeature.TabContext],
  render: (manager) => {
    return () => manager.getKeywordsFromTabContext();
  },
};
