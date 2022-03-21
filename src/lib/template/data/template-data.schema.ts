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
  TemplateDataTemplatePredefined,
  TemplateDataTemplatePredefinedTitle,
  TemplateDataTemplateUserDefined,
  TemplateDataTemplateUserDefinedTitle,
} from 'extension/template/data/template-data.model';
import { TemplateActionMode } from 'extension/template/template-action-mode.enum';
import { TemplateTitleMode } from 'extension/template/template-title-mode.enum';

export const templateDataActionSchema = Joi.object<TemplateDataAction>({
  mode: Joi.string()
    .valid(...getEnumStringValues(TemplateActionMode))
    .required(),
  popup: Joi.object<TemplateDataActionPopup>({
    autoCloseEnabled: Joi.boolean().required(),
    optionLinkEnabled: Joi.boolean().required(),
  }).required(),
  templateId: Joi.string().min(1).required(),
});

export const templateDataContextMenuSchema = Joi.object<TemplateDataContextMenu>({
  autoPasteEnabled: Joi.boolean().required(),
  enabled: Joi.boolean().required(),
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

export const templateDataTemplateSchema = Joi.alternatives().try(
  Joi.object<TemplateDataTemplatePredefined>({
    content: Joi.string().min(1).required(),
    enabled: Joi.boolean().required(),
    icon: Joi.string().allow(null).required(),
    id: Joi.string().min(1).required(),
    predefined: Joi.boolean().valid(true).required(),
    shortcut: Joi.string().min(1).max(1).allow(null).required(),
    title: Joi.object<TemplateDataTemplatePredefinedTitle>({
      key: Joi.string().min(1).required(),
      mode: Joi.number().valid(TemplateTitleMode.Localized).required(),
    }).required(),
  }),
  Joi.object<TemplateDataTemplateUserDefined>({
    content: Joi.string().min(1).required(),
    enabled: Joi.boolean().required(),
    icon: Joi.string().allow(null).required(),
    id: Joi.string().min(1).required(),
    predefined: Joi.boolean().valid(false).required(),
    shortcut: Joi.string().min(1).max(1).allow(null).required(),
    title: Joi.object<TemplateDataTemplateUserDefinedTitle>({
      mode: Joi.number().valid(TemplateTitleMode.Exact).required(),
      value: Joi.string().min(1).required(),
    }).required(),
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
