import { ExtensionVersion } from 'extension/common/extension-version.enum';
import { TemplateContextCategory } from 'extension/template/context/template-context-category.enum';
import { TemplateContextDataType } from 'extension/template/context/template-context-data-type.enum';
import { TemplateContextName } from 'extension/template/context/template-context-name.enum';
import { TemplateContextEntryDefinition } from 'extension/template/context/template-context.model';

/** Always zero; notification duration has not been configurable since 1.2.7. */
export const notificationDuration: TemplateContextEntryDefinition = {
  name: TemplateContextName.NotificationDuration,
  added: ExtensionVersion.V1_0_0,
  deprecated: ExtensionVersion.V1_2_7,
  categories: {
    [TemplateContextCategory.Standard]: {
      descriptionKey: 'context_deprecated_notification_duration_standard_description',
      dataType: TemplateContextDataType.Number,
    },
  },
  render: () => 0,
};
