import { ExtensionVersion } from 'extension/common/extension-version.enum';
import { TemplateContextCategory } from 'extension/template/context/template-context-category.enum';
import { TemplateContextDataType } from 'extension/template/context/template-context-data-type.enum';
import { TemplateContextFeature } from 'extension/template/context/template-context-feature.enum';
import { TemplateContextName } from 'extension/template/context/template-context-name.enum';
import { TemplateContextEntryDefinition } from 'extension/template/context/template-context.model';
import { createTrimmedContentRenderer } from 'extension/template/context/template-context.utils';

export const hashSearchParams: TemplateContextEntryDefinition = {
  name: TemplateContextName.HashSearchParams,
  added: ExtensionVersion.V2_0_0,
  categories: {
    [TemplateContextCategory.Collection]: {
      descriptionKey: 'context_hash_search_params_collection_description',
      dataType: TemplateContextDataType.Object,
      valueDataType: TemplateContextDataType.String,
    },
  },
  features: [TemplateContextFeature.Url],
  render: createTrimmedContentRenderer(async (_content, manager) => {
    const url = manager.getUrl();
    const searchParams = await manager.createUrlSearchParams(url.hash.substring(1));

    return Object.fromEntries(searchParams);
  }),
};
