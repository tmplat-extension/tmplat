import { atOneBasedIndex } from 'extension/common/array.utils';
import { TemplateContextCategory } from 'extension/template/context/template-context-category.enum';
import { TemplateContextDataType } from 'extension/template/context/template-context-data-type.enum';
import { TemplateContextFeature } from 'extension/template/context/template-context-feature.enum';
import { TemplateContextName } from 'extension/template/context/template-context-name.enum';
import { type TemplateContextEntryDefinition } from 'extension/template/context/template-context.model';
import { createNumericContentRenderer } from 'extension/template/context/template-context.utils';

export const hashSegment: TemplateContextEntryDefinition = {
  name: TemplateContextName.HashSegment,
  added: '2.0.0',
  categories: {
    [TemplateContextCategory.Operation]: {
      descriptionKey: 'context_hash_segment_operation_description',
      inputDataType: TemplateContextDataType.Number,
      outputDataType: TemplateContextDataType.String,
    },
  },
  features: [TemplateContextFeature.Url],
  render: createNumericContentRenderer(async (value, manager) => {
    const url = manager.getUrl();
    const segments = await manager.getSegments(url.hash.substring(1));

    return atOneBasedIndex(segments, value);
  }),
};
