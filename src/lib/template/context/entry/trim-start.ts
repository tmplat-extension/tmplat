import { ExtensionVersion } from 'extension/common/extension-version.enum';
import { IntlMessageKey } from 'extension/common/intl/intl-message-key.enum';
import { TemplateContextCategory } from 'extension/template/context/template-context-category.enum';
import { TemplateContextDataType } from 'extension/template/context/template-context-data-type.enum';
import { TemplateContextName } from 'extension/template/context/template-context-name.enum';
import { TemplateContextEntryDefinition } from 'extension/template/context/template-context.model';

export const trimStart: TemplateContextEntryDefinition = {
  name: TemplateContextName.TrimStart,
  added: ExtensionVersion.V2_0_0,
  categories: {
    [TemplateContextCategory.Operation]: {
      descriptionKey: IntlMessageKey.ContextTrimStartOperationDescription,
      inputDataType: TemplateContextDataType.String,
      outputDataType: TemplateContextDataType.String,
    },
  },
  render: (manager) => {
    return () => {
      return (text, render) => manager.renderTrimStart(text, render);
    };
  },
};
