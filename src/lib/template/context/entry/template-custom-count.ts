import { DataNamespace } from 'extension/common/data/data-namespace.enum';
import { ExtensionVersion } from 'extension/common/extension-version.enum';
import { IntlMessageKey } from 'extension/common/intl/intl-message-key.enum';
import { TemplateContextCategory } from 'extension/template/context/template-context-category.enum';
import { TemplateContextDataType } from 'extension/template/context/template-context-data-type.enum';
import { TemplateContextName } from 'extension/template/context/template-context-name.enum';
import { TemplateContextEntryDefinition } from 'extension/template/context/template-context.model';

export const templateCustomCount: TemplateContextEntryDefinition = {
  name: TemplateContextName.TemplateCustomCount,
  added: ExtensionVersion.V2_0_0,
  categories: {
    [TemplateContextCategory.Standard]: {
      descriptionKey: IntlMessageKey.ContextTemplateCustomCountStandardDescription,
      dataType: TemplateContextDataType.Number,
    },
  },
  render: (manager) => {
    return () =>
      manager.computeCacheIfAbsent(TemplateContextName.TemplateCustomCount, async () => {
        const { templates } = await manager.getDataNamespace(DataNamespace.Template);

        return templates.filter((template) => !template.predefined).length;
      });
  },
};
