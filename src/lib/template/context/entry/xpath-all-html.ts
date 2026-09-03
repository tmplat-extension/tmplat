import { ExtensionVersion } from 'extension/common/extension-version.enum';
import { GetTabContentMessageExpressionType } from 'extension/tab/message/get-tab-content-message-expression-type.enum';
import { GetTabContentMessageFormat } from 'extension/tab/message/get-tab-content-message-format.enum';
import { createSelectOrXpathAllRenderer } from 'extension/template/context/entry/select-xpath.utils';
import { TemplateContextCategory } from 'extension/template/context/template-context-category.enum';
import { TemplateContextDataType } from 'extension/template/context/template-context-data-type.enum';
import { TemplateContextFeature } from 'extension/template/context/template-context-feature.enum';
import { TemplateContextName } from 'extension/template/context/template-context-name.enum';
import { TemplateContextEntryDefinition } from 'extension/template/context/template-context.model';

/** The HTML content of every result of the XPath expression provided. */
export const xpathAllHtml: TemplateContextEntryDefinition = {
  name: TemplateContextName.XpathAllHtml,
  added: ExtensionVersion.V2_0_0,
  categories: {
    [TemplateContextCategory.Collection]: {
      descriptionKey: 'context_xpath_all_html_collection_description',
      dataType: TemplateContextDataType.Array,
      itemDataType: TemplateContextDataType.String,
    },
  },
  features: [TemplateContextFeature.TabContext],
  render: createSelectOrXpathAllRenderer(GetTabContentMessageExpressionType.Xpath, GetTabContentMessageFormat.Html),
};
