import { ExtensionVersion } from 'extension/common/extension-version.enum';
import { TemplateContextCategory } from 'extension/template/context/template-context-category.enum';
import { TemplateContextDataType } from 'extension/template/context/template-context-data-type.enum';
import { TemplateContextFeature } from 'extension/template/context/template-context-feature.enum';
import { TemplateContextName } from 'extension/template/context/template-context-name.enum';
import { TemplateContextEntryDefinition } from 'extension/template/context/template-context.model';
import { createTabContextRenderer } from 'extension/template/context/template-context.utils';

export const screenWidth: TemplateContextEntryDefinition = {
  name: TemplateContextName.ScreenWidth,
  added: ExtensionVersion.V2_0_0,
  categories: {
    [TemplateContextCategory.Standard]: {
      descriptionKey: 'context_screen_width_standard_description',
      dataType: TemplateContextDataType.Number,
    },
  },
  features: [TemplateContextFeature.TabContext],
  render: createTabContextRenderer(({ screenSize }) => screenSize.width),
};
