import { ExtensionVersion } from 'extension/common/extension-version.enum';
import { TemplateContextCategory } from 'extension/template/context/template-context-category.enum';
import { TemplateContextDataType } from 'extension/template/context/template-context-data-type.enum';
import { TemplateContextFeature } from 'extension/template/context/template-context-feature.enum';
import { TemplateContextName } from 'extension/template/context/template-context-name.enum';
import { TemplateContextEntryDefinition } from 'extension/template/context/template-context.model';

export const cookieNames: TemplateContextEntryDefinition = {
  name: TemplateContextName.CookieNames,
  added: ExtensionVersion.V2_0_0,
  categories: {
    [TemplateContextCategory.Collection]: {
      descriptionKey: 'context_cookie_names_collection_description',
      dataType: TemplateContextDataType.Array,
      itemDataType: TemplateContextDataType.String,
    },
  },
  features: [TemplateContextFeature.Url],
  render: (manager) => {
    return () => {
      const url = manager.getUrl();
      const cacheKey = manager.cacheKeyBuilder(TemplateContextName.CookieNames, url);

      return manager.computeCacheIfAbsent(cacheKey, async () => {
        const cookies = await manager.getCookies(manager.getUrl());

        return [...new Set(Object.keys(cookies))].sort();
      });
    };
  },
};
