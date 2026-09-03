import { TemplateContextName } from 'extension/template/context/template-context-name.enum';
import { type TemplateContextEntryDefinitionAlias } from 'extension/template/context/template-context.model';

export const anchorTarget: TemplateContextEntryDefinitionAlias = {
  name: TemplateContextName.AnchorTarget,
  aliasOf: TemplateContextName.LinksTarget,
  added: '1.0.0',
  deprecated: '1.2.5',
};
