import { ExtensionVersion } from 'extension/common/extension-version.enum';
import { TemplateContextCategory } from 'extension/template/context/template-context-category.enum';
import { TemplateContextDataType } from 'extension/template/context/template-context-data-type.enum';
import { TemplateContextFeature } from 'extension/template/context/template-context-feature.enum';
import { TemplateContextName } from 'extension/template/context/template-context-name.enum';
import { TemplateContextEntryDefinition } from 'extension/template/context/template-context.model';
import { createTrimmedContentRenderer } from 'extension/template/context/template-context.utils';

/** Looks up a Web Storage `sessionStorage` value by key (e.g. `{#sessionStorage}myKey{/sessionStorage}`). */
export const sessionStorage: TemplateContextEntryDefinition = {
  name: TemplateContextName.SessionStorage,
  added: ExtensionVersion.V2_0_0,
  categories: {
    [TemplateContextCategory.Operation]: {
      descriptionKey: 'context_session_storage_operation_description',
      inputDataType: TemplateContextDataType.String,
      outputDataType: TemplateContextDataType.String,
    },
  },
  features: [TemplateContextFeature.TabContext],
  render: createTrimmedContentRenderer(async (content, manager) => {
    const { storage } = await manager.getTabContext();

    return storage.session[content];
  }),
};
