import { TemplateContextCategory } from 'extension/template/context/template-context-category.enum';
import { TemplateContextDataType } from 'extension/template/context/template-context-data-type.enum';
import { TemplateContextFeature } from 'extension/template/context/template-context-feature.enum';
import { TemplateContextName } from 'extension/template/context/template-context-name.enum';
import { type TemplateContextEntryDefinition } from 'extension/template/context/template-context.model';

export const cookies: TemplateContextEntryDefinition = {
  name: TemplateContextName.Cookies,
  added: '1.0.0',
  categories: {
    [TemplateContextCategory.Collection]: {
      descriptionKey: 'context_cookies_collection_description',
      dataType: TemplateContextDataType.Object,
      valueDataType: TemplateContextDataType.String,
    },
  },
  features: [TemplateContextFeature.Url],
  render: (manager) => {
    return () => manager.getCookies(manager.getUrl());
  },
};
