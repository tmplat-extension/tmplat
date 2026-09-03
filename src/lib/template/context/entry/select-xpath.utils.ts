import { type TabContentMessageExpressionType } from 'extension/tab/message/tab-content-message-expression-type.enum';
import { TabContentMessageFormat } from 'extension/tab/message/tab-content-message-format.enum';
import { type TemplateContextEntryRenderer } from 'extension/template/context/template-context.model';
import { createTrimmedContentRenderer } from 'extension/template/context/template-context.utils';

/**
 * The separator used to join the results of a multi-result select/xpath entry.
 *
 * This matches the separator used by tmplat 1.x (`src/lib/background.coffee:1238`), so a template migrated from
 * 1.x continues to produce the same output.
 */
const MULTI_RESULT_SEPARATOR = '\n';

/** Creates a renderer for a single-result select/xpath entry (e.g. `select`, `xpathHtml`). */
export const createSelectOrXpathRenderer = (
  expressionType: TabContentMessageExpressionType,
  format: TabContentMessageFormat,
): TemplateContextEntryRenderer =>
  createTrimmedContentRenderer(async (expression, manager) => {
    return manager.getTabContent(expression, expressionType, format, false);
  });

/** Creates a renderer for a single-result select/xpath entry whose HTML output is converted to Markdown. */
export const createSelectOrXpathMarkdownRenderer = (
  expressionType: TabContentMessageExpressionType,
): TemplateContextEntryRenderer =>
  createTrimmedContentRenderer(async (expression, manager) => {
    const html = await manager.getTabContent(expression, expressionType, TabContentMessageFormat.Html, false);

    return manager.convertToMarkdown(html);
  });

/**
 * Creates a renderer for a multi-result select/xpath entry (e.g. `selectAll`, `xpathAllHtml`).
 *
 * The results are joined with {@link MULTI_RESULT_SEPARATOR} rather than returned as an array. These entries are
 * operations, so their section body is consumed as the expression and is therefore unavailable for templating the
 * results; an array would simply be stringified by the template engine using a comma.
 */
export const createSelectOrXpathAllRenderer = (
  expressionType: TabContentMessageExpressionType,
  format: TabContentMessageFormat,
): TemplateContextEntryRenderer =>
  createTrimmedContentRenderer(async (expression, manager) => {
    const output = await manager.getTabContent(expression, expressionType, format, true);

    return output.join(MULTI_RESULT_SEPARATOR);
  });

/**
 * Creates a renderer for a multi-result select/xpath entry whose HTML outputs are converted to Markdown.
 *
 * The HTML is joined *before* being converted, exactly as tmplat 1.x did (`src/lib/background.coffee:1237-1239`),
 * so the results are converted as one document. Converting each fragment separately would restart the converter's
 * document-level state — most visibly its reference-style link definitions, which would then be emitted once per
 * fragment rather than once per template.
 */
export const createSelectOrXpathAllMarkdownRenderer = (
  expressionType: TabContentMessageExpressionType,
): TemplateContextEntryRenderer =>
  createTrimmedContentRenderer(async (expression, manager) => {
    const output = await manager.getTabContent(expression, expressionType, TabContentMessageFormat.Html, true);

    return manager.convertToMarkdown(output.join(MULTI_RESULT_SEPARATOR));
  });
