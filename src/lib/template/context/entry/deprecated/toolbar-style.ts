import { ExtensionVersion } from 'extension/common/extension-version.enum';
import { TemplateContextCategory } from 'extension/template/context/template-context-category.enum';
import { TemplateContextDataType } from 'extension/template/context/template-context-data-type.enum';
import { TemplateContextName } from 'extension/template/context/template-context-name.enum';
import { TemplateContextEntryDefinition } from 'extension/template/context/template-context.model';

/** Always `false`; the toolbar style setting was removed in 1.1.0. */
export const toolbarStyle: TemplateContextEntryDefinition = {
  name: TemplateContextName.ToolbarStyle,
  added: ExtensionVersion.V1_0_0,
  deprecated: ExtensionVersion.V1_1_0,
  categories: {
    [TemplateContextCategory.Standard]: {
      descriptionKey: 'context_deprecated_toolbar_style_standard_description',
      dataType: TemplateContextDataType.Boolean,
    },
  },
  render: () => false,
};
