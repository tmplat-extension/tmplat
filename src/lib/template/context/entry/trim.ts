import { ExtensionVersion } from 'extension/common/extension-version.enum';
import { IntlMessageKey } from 'extension/common/intl/intl-message-key.enum';
import { TemplateContextCategory } from 'extension/template/context/template-context-category.enum';
import { TemplateContextDataType } from 'extension/template/context/template-context-data-type.enum';
import { TemplateContextName } from 'extension/template/context/template-context-name.enum';
import { TemplateContextEntryDefinition } from 'extension/template/context/template-context.model';
import { createTrimmedContentRenderer } from 'extension/template/context/template-context.utils';

export const trim: TemplateContextEntryDefinition = {
  name: TemplateContextName.Trim,
  added: ExtensionVersion.V1_0_9,
  categories: {
    [TemplateContextCategory.Operation]: {
      descriptionKey: IntlMessageKey.ContextTrimOperationDescription,
      inputDataType: TemplateContextDataType.String,
      outputDataType: TemplateContextDataType.String,
    },
  },
  render: createTrimmedContentRenderer((content) => content),
};