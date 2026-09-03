import { unescape as _unescape } from 'es-toolkit';
import { TemplateContextCategory } from 'extension/template/context/template-context-category.enum';
import { TemplateContextDataType } from 'extension/template/context/template-context-data-type.enum';
import { TemplateContextName } from 'extension/template/context/template-context-name.enum';
import { type TemplateContextEntryDefinition } from 'extension/template/context/template-context.model';
import { createContentRenderer } from 'extension/template/context/template-context.utils';

export const unescapeHtml: TemplateContextEntryDefinition = {
  name: TemplateContextName.UnescapeHtml,
  added: '2.0.0',
  categories: {
    [TemplateContextCategory.Operation]: {
      descriptionKey: 'context_unescape_html_operation_description',
      inputDataType: TemplateContextDataType.String,
      outputDataType: TemplateContextDataType.String,
    },
  },
  render: createContentRenderer((content) => _unescape(content)),
};
