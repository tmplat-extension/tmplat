import { ExtensionVersion } from 'extension/common/extension-version.enum';
import { IntlMessageKey } from 'extension/common/intl/intl-message-key.enum';
import { TemplateContextCategory } from 'extension/template/context/template-context-category.enum';
import { TemplateContextDataType } from 'extension/template/context/template-context-data-type.enum';
import { TemplateContextFeature } from 'extension/template/context/template-context-feature.enum';
import { TemplateContextName } from 'extension/template/context/template-context-name.enum';
import { TemplateContextEntryDefinition } from 'extension/template/context/template-context.model';
import { createTabContextRenderer } from 'extension/template/context/template-context.utils';

export const description: TemplateContextEntryDefinition = {
  name: TemplateContextName.Description,
  added: ExtensionVersion.V1_0_0,
  categories: {
    [TemplateContextCategory.Standard]: {
      descriptionKey: IntlMessageKey.ContextDescriptionStandardDescription,
      dataType: TemplateContextDataType.String,
    },
  },
  features: [TemplateContextFeature.TabContext],
  render: createTabContextRenderer(({ meta }) => meta.description),
};
