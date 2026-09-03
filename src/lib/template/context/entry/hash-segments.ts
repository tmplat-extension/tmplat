import { TemplateContextCategory } from 'extension/template/context/template-context-category.enum';
import { TemplateContextDataType } from 'extension/template/context/template-context-data-type.enum';
import { TemplateContextFeature } from 'extension/template/context/template-context-feature.enum';
import { TemplateContextName } from 'extension/template/context/template-context-name.enum';
import { type TemplateContextEntryDefinition } from 'extension/template/context/template-context.model';

export const hashSegments: TemplateContextEntryDefinition = {
  name: TemplateContextName.HashSegments,
  added: '2.0.0',
  categories: {
    [TemplateContextCategory.Collection]: {
      descriptionKey: 'context_hash_segments_collection_description',
      dataType: TemplateContextDataType.Array,
      itemDataType: TemplateContextDataType.String,
    },
  },
  features: [TemplateContextFeature.Url],
  render: (manager) => {
    return () => {
      const url = manager.getUrl();

      return manager.getSegments(url.hash.substring(1));
    };
  },
};
