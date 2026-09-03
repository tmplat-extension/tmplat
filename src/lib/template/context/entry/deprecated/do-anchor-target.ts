import { TemplateContextName } from 'extension/template/context/template-context-name.enum';
import { type TemplateContextEntryDefinitionAlias } from 'extension/template/context/template-context.model';

export const doAnchorTarget: TemplateContextEntryDefinitionAlias = {
  name: TemplateContextName.DoAnchorTarget,
  aliasOf: TemplateContextName.LinksTarget,
  added: '1.0.0',
  deprecated: '1.0.0',
};
