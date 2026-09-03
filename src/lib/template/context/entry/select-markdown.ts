import { ExtensionVersion } from 'extension/common/extension-version.enum';
import { GetTabContentMessageExpressionType } from 'extension/tab/message/get-tab-content-message-expression-type.enum';
import { createSelectOrXpathMarkdownRenderer } from 'extension/template/context/entry/select-xpath.utils';
import { TemplateContextCategory } from 'extension/template/context/template-context-category.enum';
import { TemplateContextDataType } from 'extension/template/context/template-context-data-type.enum';
import { TemplateContextFeature } from 'extension/template/context/template-context-feature.enum';
import { TemplateContextName } from 'extension/template/context/template-context-name.enum';
import { TemplateContextEntryDefinition } from 'extension/template/context/template-context.model';

/** The Markdown conversion of the HTML content of the first element matching the CSS selector provided. */
export const selectMarkdown: TemplateContextEntryDefinition = {
  name: TemplateContextName.SelectMarkdown,
  added: ExtensionVersion.V2_0_0,
  categories: {
    [TemplateContextCategory.Operation]: {
      descriptionKey: 'context_select_markdown_operation_description',
      inputDataType: TemplateContextDataType.String,
      outputDataType: TemplateContextDataType.String,
    },
  },
  features: [TemplateContextFeature.TabContext],
  render: createSelectOrXpathMarkdownRenderer(GetTabContentMessageExpressionType.Selector),
};
