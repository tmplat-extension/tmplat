import { TemplateContextName } from 'extension/template/context/template-context-name.enum';
import { type TemplateContextEntryDefinitionAlias } from 'extension/template/context/template-context.model';

export const contextMenu: TemplateContextEntryDefinitionAlias = {
  name: TemplateContextName.ContextMenu,
  aliasOf: TemplateContextName.Menu,
  added: '1.0.0',
  deprecated: '1.0.0',
};
