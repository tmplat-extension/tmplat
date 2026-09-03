import { TemplateContextCategory } from 'extension/template/context/template-context-category.enum';
import { TemplateContextDataType } from 'extension/template/context/template-context-data-type.enum';
import { TemplateContextFeature } from 'extension/template/context/template-context-feature.enum';
import { TemplateContextName } from 'extension/template/context/template-context-name.enum';
import { type TemplateContextEntryDefinition } from 'extension/template/context/template-context.model';
import { createTrimmedContentRenderer } from 'extension/template/context/template-context.utils';

export const shorten: TemplateContextEntryDefinition = {
  name: TemplateContextName.Shorten,
  added: '1.0.1',
  categories: {
    [TemplateContextCategory.Operation]: {
      descriptionKey: 'entry_operation_shorten',
      inputDataType: TemplateContextDataType.String,
      outputDataType: TemplateContextDataType.String,
    },
    [TemplateContextCategory.Standard]: {
      descriptionKey: 'entry_standard_shorten',
      dataType: TemplateContextDataType.String,
    },
  },
  features: [TemplateContextFeature.Url, TemplateContextFeature.UrlShortener],
  render: createTrimmedContentRenderer((content, manager) => manager.getShortUrl(content || manager.getUrl()), {
    allowEmptyContent: true,
  }),
};
