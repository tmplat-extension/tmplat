import { ExtensionVersion } from 'extension/common/extension-version.enum';
import { IntlMessageKey } from 'extension/common/intl/intl-message-key.enum';
import { TemplateContextCategory } from 'extension/template/context/template-context-category.enum';
import { TemplateContextDataType } from 'extension/template/context/template-context-data-type.enum';
import { TemplateContextFeature } from 'extension/template/context/template-context-feature.enum';
import { TemplateContextName } from 'extension/template/context/template-context-name.enum';
import { TemplateContextEntryDefinition } from 'extension/template/context/template-context.model';

export const width: TemplateContextEntryDefinition = {
  name: TemplateContextName.Width,
  added: ExtensionVersion.V2_0_0,
  categories: {
    [TemplateContextCategory.Standard]: {
      descriptionKey: IntlMessageKey.ContextWidthStandardDescription,
      dataType: TemplateContextDataType.String,
    },
  },
  features: [TemplateContextFeature.Tab],
  render: (manager) => {
    return async () => {
      const { width } = await manager.getDimensionsFromTabContext();

      return width;
    };
  },
};
