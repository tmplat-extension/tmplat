import { LuxonFormattingTokensLink } from 'extension/template/context/template-context-category-link';
import { TemplateContextCategory } from 'extension/template/context/template-context-category.enum';
import { TemplateContextDataType } from 'extension/template/context/template-context-data-type.enum';
import { TemplateContextFeature } from 'extension/template/context/template-context-feature.enum';
import { TemplateContextName } from 'extension/template/context/template-context-name.enum';
import { type TemplateContextEntryDefinition } from 'extension/template/context/template-context.model';
import { createTrimmedContentRenderer } from 'extension/template/context/template-context.utils';

export const dateTime: TemplateContextEntryDefinition = {
  name: TemplateContextName.DateTime,
  added: '1.0.0',
  categories: {
    [TemplateContextCategory.Operation]: {
      descriptionKey: 'entry_operation_date_time',
      inputDataType: TemplateContextDataType.String,
      outputDataType: TemplateContextDataType.String,
      links: [LuxonFormattingTokensLink],
    },
    [TemplateContextCategory.Standard]: {
      descriptionKey: 'entry_standard_date_time',
      dataType: TemplateContextDataType.String,
    },
  },
  features: [TemplateContextFeature.Intl],
  render: createTrimmedContentRenderer(
    (content, manager) => {
      const cacheKey = manager.cacheKeyBuilder(TemplateContextName.DateTime);
      if (content) {
        cacheKey.add(content);
      }

      return manager.computeCacheIfAbsent(cacheKey, async () => {
        const locale = await manager.getLocale();
        const currentDateTime = manager.getCurrentDateTime().setLocale(locale);

        return content ? currentDateTime.toFormat(content) : currentDateTime.toISO();
      });
    },
    { allowEmptyContent: true },
  ),
};
