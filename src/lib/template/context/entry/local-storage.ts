import { TemplateContextCategory } from 'extension/template/context/template-context-category.enum';
import { TemplateContextDataType } from 'extension/template/context/template-context-data-type.enum';
import { TemplateContextFeature } from 'extension/template/context/template-context-feature.enum';
import { TemplateContextName } from 'extension/template/context/template-context-name.enum';
import { type TemplateContextEntryDefinition } from 'extension/template/context/template-context.model';
import { createTrimmedContentRenderer } from 'extension/template/context/template-context.utils';

/** Looks up a Web Storage `localStorage` value by key (e.g. `{#localStorage}myKey{/localStorage}`). */
export const localStorage: TemplateContextEntryDefinition = {
  name: TemplateContextName.LocalStorage,
  added: '2.0.0',
  categories: {
    [TemplateContextCategory.Operation]: {
      descriptionKey: 'context_local_storage_operation_description',
      inputDataType: TemplateContextDataType.String,
      outputDataType: TemplateContextDataType.String,
    },
  },
  features: [TemplateContextFeature.TabContext],
  render: createTrimmedContentRenderer(async (content, manager) => {
    const { storage } = await manager.getTabContext();

    return storage.local[content];
  }),
};
