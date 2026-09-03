import _kebabCase from 'lodash.kebabcase';
import { ExtensionVersion } from 'extension/common/extension-version.enum';
import { WikipediaKebabCaseLink } from 'extension/template/context/template-context-category-link';
import { TemplateContextCategory } from 'extension/template/context/template-context-category.enum';
import { TemplateContextDataType } from 'extension/template/context/template-context-data-type.enum';
import { TemplateContextName } from 'extension/template/context/template-context-name.enum';
import { TemplateContextEntryDefinition } from 'extension/template/context/template-context.model';
import { createContentRenderer } from 'extension/template/context/template-context.utils';

export const kebabCase: TemplateContextEntryDefinition = {
  name: TemplateContextName.KebabCase,
  added: ExtensionVersion.V2_0_0,
  categories: {
    [TemplateContextCategory.Operation]: {
      descriptionKey: 'context_kebab_case_operation_description',
      inputDataType: TemplateContextDataType.String,
      outputDataType: TemplateContextDataType.String,
      links: [WikipediaKebabCaseLink],
    },
  },
  render: createContentRenderer((content) => _kebabCase(content)),
};
