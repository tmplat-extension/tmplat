import { ExtensionVersion } from 'extension/common/extension-version.enum';
import { TemplateContextCategory } from 'extension/template/context/template-context-category.enum';
import { TemplateContextDataType } from 'extension/template/context/template-context-data-type.enum';
import { TemplateContextFeature } from 'extension/template/context/template-context-feature.enum';
import { TemplateContextName } from 'extension/template/context/template-context-name.enum';
import { TemplateContextEntryDefinition } from 'extension/template/context/template-context.model';
import { createTabContextRenderer } from 'extension/template/context/template-context.utils';

/** The HTML of the currently selected content on the page, if any. */
export const selectionHtml: TemplateContextEntryDefinition = {
  name: TemplateContextName.SelectionHtml,
  added: ExtensionVersion.V2_0_0,
  categories: {
    [TemplateContextCategory.Standard]: {
      descriptionKey: 'context_selection_html_standard_description',
      dataType: TemplateContextDataType.String,
    },
  },
  features: [TemplateContextFeature.TabContext],
  render: createTabContextRenderer(({ selection }) => selection.html),
};
