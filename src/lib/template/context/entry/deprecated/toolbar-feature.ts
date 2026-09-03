import { ExtensionVersion } from 'extension/common/extension-version.enum';
import { TemplateContextCategory } from 'extension/template/context/template-context-category.enum';
import { TemplateContextDataType } from 'extension/template/context/template-context-data-type.enum';
import { TemplateContextName } from 'extension/template/context/template-context-name.enum';
import { TemplateContextEntryDefinition } from 'extension/template/context/template-context.model';
import { createOptionRenderer } from 'extension/template/context/template-context.utils';
import { TemplateActionMode } from 'extension/template/template-action-mode.enum';

/** The inverse of `toolbarPopup`; whether the toolbar button runs a template directly. */
export const toolbarFeature: TemplateContextEntryDefinition = {
  name: TemplateContextName.ToolbarFeature,
  added: ExtensionVersion.V1_0_0,
  deprecated: ExtensionVersion.V1_0_0,
  categories: {
    [TemplateContextCategory.Standard]: {
      descriptionKey: 'context_deprecated_toolbar_feature_standard_description',
      dataType: TemplateContextDataType.Boolean,
      isDeprecatedOption: true,
    },
  },
  render: createOptionRenderer(({ templates }) => templates.action.mode !== TemplateActionMode.Popup),
};
