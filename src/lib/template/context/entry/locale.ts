import { ExtensionVersion } from 'extension/common/extension-version.enum';
import { TemplateContextCategory } from 'extension/template/context/template-context-category.enum';
import { TemplateContextDataType } from 'extension/template/context/template-context-data-type.enum';
import { TemplateContextFeature } from 'extension/template/context/template-context-feature.enum';
import { TemplateContextName } from 'extension/template/context/template-context-name.enum';
import { TemplateContextEntryDefinition } from 'extension/template/context/template-context.model';

export const locale: TemplateContextEntryDefinition = {
  name: TemplateContextName.Locale,
  added: ExtensionVersion.V2_0_0,
  categories: {
    [TemplateContextCategory.Standard]: {
      descriptionKey: 'context_locale_standard_description',
      dataType: TemplateContextDataType.String,
    },
  },
  features: [TemplateContextFeature.Intl],
  render: (manager) => () => manager.getLocale(),
};
