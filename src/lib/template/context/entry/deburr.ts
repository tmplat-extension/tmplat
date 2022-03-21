import { deburr as deburrFn } from 'lodash-es';

import { ExtensionVersion } from 'extension/common/extension-version.enum';
import { IntlMessageKey } from 'extension/common/intl/intl-message-key.enum';
import {
  WikipediaLatin1SupplementLink,
  WikipediaLatinExtendedALink,
} from 'extension/template/context/template-context-category-link';
import { TemplateContextCategory } from 'extension/template/context/template-context-category.enum';
import { TemplateContextDataType } from 'extension/template/context/template-context-data-type.enum';
import { TemplateContextName } from 'extension/template/context/template-context-name.enum';
import { TemplateContextEntryDefinition } from 'extension/template/context/template-context.model';
import { createContentRenderer } from 'extension/template/context/template-context.utils';

export const deburr: TemplateContextEntryDefinition = {
  name: TemplateContextName.Deburr,
  added: ExtensionVersion.V2_0_0,
  categories: {
    [TemplateContextCategory.Operation]: {
      descriptionKey: IntlMessageKey.ContextDeburrOperationDescription,
      inputDataType: TemplateContextDataType.String,
      outputDataType: TemplateContextDataType.String,
      links: [WikipediaLatin1SupplementLink, WikipediaLatinExtendedALink],
    },
  },
  render: createContentRenderer((content) => deburrFn(content)),
};
