import Joi from 'joi';
import { CopyMessage, CopyMessageReply } from 'extension/common/clipboard/message/copy-message.model';

export const copyMessageSchema = Joi.object<CopyMessage>({
  content: Joi.string().min(1).required(),
});

export const copyMessageReplySchema = Joi.object<CopyMessageReply>({
  copied: Joi.boolean().required(),
});
