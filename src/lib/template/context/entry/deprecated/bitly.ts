import { ExtensionVersion } from 'extension/common/extension-version.enum';
import { TemplateContextCategory } from 'extension/template/context/template-context-category.enum';
import { TemplateContextDataType } from 'extension/template/context/template-context-data-type.enum';
import { TemplateContextName } from 'extension/template/context/template-context-name.enum';
import { TemplateContextEntryDefinition } from 'extension/template/context/template-context.model';
import { createOptionRenderer } from 'extension/template/context/template-context.utils';
import { UrlShortenerProviderName } from 'extension/url-shortener/provider/url-shortener-provider-name.enum';

export const bitly: TemplateContextEntryDefinition = {
  name: TemplateContextName.Bitly,
  added: ExtensionVersion.V1_0_0,
  deprecated: ExtensionVersion.V2_0_0,
  categories: {
    [TemplateContextCategory.Standard]: {
      descriptionKey: 'context_deprecated_bitly_standard_description',
      dataType: TemplateContextDataType.Boolean,
      isDeprecatedOption: true,
    },
  },
  render: createOptionRenderer(({ urlShorteners }) => urlShorteners.provider === UrlShortenerProviderName.Bitly),
};
