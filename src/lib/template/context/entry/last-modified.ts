import { DateTime } from 'luxon';

import { ExtensionVersion } from 'extension/common/extension-version.enum';
import { IntlMessageKey } from 'extension/common/intl/intl-message-key.enum';
import { LuxonFormattingTokensLink } from 'extension/template/context/template-context-category-link';
import { TemplateContextCategory } from 'extension/template/context/template-context-category.enum';
import { TemplateContextDataType } from 'extension/template/context/template-context-data-type.enum';
import { TemplateContextFeature } from 'extension/template/context/template-context-feature.enum';
import { TemplateContextName } from 'extension/template/context/template-context-name.enum';
import { TemplateContextEntryDefinition } from 'extension/template/context/template-context.model';
import { createTrimmedContentRenderer } from 'extension/template/context/template-context.utils';

export const lastModified: TemplateContextEntryDefinition = {
  name: TemplateContextName.LastModified,
  added: ExtensionVersion.V1_0_0,
  categories: {
    [TemplateContextCategory.Operation]: {
      descriptionKey: IntlMessageKey.ContextLastModifiedOperationDescription,
      inputDataType: TemplateContextDataType.String,
      outputDataType: TemplateContextDataType.String,
      links: [LuxonFormattingTokensLink],
    },
    [TemplateContextCategory.Standard]: {
      descriptionKey: IntlMessageKey.ContextLastModifiedStandardDescription,
      dataType: TemplateContextDataType.String,
    },
  },
  features: [TemplateContextFeature.Intl, TemplateContextFeature.TabContext],
  render: createTrimmedContentRenderer((content, manager) => {
    const cacheKey = manager.cacheKeyBuilder(TemplateContextName.LastModified);
    if (content) {
      cacheKey.add(content);
    }

    return manager.computeCacheIfAbsent(cacheKey, async () => {
      const { lastModified } = await manager.getTabContext();
      const lastModifiedDateTime = (
        lastModified ? DateTime.fromJSDate(new Date(lastModified)) : manager.getCurrentDateTime()
      ).setLocale(manager.getLocale());

      return content ? lastModifiedDateTime.toFormat(content) : lastModifiedDateTime.toISO();
    });
  }),
};
