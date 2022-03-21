import { ExtensionVersion } from 'extension/common/extension-version.enum';
import { IntlMessageKey } from 'extension/common/intl/intl-message-key.enum';
import { getBrowserInfo } from 'extension/common/system/system.utils';
import { TemplateContextCategory } from 'extension/template/context/template-context-category.enum';
import { TemplateContextDataType } from 'extension/template/context/template-context-data-type.enum';
import { TemplateContextName } from 'extension/template/context/template-context-name.enum';
import { TemplateContextEntryDefinition } from 'extension/template/context/template-context.model';

export const browserMajorVersion: TemplateContextEntryDefinition = {
  name: TemplateContextName.BrowserMajorVersion,
  added: ExtensionVersion.V2_0_0,
  categories: {
    [TemplateContextCategory.Standard]: {
      descriptionKey: IntlMessageKey.ContextBrowserMajorVersionStandardDescription,
      dataType: TemplateContextDataType.String,
    },
  },
  render: (manager) => {
    return () =>
      manager.computeCacheIfAbsent(TemplateContextName.BrowserMajorVersion, () => {
        const { version } = getBrowserInfo();

        return version;
      });
  },
};
