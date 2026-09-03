import { ExtensionVersion } from 'extension/common/extension-version.enum';
import { TemplateContextCategory } from 'extension/template/context/template-context-category.enum';
import { TemplateContextDataType } from 'extension/template/context/template-context-data-type.enum';
import { TemplateContextFeature } from 'extension/template/context/template-context-feature.enum';
import { TemplateContextName } from 'extension/template/context/template-context-name.enum';
import { TemplateContextEntryDefinition } from 'extension/template/context/template-context.model';

/** The Markdown conversion of the HTML of the currently selected content on the page, if any. */
export const selectionMarkdown: TemplateContextEntryDefinition = {
  name: TemplateContextName.SelectionMarkdown,
  added: ExtensionVersion.V2_0_0,
  categories: {
    [TemplateContextCategory.Standard]: {
      descriptionKey: 'context_selection_markdown_standard_description',
      dataType: TemplateContextDataType.String,
    },
  },
  features: [TemplateContextFeature.TabContext],
  render: (manager) => {
    return async () => {
      const { selection } = await manager.getTabContext();

      return manager.convertToMarkdown(selection.html);
    };
  },
};
