import { ExtensionVersion } from 'extension/common/extension-version.enum';
import { IntlMessageKey } from 'extension/common/intl/intl-message-key.enum';
import { TemplateContextCategory } from 'extension/template/context/template-context-category.enum';
import { TemplateContextFeature } from 'extension/template/context/template-context-feature.enum';
import { TemplateContextName } from 'extension/template/context/template-context-name.enum';
import { TemplateContextEntryDefinition } from 'extension/template/context/template-context.model';

export const popUrl: TemplateContextEntryDefinition = {
  name: TemplateContextName.PopUrl,
  added: ExtensionVersion.V2_0_0,
  categories: {
    [TemplateContextCategory.Operation]: {
      descriptionKey: IntlMessageKey.ContextPopUrlOperationDescription,
      inputDataType: null,
      outputDataType: null,
    },
  },
  features: [TemplateContextFeature.Url],
  render: (manager) => {
    return () => {
      manager.popUrl();

      return '';
    };
  },
};
