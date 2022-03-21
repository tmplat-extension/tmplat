import { DataNamespace } from 'extension/common/data/data-namespace.enum';
import { ExtensionVersion } from 'extension/common/extension-version.enum';
import { IntlMessageKey } from 'extension/common/intl/intl-message-key.enum';
import { TemplateContextCategory } from 'extension/template/context/template-context-category.enum';
import { TemplateContextDataType } from 'extension/template/context/template-context-data-type.enum';
import { TemplateContextName } from 'extension/template/context/template-context-name.enum';
import { TemplateContextEntryDefinition } from 'extension/template/context/template-context.model';
import { createDataNamespaceRenderer } from 'extension/template/context/template-context.utils';

export const templateCount: TemplateContextEntryDefinition = {
  name: TemplateContextName.TemplateCount,
  added: ExtensionVersion.V2_0_0,
  categories: {
    [TemplateContextCategory.Standard]: {
      descriptionKey: IntlMessageKey.ContextTemplateCountStandardDescription,
      dataType: TemplateContextDataType.Number,
    },
  },
  render: createDataNamespaceRenderer(DataNamespace.Template, ({ templates }) => templates.length),
};
