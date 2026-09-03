import { TemplateContextCategory } from 'extension/template/context/template-context-category.enum';
import { TemplateContextDataType } from 'extension/template/context/template-context-data-type.enum';
import { TemplateContextFeature } from 'extension/template/context/template-context-feature.enum';
import { TemplateContextName } from 'extension/template/context/template-context-name.enum';
import { type TemplateContextEntryDefinition } from 'extension/template/context/template-context.model';
import { createTabContextRenderer } from 'extension/template/context/template-context.utils';

// Deliberately flat rather than a `screen` object collection entry: `{depth}` (1.x) is a deprecated alias of this
// name, and `aliasOf` can only target a top-level entry, not a property within one. Flat also matches how the
// equally object-shaped page `size` is exposed, as `{width}`/`{height}`.
export const screenColorDepth: TemplateContextEntryDefinition = {
  name: TemplateContextName.ScreenColorDepth,
  added: '2.0.0',
  categories: {
    [TemplateContextCategory.Standard]: {
      descriptionKey: 'context_screen_color_depth_standard_description',
      dataType: TemplateContextDataType.Number,
    },
  },
  features: [TemplateContextFeature.TabContext],
  render: createTabContextRenderer(({ screenColorDepth: tabScreenColorDepth }) => tabScreenColorDepth),
};
