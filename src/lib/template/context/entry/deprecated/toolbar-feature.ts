import { TemplateContextCategory } from 'extension/template/context/template-context-category.enum';
import { TemplateContextDataType } from 'extension/template/context/template-context-data-type.enum';
import { TemplateContextName } from 'extension/template/context/template-context-name.enum';
import { type TemplateContextEntryDefinition } from 'extension/template/context/template-context.model';
import { createOptionRenderer } from 'extension/template/context/template-context.utils';
import { TemplateActionMode } from 'extension/template/template-action-mode.enum';

/** The inverse of `toolbarPopup`; whether the toolbar button runs a template directly. */
export const toolbarFeature: TemplateContextEntryDefinition = {
  name: TemplateContextName.ToolbarFeature,
  added: '1.0.0',
  deprecated: '1.0.0',
  categories: {
    [TemplateContextCategory.Standard]: {
      descriptionKey: 'entry_standard_toolbar_feature',
      dataType: TemplateContextDataType.Boolean,
      isDeprecatedOption: true,
    },
  },
  render: createOptionRenderer(({ templates }) => templates.action.mode !== TemplateActionMode.Popup),
};
