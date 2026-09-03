import { ExtensionVersion } from 'extension/common/extension-version.enum';
import { getOs } from 'extension/common/system/system.utils';
import { TemplateContextCategory } from 'extension/template/context/template-context-category.enum';
import { TemplateContextDataType } from 'extension/template/context/template-context-data-type.enum';
import { TemplateContextName } from 'extension/template/context/template-context-name.enum';
import { TemplateContextEntryDefinition } from 'extension/template/context/template-context.model';

export const os: TemplateContextEntryDefinition = {
  name: TemplateContextName.Os,
  added: ExtensionVersion.V2_0_0,
  categories: {
    [TemplateContextCategory.Standard]: {
      descriptionKey: 'context_os_standard_description',
      dataType: TemplateContextDataType.String,
    },
  },
  render: (manager) => {
    return () => manager.computeCacheIfAbsent(TemplateContextName.Os, () => getOs());
  },
};
