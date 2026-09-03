import { deburr as _deburr } from 'es-toolkit';
import {
  WikipediaLatin1SupplementLink,
  WikipediaLatinExtendedALink,
} from 'extension/template/context/template-context-category-link';
import { TemplateContextCategory } from 'extension/template/context/template-context-category.enum';
import { TemplateContextDataType } from 'extension/template/context/template-context-data-type.enum';
import { TemplateContextName } from 'extension/template/context/template-context-name.enum';
import { type TemplateContextEntryDefinition } from 'extension/template/context/template-context.model';
import { createContentRenderer } from 'extension/template/context/template-context.utils';

export const deburr: TemplateContextEntryDefinition = {
  name: TemplateContextName.Deburr,
  added: '2.0.0',
  categories: {
    [TemplateContextCategory.Operation]: {
      descriptionKey: 'context_deburr_operation_description',
      inputDataType: TemplateContextDataType.String,
      outputDataType: TemplateContextDataType.String,
      links: [WikipediaLatin1SupplementLink, WikipediaLatinExtendedALink],
    },
  },
  render: createContentRenderer((content) => _deburr(content)),
};
