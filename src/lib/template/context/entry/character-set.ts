import { ExtensionVersion } from 'extension/common/extension-version.enum';
import { IntlMessageKey } from 'extension/common/intl/intl-message-key.enum';
import { IanaCharacterSetsLink } from 'extension/template/context/template-context-category-link';
import { TemplateContextCategory } from 'extension/template/context/template-context-category.enum';
import { TemplateContextDataType } from 'extension/template/context/template-context-data-type.enum';
import { TemplateContextFeature } from 'extension/template/context/template-context-feature.enum';
import { TemplateContextName } from 'extension/template/context/template-context-name.enum';
import { TemplateContextEntryDefinition } from 'extension/template/context/template-context.model';
import { createTabContextRenderer } from 'extension/template/context/template-context.utils';

export const characterSet: TemplateContextEntryDefinition = {
  name: TemplateContextName.CharacterSet,
  added: ExtensionVersion.V1_0_0,
  categories: {
    [TemplateContextCategory.Standard]: {
      descriptionKey: IntlMessageKey.ContextCharacterSetStandardDescription,
      dataType: TemplateContextDataType.String,
      links: [IanaCharacterSetsLink],
    },
  },
  features: [TemplateContextFeature.TabContext],
  render: createTabContextRenderer(({ characterSet }) => characterSet),
};