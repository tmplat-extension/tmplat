import { ExtensionVersion } from 'extension/common/extension-version.enum';
import { IntlMessageKey } from 'extension/common/intl/intl-message-key.enum';
import { TemplateContextCategory } from 'extension/template/context/template-context-category.enum';
import { TemplateContextDataType } from 'extension/template/context/template-context-data-type.enum';
import { TemplateContextFeature } from 'extension/template/context/template-context-feature.enum';
import { TemplateContextName } from 'extension/template/context/template-context-name.enum';
import { TemplateContextEntryDefinition } from 'extension/template/context/template-context.model';
import { createTabContextRenderer } from 'extension/template/context/template-context.utils';

// TODO: Should this just be an object collection entry (e.g. "screen")?
export const screenColorDepth: TemplateContextEntryDefinition = {
  name: TemplateContextName.ScreenColorDepth,
  added: ExtensionVersion.V2_0_0,
  categories: {
    [TemplateContextCategory.Standard]: {
      descriptionKey: IntlMessageKey.ContextScreenColorDepthStandardDescription,
      dataType: TemplateContextDataType.Number,
    },
  },
  features: [TemplateContextFeature.TabContext],
  render: createTabContextRenderer(({ screenColorDepth }) => screenColorDepth),
};
