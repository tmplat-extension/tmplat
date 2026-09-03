import { type TabContentMessageExpressionType } from 'extension/tab/message/tab-content-message-expression-type.enum';
import { TabContentMessageFormat } from 'extension/tab/message/tab-content-message-format.enum';
import { type TemplateContextEntryRenderer } from 'extension/template/context/template-context.model';
import { createTrimmedContentRenderer } from 'extension/template/context/template-context.utils';

/** Creates a renderer for a single-result select/xpath entry (e.g. `select`, `xpathHtml`). */
export const createSelectOrXpathRenderer = (
  expressionType: TabContentMessageExpressionType,
  format: TabContentMessageFormat,
): TemplateContextEntryRenderer =>
  createTrimmedContentRenderer(async (expression, manager) => {
    const output = await manager.getTabContent(expression, expressionType, format, false);

    return typeof output === 'string' ? output : (output[0] ?? '');
  });

/** Creates a renderer for a single-result select/xpath entry whose HTML output is converted to Markdown. */
export const createSelectOrXpathMarkdownRenderer = (
  expressionType: TabContentMessageExpressionType,
): TemplateContextEntryRenderer =>
  createTrimmedContentRenderer(async (expression, manager) => {
    const output = await manager.getTabContent(expression, expressionType, TabContentMessageFormat.Html, false);
    const html = typeof output === 'string' ? output : (output[0] ?? '');

    return manager.convertToMarkdown(html);
  });

/** Creates a renderer for a multi-result select/xpath entry (e.g. `selectAll`, `xpathAllHtml`). */
export const createSelectOrXpathAllRenderer = (
  expressionType: TabContentMessageExpressionType,
  format: TabContentMessageFormat,
): TemplateContextEntryRenderer =>
  createTrimmedContentRenderer(async (expression, manager) => {
    const output = await manager.getTabContent(expression, expressionType, format, true);

    return typeof output === 'string' ? [output] : [...output];
  });

/** Creates a renderer for a multi-result select/xpath entry whose HTML outputs are converted to Markdown. */
export const createSelectOrXpathAllMarkdownRenderer = (
  expressionType: TabContentMessageExpressionType,
): TemplateContextEntryRenderer =>
  createTrimmedContentRenderer(async (expression, manager) => {
    const output = await manager.getTabContent(expression, expressionType, TabContentMessageFormat.Html, true);
    const htmlValues = typeof output === 'string' ? [output] : output;

    return Promise.all(htmlValues.map((html) => manager.convertToMarkdown(html)));
  });
