import { TabContentMessageExpressionType } from 'extension/tab/message/tab-content-message-expression-type.enum';
import { TabContentMessageFormat } from 'extension/tab/message/tab-content-message-format.enum';
import { createSelectOrXpathRenderer } from 'extension/template/context/entry/select-xpath.utils';
import { TemplateContextCategory } from 'extension/template/context/template-context-category.enum';
import { TemplateContextDataType } from 'extension/template/context/template-context-data-type.enum';
import { TemplateContextFeature } from 'extension/template/context/template-context-feature.enum';
import { TemplateContextName } from 'extension/template/context/template-context-name.enum';
import { type TemplateContextEntryDefinition } from 'extension/template/context/template-context.model';

/** The HTML content of the first element matching the CSS selector provided. */
export const selectHtml: TemplateContextEntryDefinition = {
  name: TemplateContextName.SelectHtml,
  added: '2.0.0',
  categories: {
    [TemplateContextCategory.Operation]: {
      descriptionKey: 'context_select_html_operation_description',
      inputDataType: TemplateContextDataType.String,
      outputDataType: TemplateContextDataType.String,
    },
  },
  features: [TemplateContextFeature.TabContext],
  render: createSelectOrXpathRenderer(TabContentMessageExpressionType.Selector, TabContentMessageFormat.Html),
};
