import Joi from 'joi';

import { getEnumStringValues } from 'extension/common/enum.utils';
import { GetTabContentMessageExpressionType } from 'extension/tab/message/get-tab-content-message-expression-type.enum';
import { GetTabContentMessageFormat } from 'extension/tab/message/get-tab-content-message-format.enum';
import { GetTabContentMessage, GetTabContentMessageReply } from 'extension/tab/message/get-tab-content-message.model';

export const getTabContentMessageSchema = Joi.object<GetTabContentMessage>({
  expression: Joi.string().required(),
  expressionType: Joi.string()
    .valid(...getEnumStringValues(GetTabContentMessageExpressionType))
    .required(),
  format: Joi.string()
    .valid(...getEnumStringValues(GetTabContentMessageFormat))
    .required(),
  queryAll: Joi.boolean().required(),
});

export const getTabContentMessageReplySchema = Joi.object<GetTabContentMessageReply>({
  output: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).required(),
});
