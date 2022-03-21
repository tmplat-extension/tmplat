import Joi from 'joi';

import { CopyMessage } from 'extension/template/message/copy-message.model';

export const copyMessageSchema = Joi.object<CopyMessage>({
  content: Joi.string().min(1).required(),
});
