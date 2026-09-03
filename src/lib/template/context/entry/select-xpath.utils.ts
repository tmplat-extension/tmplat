import { GetTabContentMessageExpressionType } from 'extension/tab/message/get-tab-content-message-expression-type.enum';
import { GetTabContentMessageFormat } from 'extension/tab/message/get-tab-content-message-format.enum';
import { TemplateContextEntryRenderer } from 'extension/template/context/template-context.model';
import { createTrimmedContentRenderer } from 'extension/template/context/template-context.utils';

/** Creates a renderer for a single-result select/xpath entry (e.g. `select`, `xpathHtml`). */
export function createSelectOrXpathRenderer(
  expressionType: GetTabContentMessageExpressionType,
  format: GetTabContentMessageFormat,
): TemplateContextEntryRenderer {
  return createTrimmedContentRenderer(async (expression, manager) => {
    const output = await manager.getTabContent(expression, expressionType, format, false);

    return typeof output === 'string' ? output : (output[0] ?? '');
  });
}

/** Creates a renderer for a single-result select/xpath entry whose HTML output is converted to Markdown. */
export function createSelectOrXpathMarkdownRenderer(
  expressionType: GetTabContentMessageExpressionType,
): TemplateContextEntryRenderer {
  return createTrimmedContentRenderer(async (expression, manager) => {
    const output = await manager.getTabContent(expression, expressionType, GetTabContentMessageFormat.Html, false);
    const html = typeof output === 'string' ? output : (output[0] ?? '');

    return manager.convertToMarkdown(html);
  });
}

/** Creates a renderer for a multi-result select/xpath entry (e.g. `selectAll`, `xpathAllHtml`). */
export function createSelectOrXpathAllRenderer(
  expressionType: GetTabContentMessageExpressionType,
  format: GetTabContentMessageFormat,
): TemplateContextEntryRenderer {
  return createTrimmedContentRenderer(async (expression, manager) => {
    const output = await manager.getTabContent(expression, expressionType, format, true);

    return typeof output === 'string' ? [output] : [...output];
  });
}

/** Creates a renderer for a multi-result select/xpath entry whose HTML outputs are converted to Markdown. */
export function createSelectOrXpathAllMarkdownRenderer(
  expressionType: GetTabContentMessageExpressionType,
): TemplateContextEntryRenderer {
  return createTrimmedContentRenderer(async (expression, manager) => {
    const output = await manager.getTabContent(expression, expressionType, GetTabContentMessageFormat.Html, true);
    const htmlValues = typeof output === 'string' ? [output] : output;

    return Promise.all(htmlValues.map((html) => manager.convertToMarkdown(html)));
  });
}
