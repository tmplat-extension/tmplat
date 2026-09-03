import { ExtensionVersion } from 'extension/common/extension-version.enum';
import { TemplateContextCategory } from 'extension/template/context/template-context-category.enum';
import { TemplateContextDataType } from 'extension/template/context/template-context-data-type.enum';
import { TemplateContextName } from 'extension/template/context/template-context-name.enum';
import { optionsDocumentation } from 'extension/template/context/template-context-options-documentation';
import { TemplateContextEntryDefinition } from 'extension/template/context/template-context.model';
import { createOptionRenderer } from 'extension/template/context/template-context.utils';

export const options: TemplateContextEntryDefinition = {
  name: TemplateContextName.Options,
  added: ExtensionVersion.V2_0_0,
  categories: {
    [TemplateContextCategory.Collection]: {
      descriptionKey: 'context_options_collection_description',
      dataType: TemplateContextDataType.Object,
      properties: optionsDocumentation,
    },
  },
  render: createOptionRenderer((options) => options),
};
