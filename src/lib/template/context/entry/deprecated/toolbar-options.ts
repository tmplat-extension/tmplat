import { TemplateContextCategory } from 'extension/template/context/template-context-category.enum';
import { TemplateContextDataType } from 'extension/template/context/template-context-data-type.enum';
import { TemplateContextName } from 'extension/template/context/template-context-name.enum';
import { type TemplateContextEntryDefinition } from 'extension/template/context/template-context.model';
import { createOptionRenderer } from 'extension/template/context/template-context.utils';

export const toolbarOptions: TemplateContextEntryDefinition = {
  name: TemplateContextName.ToolbarOptions,
  added: '1.0.0',
  deprecated: '2.0.0',
  categories: {
    [TemplateContextCategory.Standard]: {
      descriptionKey: 'entry_standard_toolbar_options',
      dataType: TemplateContextDataType.Boolean,
      isDeprecatedOption: true,
    },
  },
  render: createOptionRenderer(({ templates }) => templates.action.popup.optionLinkEnabled),
};
