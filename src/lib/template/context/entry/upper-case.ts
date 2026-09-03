import _upperCase from 'lodash.uppercase';
import { ExtensionVersion } from 'extension/common/extension-version.enum';
import { TemplateContextCategory } from 'extension/template/context/template-context-category.enum';
import { TemplateContextDataType } from 'extension/template/context/template-context-data-type.enum';
import { TemplateContextName } from 'extension/template/context/template-context-name.enum';
import { TemplateContextEntryDefinition } from 'extension/template/context/template-context.model';
import { createContentRenderer } from 'extension/template/context/template-context.utils';

export const upperCase: TemplateContextEntryDefinition = {
  name: TemplateContextName.UpperCase,
  added: ExtensionVersion.V1_0_9,
  categories: {
    [TemplateContextCategory.Operation]: {
      descriptionKey: 'context_upper_case_operation_description',
      inputDataType: TemplateContextDataType.String,
      outputDataType: TemplateContextDataType.String,
    },
  },
  render: createContentRenderer((content) => _upperCase(content)),
};
