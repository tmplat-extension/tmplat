import { ExtensionVersion } from 'extension/common/extension-version.enum';
import { IntlMessageKey } from 'extension/common/intl/intl-message-key.enum';
import { TemplateContextCategory } from 'extension/template/context/template-context-category.enum';
import { TemplateContextDataType } from 'extension/template/context/template-context-data-type.enum';
import { TemplateContextFeature } from 'extension/template/context/template-context-feature.enum';
import { TemplateContextName } from 'extension/template/context/template-context-name.enum';
import { TemplateContextEntryDefinition } from 'extension/template/context/template-context.model';
import { createTrimmedContentRenderer } from 'extension/template/context/template-context.utils';

export const shorten: TemplateContextEntryDefinition = {
  name: TemplateContextName.Shorten,
  added: ExtensionVersion.V1_0_1,
  categories: {
    [TemplateContextCategory.Operation]: {
      descriptionKey: IntlMessageKey.ContextShortenOperationDescription,
      inputDataType: TemplateContextDataType.String,
      outputDataType: TemplateContextDataType.String,
    },
    [TemplateContextCategory.Standard]: {
      descriptionKey: IntlMessageKey.ContextShortenStandardDescription,
      dataType: TemplateContextDataType.String,
    },
  },
  features: [TemplateContextFeature.Url, TemplateContextFeature.UrlShortener],
  render: createTrimmedContentRenderer((content, manager) => manager.getShortUrl(content || manager.getUrl())),
};
