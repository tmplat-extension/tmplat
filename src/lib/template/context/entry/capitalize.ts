import { capitalize as capitalizeFn } from 'lodash-es';

import { ExtensionVersion } from 'extension/common/extension-version.enum';
import { IntlMessageKey } from 'extension/common/intl/intl-message-key.enum';
import { TemplateContextCategory } from 'extension/template/context/template-context-category.enum';
import { TemplateContextDataType } from 'extension/template/context/template-context-data-type.enum';
import { TemplateContextName } from 'extension/template/context/template-context-name.enum';
import { TemplateContextEntryDefinition } from 'extension/template/context/template-context.model';
import { createContentRenderer } from 'extension/template/context/template-context.utils';

export const capitalize: TemplateContextEntryDefinition = {
  name: TemplateContextName.Capitalize,
  added: ExtensionVersion.V1_0_9,
  categories: {
    [TemplateContextCategory.Operation]: {
      descriptionKey: IntlMessageKey.ContextCapitalizeOperationDescription,
      inputDataType: TemplateContextDataType.String,
      outputDataType: TemplateContextDataType.String,
    },
  },
  render: createContentRenderer((content) => capitalizeFn(content)),
};
