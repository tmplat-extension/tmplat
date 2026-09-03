import Joi from 'joi';
import {
  TEMPLATE_TITLE_MAX_LENGTH,
  TEMPLATE_TRANSFER_VERSION,
  TemplateTransfer,
  TemplateTransferTemplate,
} from 'extension/template/template-transfer.model';

export const templateTransferTemplateSchema = Joi.object<TemplateTransferTemplate>({
  content: Joi.string().min(0).allow('').default(''),
  description: Joi.string().min(0).allow('', null).default(null),
  enabled: Joi.boolean().default(true),
  shortcut: Joi.string().min(1).max(1).allow('', null).default(null),
  title: Joi.string().min(1).max(TEMPLATE_TITLE_MAX_LENGTH).required(),
});

export const templateTransferSchema = Joi.object<TemplateTransfer>({
  templates: Joi.array().items(templateTransferTemplateSchema).min(1).required(),
  version: Joi.number().integer().min(1).max(TEMPLATE_TRANSFER_VERSION).default(TEMPLATE_TRANSFER_VERSION),
});
