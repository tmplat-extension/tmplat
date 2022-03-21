import { atOneBasedIndex } from 'extension/common/array.utils';
import { ExtensionVersion } from 'extension/common/extension-version.enum';
import { IntlMessageKey } from 'extension/common/intl/intl-message-key.enum';
import { TemplateContextCategory } from 'extension/template/context/template-context-category.enum';
import { TemplateContextDataType } from 'extension/template/context/template-context-data-type.enum';
import { TemplateContextFeature } from 'extension/template/context/template-context-feature.enum';
import { TemplateContextName } from 'extension/template/context/template-context-name.enum';
import { TemplateContextEntryDefinition } from 'extension/template/context/template-context.model';
import { createNumericContentRenderer } from 'extension/template/context/template-context.utils';

export const segment: TemplateContextEntryDefinition = {
  name: TemplateContextName.Segment,
  added: ExtensionVersion.V1_0_0,
  categories: {
    [TemplateContextCategory.Operation]: {
      descriptionKey: IntlMessageKey.ContextSegmentOperationDescription,
      inputDataType: TemplateContextDataType.Number,
      outputDataType: TemplateContextDataType.String,
    },
  },
  features: [TemplateContextFeature.Url],
  render: createNumericContentRenderer(async (value, manager) => {
    const url = manager.getUrl();
    const segments = await manager.getSegments(url.pathname);

    return atOneBasedIndex(segments, value);
  }),
};
