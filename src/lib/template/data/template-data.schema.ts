import Joi from 'joi';
import { getEnumStringValues } from 'extension/common/enum.utils';
import {
  TemplateData,
  TemplateDataAction,
  TemplateDataActionPopup,
  TemplateDataContextMenu,
  TemplateDataLink,
  TemplateDataMarkdown,
  TemplateDataShortcuts,
  TemplateDataTemplate,
  TemplateDataTemplatePredefined,
  TemplateDataTemplateUserDefined,
} from 'extension/template/data/template-data.model';
import { TemplateActionMode } from 'extension/template/template-action-mode.enum';
import { TemplateContextMenuMode } from 'extension/template/template-context-menu-mode.enum';

export const templateDataActionPopupSchema = Joi.object<TemplateDataActionPopup>({
  autoCloseEnabled: Joi.boolean().required(),
  optionLinkEnabled: Joi.boolean().required(),
});

export const templateDataActionSchema = Joi.object<TemplateDataAction>({
  mode: Joi.string()
    .valid(...getEnumStringValues(TemplateActionMode))
    .required(),
  popup: templateDataActionPopupSchema.required(),
  templateId: Joi.string().min(1).allow(null).required(),
});

export const templateDataContextMenuSchema = Joi.object<TemplateDataContextMenu>({
  autoPasteEnabled: Joi.boolean().required(),
  enabled: Joi.boolean().required(),
  mode: Joi.string()
    .valid(...getEnumStringValues(TemplateContextMenuMode))
    .required(),
  optionLinkEnabled: Joi.boolean().required(),
});

export const templateDataLinkSchema = Joi.object<TemplateDataLink>({
  target: Joi.boolean().required(),
  title: Joi.boolean().required(),
});

export const templateDataMarkdownSchema = Joi.object<TemplateDataMarkdown>({
  inline: Joi.boolean().required(),
});

export const templateDataShortcutsSchema = Joi.object<TemplateDataShortcuts>({
  autoPasteEnabled: Joi.boolean().required(),
  enabled: Joi.boolean().required(),
});

export const templateDataTemplateSchema = Joi.alternatives<TemplateDataTemplate>().try(
  Joi.object<TemplateDataTemplatePredefined>({
    enabled: Joi.boolean().required(),
    id: Joi.string().min(1).required(),
    predefined: Joi.boolean().valid(true).required(),
    shortcut: Joi.string().min(1).max(1).allow(null).required(),
  }),
  Joi.object<TemplateDataTemplateUserDefined>({
    content: Joi.string().min(0).required(),
    description: Joi.string().min(0).allow(null).required(),
    enabled: Joi.boolean().required(),
    id: Joi.string().min(1).required(),
    predefined: Joi.boolean().valid(false).required(),
    shortcut: Joi.string().min(1).max(1).allow(null).required(),
    title: Joi.string().min(1).required(),
  }),
);

export const templateDataSchema = Joi.object<TemplateData>({
  action: templateDataActionSchema.required(),
  contextMenu: templateDataContextMenuSchema.required(),
  link: templateDataLinkSchema.required(),
  markdown: templateDataMarkdownSchema.required(),
  shortcuts: templateDataShortcutsSchema.required(),
  templates: Joi.array().items(templateDataTemplateSchema).required(),
});
