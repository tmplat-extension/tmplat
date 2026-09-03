import Joi from 'joi';
import {
  ConvertMarkdownMessage,
  ConvertMarkdownMessageReply,
} from 'extension/common/markdown/message/convert-markdown-message.model';

export const convertMarkdownMessageSchema = Joi.object<ConvertMarkdownMessage>({
  html: Joi.string().min(1).required(),
  inline: Joi.boolean().required(),
});

export const convertMarkdownMessageReplySchema = Joi.object<ConvertMarkdownMessageReply>({
  markdown: Joi.string().allow('').required(),
});
