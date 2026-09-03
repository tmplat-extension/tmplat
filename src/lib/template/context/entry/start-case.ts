import _startCase from 'lodash.startcase';
import { ExtensionVersion } from 'extension/common/extension-version.enum';
import { WikipediaStartCaseLink } from 'extension/template/context/template-context-category-link';
import { TemplateContextCategory } from 'extension/template/context/template-context-category.enum';
import { TemplateContextDataType } from 'extension/template/context/template-context-data-type.enum';
import { TemplateContextName } from 'extension/template/context/template-context-name.enum';
import { TemplateContextEntryDefinition } from 'extension/template/context/template-context.model';
import { createContentRenderer } from 'extension/template/context/template-context.utils';

export const startCase: TemplateContextEntryDefinition = {
  name: TemplateContextName.StartCase,
  added: ExtensionVersion.V2_0_0,
  categories: {
    [TemplateContextCategory.Operation]: {
      descriptionKey: 'context_start_case_operation_description',
      inputDataType: TemplateContextDataType.String,
      outputDataType: TemplateContextDataType.String,
      links: [WikipediaStartCaseLink],
    },
  },
  render: createContentRenderer((content) => _startCase(content)),
};
