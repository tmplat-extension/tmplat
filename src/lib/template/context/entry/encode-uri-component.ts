import { ExtensionVersion } from 'extension/common/extension-version.enum';
import { TemplateContextCategory } from 'extension/template/context/template-context-category.enum';
import { TemplateContextDataType } from 'extension/template/context/template-context-data-type.enum';
import { TemplateContextName } from 'extension/template/context/template-context-name.enum';
import { TemplateContextEntryDefinition } from 'extension/template/context/template-context.model';
import { createTrimmedContentRenderer } from 'extension/template/context/template-context.utils';

export const encodeUriComponent: TemplateContextEntryDefinition = {
  name: TemplateContextName.EncodeUriComponent,
  added: ExtensionVersion.V2_0_0,
  categories: {
    [TemplateContextCategory.Operation]: {
      descriptionKey: 'context_encode_uri_component_operation_description',
      inputDataType: TemplateContextDataType.String,
      outputDataType: TemplateContextDataType.String,
    },
  },
  render: createTrimmedContentRenderer((content) => encodeURIComponent(content)),
};
