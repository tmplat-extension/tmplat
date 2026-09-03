import { ExtensionVersion } from 'extension/common/extension-version.enum';
import { TemplateContextCategory } from 'extension/template/context/template-context-category.enum';
import { TemplateContextDataType } from 'extension/template/context/template-context-data-type.enum';
import { TemplateContextFeature } from 'extension/template/context/template-context-feature.enum';
import { TemplateContextName } from 'extension/template/context/template-context-name.enum';
import { TemplateContextEntryDefinition } from 'extension/template/context/template-context.model';
import { createTemplateRenderer } from 'extension/template/context/template-context.utils';

/**
 * The template currently being executed.
 *
 * Predefined and user-defined templates share the same shape; a predefined template exposes its localized title and
 * description rather than the message keys backing them.
 */
export const template: TemplateContextEntryDefinition = {
  name: TemplateContextName.Template,
  added: ExtensionVersion.V1_0_0,
  categories: {
    [TemplateContextCategory.Collection]: {
      descriptionKey: 'context_template_collection_description',
      dataType: TemplateContextDataType.Object,
      properties: {
        content: {
          dataType: TemplateContextDataType.String,
          descriptionKey: 'context_template_collection_content_description',
        },
        description: {
          dataType: TemplateContextDataType.String,
          descriptionKey: 'context_template_collection_description_description',
        },
        enabled: {
          dataType: TemplateContextDataType.Boolean,
          descriptionKey: 'context_template_collection_enabled_description',
        },
        id: {
          dataType: TemplateContextDataType.String,
          descriptionKey: 'context_template_collection_id_description',
        },
        predefined: {
          dataType: TemplateContextDataType.Boolean,
          descriptionKey: 'context_template_collection_predefined_description',
        },
        shortcut: {
          dataType: TemplateContextDataType.String,
          descriptionKey: 'context_template_collection_shortcut_description',
        },
        title: {
          dataType: TemplateContextDataType.String,
          descriptionKey: 'context_template_collection_title_description',
        },
      },
    },
  },
  features: [TemplateContextFeature.Template],
  render: createTemplateRenderer((currentTemplate) => ({ ...currentTemplate })),
};
