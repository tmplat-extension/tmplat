import { getFullBrowserInfo } from 'extension/common/system/system.utils';
import { TemplateContextCategory } from 'extension/template/context/template-context-category.enum';
import { TemplateContextDataType } from 'extension/template/context/template-context-data-type.enum';
import { TemplateContextName } from 'extension/template/context/template-context-name.enum';
import { type TemplateContextEntryDefinition } from 'extension/template/context/template-context.model';

export const browserFullVersion: TemplateContextEntryDefinition = {
  name: TemplateContextName.BrowserFullVersion,
  added: '2.0.0',
  categories: {
    [TemplateContextCategory.Standard]: {
      descriptionKey: 'context_browser_full_version_standard_description',
      dataType: TemplateContextDataType.String,
    },
  },
  render: (manager) => {
    return () =>
      manager.computeCacheIfAbsent(
        TemplateContextName.BrowserFullVersion,
        async () => (await getFullBrowserInfo())?.version,
      );
  },
};
