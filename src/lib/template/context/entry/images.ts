import { ExtensionVersion } from 'extension/common/extension-version.enum';
import { TemplateContextCategory } from 'extension/template/context/template-context-category.enum';
import { TemplateContextDataType } from 'extension/template/context/template-context-data-type.enum';
import { TemplateContextFeature } from 'extension/template/context/template-context-feature.enum';
import { TemplateContextName } from 'extension/template/context/template-context-name.enum';
import { TemplateContextEntryDefinition } from 'extension/template/context/template-context.model';
import { createTabContextRenderer } from 'extension/template/context/template-context.utils';

export const images: TemplateContextEntryDefinition = {
  name: TemplateContextName.Images,
  added: ExtensionVersion.V1_0_3,
  categories: {
    [TemplateContextCategory.Collection]: {
      descriptionKey: 'context_images_collection_description',
      dataType: TemplateContextDataType.Array,
      itemDataType: TemplateContextDataType.String,
    },
  },
  features: [TemplateContextFeature.TabContext],
  render: createTabContextRenderer(({ images }) => images),
};
