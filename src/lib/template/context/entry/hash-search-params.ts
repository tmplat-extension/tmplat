import { TemplateContextCategory } from 'extension/template/context/template-context-category.enum';
import { TemplateContextDataType } from 'extension/template/context/template-context-data-type.enum';
import { TemplateContextFeature } from 'extension/template/context/template-context-feature.enum';
import { TemplateContextName } from 'extension/template/context/template-context-name.enum';
import { type TemplateContextEntryDefinition } from 'extension/template/context/template-context.model';

export const hashSearchParams: TemplateContextEntryDefinition = {
  name: TemplateContextName.HashSearchParams,
  added: '2.0.0',
  categories: {
    [TemplateContextCategory.Collection]: {
      descriptionKey: 'context_hash_search_params_collection_description',
      dataType: TemplateContextDataType.Object,
      valueDataType: TemplateContextDataType.String,
    },
  },
  features: [TemplateContextFeature.Url],
  render: (manager) => {
    return async () => {
      const url = manager.getUrl();
      const searchParams = await manager.createUrlSearchParams(url.hash.substring(1));

      return Object.fromEntries(searchParams);
    };
  },
};
