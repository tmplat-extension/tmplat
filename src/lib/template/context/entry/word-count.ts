import _words from 'lodash.words';
import { ExtensionVersion } from 'extension/common/extension-version.enum';
import { TemplateContextCategory } from 'extension/template/context/template-context-category.enum';
import { TemplateContextDataType } from 'extension/template/context/template-context-data-type.enum';
import { TemplateContextName } from 'extension/template/context/template-context-name.enum';
import { TemplateContextEntryDefinition } from 'extension/template/context/template-context.model';
import { createTrimmedContentRenderer } from 'extension/template/context/template-context.utils';

export const wordCount: TemplateContextEntryDefinition = {
  name: TemplateContextName.WordCount,
  added: ExtensionVersion.V1_2_6,
  categories: {
    [TemplateContextCategory.Operation]: {
      descriptionKey: 'context_word_count_operation_description',
      inputDataType: TemplateContextDataType.String,
      outputDataType: TemplateContextDataType.Number,
    },
  },
  render: createTrimmedContentRenderer((content, manager) => {
    const cacheKey = manager.cacheKeyBuilder(TemplateContextName.WordCount, content);

    return manager.computeCacheIfAbsent(cacheKey, () => _words(content).length);
  }),
};
