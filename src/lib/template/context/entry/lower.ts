import { ExtensionVersion } from 'extension/common/extension-version.enum';
import { TemplateContextCategory } from 'extension/template/context/template-context-category.enum';
import { TemplateContextDataType } from 'extension/template/context/template-context-data-type.enum';
import { TemplateContextFeature } from 'extension/template/context/template-context-feature.enum';
import { TemplateContextName } from 'extension/template/context/template-context-name.enum';
import { TemplateContextEntryDefinition } from 'extension/template/context/template-context.model';
import { createContentRenderer } from 'extension/template/context/template-context.utils';

export const lower: TemplateContextEntryDefinition = {
  name: TemplateContextName.Lower,
  added: ExtensionVersion.V2_0_0,
  categories: {
    [TemplateContextCategory.Operation]: {
      descriptionKey: 'context_lower_operation_description',
      inputDataType: TemplateContextDataType.String,
      outputDataType: TemplateContextDataType.String,
    },
  },
  features: [TemplateContextFeature.Intl],
  render: createContentRenderer(async (content, manager) => {
    const locale = await manager.getLocale();
    return content.toLocaleLowerCase(locale);
  }),
};
