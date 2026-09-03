import { ExtensionVersion } from 'extension/common/extension-version.enum';
import { TemplateContextCategory } from 'extension/template/context/template-context-category.enum';
import { TemplateContextDataType } from 'extension/template/context/template-context-data-type.enum';
import { TemplateContextName } from 'extension/template/context/template-context-name.enum';
import { TemplateContextEntryDefinition } from 'extension/template/context/template-context.model';
import { createOptionRenderer } from 'extension/template/context/template-context.utils';
import { TemplateActionMode } from 'extension/template/template-action-mode.enum';

/** Whether the toolbar button opens a popup (as opposed to running a template directly). */
export const toolbarPopup: TemplateContextEntryDefinition = {
  name: TemplateContextName.ToolbarPopup,
  added: ExtensionVersion.V1_0_0,
  deprecated: ExtensionVersion.V2_0_0,
  categories: {
    [TemplateContextCategory.Standard]: {
      descriptionKey: 'context_deprecated_toolbar_popup_standard_description',
      dataType: TemplateContextDataType.Boolean,
      isDeprecatedOption: true,
    },
  },
  render: createOptionRenderer(({ templates }) => templates.action.mode === TemplateActionMode.Popup),
};
