import { ExtensionVersion } from 'extension/common/extension-version.enum';
import { IntlMessageKey } from 'extension/common/intl/intl-message-key.enum';
import { getBrowserInfo } from 'extension/common/system/system.utils';
import { TemplateContextCategory } from 'extension/template/context/template-context-category.enum';
import { TemplateContextDataType } from 'extension/template/context/template-context-data-type.enum';
import { TemplateContextName } from 'extension/template/context/template-context-name.enum';
import { TemplateContextEntryDefinition } from 'extension/template/context/template-context.model';

export const browserName: TemplateContextEntryDefinition = {
  name: TemplateContextName.BrowserName,
  added: ExtensionVersion.V2_0_0,
  categories: {
    [TemplateContextCategory.Standard]: {
      descriptionKey: IntlMessageKey.ContextBrowserNameStandardDescription,
      dataType: TemplateContextDataType.String,
    },
  },
  render: (manager) => {
    return () =>
      manager.computeCacheIfAbsent(TemplateContextName.BrowserName, () => {
        const { name } = getBrowserInfo();

        return name;
      });
  },
};
