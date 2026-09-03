import { TemplateContextCategory } from 'extension/template/context/template-context-category.enum';
import { TemplateContextDataType } from 'extension/template/context/template-context-data-type.enum';
import { TemplateContextFeature } from 'extension/template/context/template-context-feature.enum';
import { TemplateContextName } from 'extension/template/context/template-context-name.enum';
import { type TemplateContextEntryDefinition } from 'extension/template/context/template-context.model';
import { createTemplateRenderer } from 'extension/template/context/template-context.utils';

/**
 * The template currently being executed.
 *
 * Predefined and user-defined templates share the same shape; a predefined template exposes its localized title and
 * description rather than the message keys backing them.
 */
export const template: TemplateContextEntryDefinition = {
  name: TemplateContextName.Template,
  added: '1.0.0',
  categories: {
    [TemplateContextCategory.Collection]: {
      descriptionKey: 'entry_collection_template',
      dataType: TemplateContextDataType.Object,
      properties: {
        content: {
          dataType: TemplateContextDataType.String,
          descriptionKey: 'entry_collection_template_content',
        },
        description: {
          dataType: TemplateContextDataType.String,
          descriptionKey: 'entry_collection_template_description',
        },
        enabled: {
          dataType: TemplateContextDataType.Boolean,
          descriptionKey: 'entry_collection_template_enabled',
        },
        id: {
          dataType: TemplateContextDataType.String,
          descriptionKey: 'entry_collection_template_id',
        },
        predefined: {
          dataType: TemplateContextDataType.Boolean,
          descriptionKey: 'entry_collection_template_predefined',
        },
        shortcut: {
          dataType: TemplateContextDataType.String,
          descriptionKey: 'entry_collection_template_shortcut',
        },
        title: {
          dataType: TemplateContextDataType.String,
          descriptionKey: 'entry_collection_template_title',
        },
      },
    },
  },
  features: [TemplateContextFeature.Template],
  render: createTemplateRenderer((currentTemplate) => ({ ...currentTemplate })),
};
