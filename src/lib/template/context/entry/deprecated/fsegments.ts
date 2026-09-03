import { TemplateContextName } from 'extension/template/context/template-context-name.enum';
import { type TemplateContextEntryDefinitionAlias } from 'extension/template/context/template-context.model';

export const fsegments: TemplateContextEntryDefinitionAlias = {
  name: TemplateContextName.Fsegments,
  aliasOf: TemplateContextName.HashSegments,
  added: '1.0.0',
  deprecated: '2.0.0',
};
