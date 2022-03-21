import { ExtensionVersion } from 'extension/common/extension-version.enum';
import { IntlMessageKey } from 'extension/common/intl/intl-message-key.enum';
import { TemplateContextCategory } from 'extension/template/context/template-context-category.enum';
import { TemplateContextDataType } from 'extension/template/context/template-context-data-type.enum';
import { TemplateContextFeature } from 'extension/template/context/template-context-feature.enum';
import { TemplateContextName } from 'extension/template/context/template-context-name.enum';
import { TemplateContextEntryDefinition } from 'extension/template/context/template-context.model';
import { createTrimmedContentRenderer } from 'extension/template/context/template-context.utils';

export const pushUrl: TemplateContextEntryDefinition = {
  name: TemplateContextName.PushUrl,
  added: ExtensionVersion.V2_0_0,
  categories: {
    [TemplateContextCategory.Operation]: {
      descriptionKey: IntlMessageKey.ContextPushUrlOperationDescription,
      inputDataType: TemplateContextDataType.String,
      outputDataType: null,
    },
  },
  features: [TemplateContextFeature.Url],
  render: createTrimmedContentRenderer(async (content, manager) => {
    await manager.pushUrl(content);

    return '';
  }),
};
