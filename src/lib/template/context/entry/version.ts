import { ExtensionVersion } from 'extension/common/extension-version.enum';
import { TemplateContextCategory } from 'extension/template/context/template-context-category.enum';
import { TemplateContextDataType } from 'extension/template/context/template-context-data-type.enum';
import { TemplateContextFeature } from 'extension/template/context/template-context-feature.enum';
import { TemplateContextName } from 'extension/template/context/template-context-name.enum';
import { TemplateContextEntryDefinition } from 'extension/template/context/template-context.model';
import { createExtensionInfoRenderer } from 'extension/template/context/template-context.utils';

export const version: TemplateContextEntryDefinition = {
  name: TemplateContextName.Version,
  added: ExtensionVersion.V1_0_0,
  categories: {
    [TemplateContextCategory.Standard]: {
      descriptionKey: 'context_version_standard_description',
      dataType: TemplateContextDataType.String,
    },
  },
  features: [TemplateContextFeature.ExtensionInfo],
  render: createExtensionInfoRenderer((extensionInfo) => extensionInfo.getVersion()),
};
