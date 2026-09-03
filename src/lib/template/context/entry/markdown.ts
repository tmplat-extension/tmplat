import { TemplateContextCategory } from 'extension/template/context/template-context-category.enum';
import { TemplateContextDataType } from 'extension/template/context/template-context-data-type.enum';
import { TemplateContextFeature } from 'extension/template/context/template-context-feature.enum';
import { TemplateContextName } from 'extension/template/context/template-context-name.enum';
import { type TemplateContextEntryDefinition } from 'extension/template/context/template-context.model';

/** The Markdown conversion of the whole page's HTML. */
export const markdown: TemplateContextEntryDefinition = {
  name: TemplateContextName.Markdown,
  added: '2.0.0',
  categories: {
    [TemplateContextCategory.Standard]: {
      descriptionKey: 'context_markdown_standard_description',
      dataType: TemplateContextDataType.String,
    },
  },
  features: [TemplateContextFeature.TabContext],
  render: (manager) => {
    return async () => {
      const { html } = await manager.getTabContext();

      return manager.convertToMarkdown(html);
    };
  },
};
