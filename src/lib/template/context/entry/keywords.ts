import { ExtensionVersion } from 'extension/common/extension-version.enum';
import { IntlMessageKey } from 'extension/common/intl/intl-message-key.enum';
import { TemplateContextCategory } from 'extension/template/context/template-context-category.enum';
import { TemplateContextDataType } from 'extension/template/context/template-context-data-type.enum';
import { TemplateContextFeature } from 'extension/template/context/template-context-feature.enum';
import { TemplateContextName } from 'extension/template/context/template-context-name.enum';
import { TemplateContextEntryDefinition } from 'extension/template/context/template-context.model';

export const keywords: TemplateContextEntryDefinition = {
  name: TemplateContextName.Keywords,
  added: ExtensionVersion.V1_0_0,
  categories: {
    [TemplateContextCategory.Collection]: {
      descriptionKey: IntlMessageKey.ContextKeywordsCollectionDescription,
      dataType: TemplateContextDataType.Array,
      itemDataType: TemplateContextDataType.String,
    },
  },
  features: [TemplateContextFeature.TabContext],
  render: (manager) => {
    return () => manager.getKeywordsFromTabContext();
  },
};
