import { TemplateContextCategory } from 'extension/template/context/template-context-category.enum';
import { TemplateContextDataType } from 'extension/template/context/template-context-data-type.enum';
import { TemplateContextFeature } from 'extension/template/context/template-context-feature.enum';
import { TemplateContextName } from 'extension/template/context/template-context-name.enum';
import { type TemplateContextEntryDefinition } from 'extension/template/context/template-context.model';
import { createTrimmedContentRenderer } from 'extension/template/context/template-context.utils';

/** Looks up a `<meta>` tag's content by its `name`/`http-equiv`/`property` attribute (e.g. `{#meta}og:title{/meta}`). */
export const meta: TemplateContextEntryDefinition = {
  name: TemplateContextName.Meta,
  added: '2.0.0',
  categories: {
    [TemplateContextCategory.Operation]: {
      descriptionKey: 'context_meta_operation_description',
      inputDataType: TemplateContextDataType.String,
      outputDataType: TemplateContextDataType.String,
    },
  },
  features: [TemplateContextFeature.TabContext],
  render: createTrimmedContentRenderer(async (content, manager) => {
    const { meta: tabMeta } = await manager.getTabContext();
    return tabMeta[content];
  }),
};
