import { TemplateContextName } from 'extension/template/context/template-context-name.enum';
import { type TemplateContextEntryDefinitionAlias } from 'extension/template/context/template-context.model';

export const anchorTitle: TemplateContextEntryDefinitionAlias = {
  name: TemplateContextName.AnchorTitle,
  aliasOf: TemplateContextName.LinksTitle,
  added: '1.0.0',
  deprecated: '1.2.5',
};
