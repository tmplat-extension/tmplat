import { TemplateContextCategory } from 'extension/template/context/template-context-category.enum';
import { TemplateContextDataType } from 'extension/template/context/template-context-data-type.enum';
import { TemplateContextName } from 'extension/template/context/template-context-name.enum';
import { type TemplateContextEntryDefinition } from 'extension/template/context/template-context.model';

/** Always zero; notification duration has not been configurable since 1.2.7. */
export const notificationDuration: TemplateContextEntryDefinition = {
  name: TemplateContextName.NotificationDuration,
  added: '1.0.0',
  deprecated: '1.2.7',
  categories: {
    [TemplateContextCategory.Standard]: {
      descriptionKey: 'context_deprecated_notification_duration_standard_description',
      dataType: TemplateContextDataType.Number,
    },
  },
  render: () => 0,
};
