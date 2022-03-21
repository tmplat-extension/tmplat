import { ExtensionVersion } from 'extension/common/extension-version.enum';
import { IntlMessageKey } from 'extension/common/intl/intl-message-key.enum';
import { LuxonFormattingTokensLink } from 'extension/template/context/template-context-category-link';
import { TemplateContextCategory } from 'extension/template/context/template-context-category.enum';
import { TemplateContextDataType } from 'extension/template/context/template-context-data-type.enum';
import { TemplateContextFeature } from 'extension/template/context/template-context-feature.enum';
import { TemplateContextName } from 'extension/template/context/template-context-name.enum';
import { TemplateContextEntryDefinition } from 'extension/template/context/template-context.model';
import { createTrimmedContentRenderer } from 'extension/template/context/template-context.utils';

export const dateTime: TemplateContextEntryDefinition = {
  name: TemplateContextName.DateTime,
  added: ExtensionVersion.V1_0_0,
  categories: {
    [TemplateContextCategory.Operation]: {
      descriptionKey: IntlMessageKey.ContextDateTimeOperationDescription,
      inputDataType: TemplateContextDataType.String,
      outputDataType: TemplateContextDataType.String,
      links: [LuxonFormattingTokensLink],
    },
    [TemplateContextCategory.Standard]: {
      descriptionKey: IntlMessageKey.ContextDateTimeStandardDescription,
      dataType: TemplateContextDataType.String,
    },
  },
  features: [TemplateContextFeature.Intl],
  render: createTrimmedContentRenderer((content, manager) => {
    const cacheKey = manager.cacheKeyBuilder(TemplateContextName.DateTime);
    if (content) {
      cacheKey.add(content);
    }

    return manager.computeCacheIfAbsent(cacheKey, () => {
      const dateTime = manager.getCurrentDateTime().setLocale(manager.getLocale());

      return content ? dateTime.toFormat(content) : dateTime.toISO();
    });
  }),
};
