import { ExtensionVersion } from 'extension/common/extension-version.enum';
import { TemplateContextCategory } from 'extension/template/context/template-context-category.enum';
import { TemplateContextDataType } from 'extension/template/context/template-context-data-type.enum';
import { TemplateContextFeature } from 'extension/template/context/template-context-feature.enum';
import { TemplateContextName } from 'extension/template/context/template-context-name.enum';
import { TemplateContextEntryDefinition } from 'extension/template/context/template-context.model';
import { createTrimmedContentRenderer } from 'extension/template/context/template-context.utils';

export const cookies: TemplateContextEntryDefinition = {
  name: TemplateContextName.Cookies,
  added: ExtensionVersion.V1_0_0,
  categories: {
    [TemplateContextCategory.Collection]: {
      descriptionKey: 'context_cookies_collection_description',
      dataType: TemplateContextDataType.Object,
      valueDataType: TemplateContextDataType.String,
    },
  },
  features: [TemplateContextFeature.Url],
  render: createTrimmedContentRenderer((_content, manager) => manager.getCookies(manager.getUrl())),
};
