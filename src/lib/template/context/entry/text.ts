import { TemplateContextCategory } from 'extension/template/context/template-context-category.enum';
import { TemplateContextDataType } from 'extension/template/context/template-context-data-type.enum';
import { TemplateContextFeature } from 'extension/template/context/template-context-feature.enum';
import { TemplateContextName } from 'extension/template/context/template-context-name.enum';
import { type TemplateContextEntryDefinition } from 'extension/template/context/template-context.model';
import { createTabContextRenderer } from 'extension/template/context/template-context.utils';

/** The text content of the whole page. */
export const text: TemplateContextEntryDefinition = {
  name: TemplateContextName.Text,
  added: '2.0.0',
  categories: {
    [TemplateContextCategory.Standard]: {
      descriptionKey: 'context_text_standard_description',
      dataType: TemplateContextDataType.String,
    },
  },
  features: [TemplateContextFeature.TabContext],
  render: createTabContextRenderer(({ text: tabText }) => tabText),
};
