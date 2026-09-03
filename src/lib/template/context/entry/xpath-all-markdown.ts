import { ExtensionVersion } from 'extension/common/extension-version.enum';
import { GetTabContentMessageExpressionType } from 'extension/tab/message/get-tab-content-message-expression-type.enum';
import { createSelectOrXpathAllMarkdownRenderer } from 'extension/template/context/entry/select-xpath.utils';
import { TemplateContextCategory } from 'extension/template/context/template-context-category.enum';
import { TemplateContextDataType } from 'extension/template/context/template-context-data-type.enum';
import { TemplateContextFeature } from 'extension/template/context/template-context-feature.enum';
import { TemplateContextName } from 'extension/template/context/template-context-name.enum';
import { TemplateContextEntryDefinition } from 'extension/template/context/template-context.model';

/** The Markdown conversion of the HTML content of every result of the XPath expression provided. */
export const xpathAllMarkdown: TemplateContextEntryDefinition = {
  name: TemplateContextName.XpathAllMarkdown,
  added: ExtensionVersion.V2_0_0,
  categories: {
    [TemplateContextCategory.Collection]: {
      descriptionKey: 'context_xpath_all_markdown_collection_description',
      dataType: TemplateContextDataType.Array,
      itemDataType: TemplateContextDataType.String,
    },
  },
  features: [TemplateContextFeature.TabContext],
  render: createSelectOrXpathAllMarkdownRenderer(GetTabContentMessageExpressionType.Xpath),
};
