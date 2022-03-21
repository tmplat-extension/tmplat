import Joi from 'joi';

import { getEnumStringValues } from 'extension/common/enum.utils';
import { MessageReplyResult } from 'extension/common/message/message-reply-result.enum';
import { MessageType } from 'extension/common/message/message-type.enum';
import { Message, MessageReply } from 'extension/common/message/message.model';

export const messageSchema = Joi.object<Message>({
  data: Joi.any().required(),
  id: Joi.string().guid().required(),
  type: Joi.string()
    .valid(...getEnumStringValues(MessageType))
    .required(),
});

export const messageReplySchema = Joi.alternatives().try(
  Joi.object<MessageReply>({
    id: Joi.string().guid().required(),
    reason: Joi.string().min(1).required(),
    result: Joi.string().valid(MessageReplyResult.Failure).required(),
  }),
  Joi.object<MessageReply>({
    data: Joi.any().required(),
    id: Joi.string().guid().required(),
    result: Joi.string().valid(MessageReplyResult.Success).required(),
  }),
);
