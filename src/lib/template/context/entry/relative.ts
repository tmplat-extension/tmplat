import { ExtensionVersion } from 'extension/common/extension-version.enum';
import { TemplateContextCategory } from 'extension/template/context/template-context-category.enum';
import { TemplateContextDataType } from 'extension/template/context/template-context-data-type.enum';
import { TemplateContextFeature } from 'extension/template/context/template-context-feature.enum';
import { TemplateContextName } from 'extension/template/context/template-context-name.enum';
import { TemplateContextEntryDefinition } from 'extension/template/context/template-context.model';

export const relative: TemplateContextEntryDefinition = {
  name: TemplateContextName.Relative,
  added: ExtensionVersion.V1_0_0,
  categories: {
    [TemplateContextCategory.Standard]: {
      descriptionKey: 'context_relative_standard_description',
      dataType: TemplateContextDataType.String,
    },
  },
  features: [TemplateContextFeature.Url],
  render: (manager) => {
    return () => {
      const url = manager.getUrl();

      return `${url.pathname}${url.search}${url.hash}`;
    };
  },
};
