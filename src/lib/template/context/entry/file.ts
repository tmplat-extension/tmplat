import { getUrlFileInfo } from 'extension/common/url.utils';
import { TemplateContextCategory } from 'extension/template/context/template-context-category.enum';
import { TemplateContextDataType } from 'extension/template/context/template-context-data-type.enum';
import { TemplateContextFeature } from 'extension/template/context/template-context-feature.enum';
import { TemplateContextName } from 'extension/template/context/template-context-name.enum';
import { type TemplateContextEntryDefinition } from 'extension/template/context/template-context.model';

export const file: TemplateContextEntryDefinition = {
  name: TemplateContextName.File,
  added: '1.0.0',
  categories: {
    [TemplateContextCategory.Standard]: {
      descriptionKey: 'context_file_standard_description',
      dataType: TemplateContextDataType.String,
    },
  },
  features: [TemplateContextFeature.Url],
  render: (manager) => {
    return () => {
      const url = manager.getUrl();
      const cacheKey = manager.cacheKeyBuilder(TemplateContextName.File, url);

      return manager.computeCacheIfAbsent(cacheKey, () => {
        const { file: urlFile } = getUrlFileInfo(url);
        return urlFile;
      });
    };
  },
};
