import { TemplateContextCategory } from 'extension/template/context/template-context-category.enum';
import { TemplateContextDataType } from 'extension/template/context/template-context-data-type.enum';
import { TemplateContextFeature } from 'extension/template/context/template-context-feature.enum';
import { TemplateContextName } from 'extension/template/context/template-context-name.enum';
import { type TemplateContextEntryDefinition } from 'extension/template/context/template-context.model';
import { createTabContextRenderer } from 'extension/template/context/template-context.utils';

export const screenHeight: TemplateContextEntryDefinition = {
  name: TemplateContextName.ScreenHeight,
  added: '2.0.0',
  categories: {
    [TemplateContextCategory.Standard]: {
      descriptionKey: 'context_screen_height_standard_description',
      dataType: TemplateContextDataType.Number,
    },
  },
  features: [TemplateContextFeature.TabContext],
  render: createTabContextRenderer(({ screenSize }) => screenSize.height),
};
