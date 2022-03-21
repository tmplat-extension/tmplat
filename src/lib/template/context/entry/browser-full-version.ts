import { ExtensionVersion } from 'extension/common/extension-version.enum';
import { IntlMessageKey } from 'extension/common/intl/intl-message-key.enum';
import { getFullBrowserInfo } from 'extension/common/system/system.utils';
import { TemplateContextCategory } from 'extension/template/context/template-context-category.enum';
import { TemplateContextDataType } from 'extension/template/context/template-context-data-type.enum';
import { TemplateContextName } from 'extension/template/context/template-context-name.enum';
import { TemplateContextEntryDefinition } from 'extension/template/context/template-context.model';

export const browserFullVersion: TemplateContextEntryDefinition = {
  name: TemplateContextName.BrowserFullVersion,
  added: ExtensionVersion.V2_0_0,
  categories: {
    [TemplateContextCategory.Standard]: {
      descriptionKey: IntlMessageKey.ContextBrowserFullVersionStandardDescription,
      dataType: TemplateContextDataType.String,
    },
  },
  render: (manager) => {
    return () =>
      manager.computeCacheIfAbsent(TemplateContextName.BrowserFullVersion, async () => {
        const { version } = await getFullBrowserInfo();

        return version;
      });
  },
};
