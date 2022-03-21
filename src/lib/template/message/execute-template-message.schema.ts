import Joi from 'joi';

import { ExecuteTemplateMessageOutcome } from 'extension/template/message/execute-template-message-outcome.enum';
import { ExecuteTemplateMessageSource } from 'extension/template/message/execute-template-message-source.enum';
import {
  ExecuteTemplateMessage,
  ExecuteTemplateMessageReply,
} from 'extension/template/message/execute-template-message.model';

export const executeTemplateMessageSchema = Joi.alternatives().try(
  Joi.object<ExecuteTemplateMessage>({
    id: Joi.string().min(1).required(),
    source: Joi.string().valid(ExecuteTemplateMessageSource.Popup).required(),
    url: Joi.string().uri(),
  }),
  Joi.object<ExecuteTemplateMessage>({
    shortcut: Joi.string().min(1).max(1).required(),
    source: Joi.string().valid(ExecuteTemplateMessageSource.Shortcut).required(),
    url: Joi.string().uri(),
  }),
);

export const executeTemplateMessageReplySchema = Joi.alternatives().try(
  Joi.object<ExecuteTemplateMessageReply>({
    outcome: Joi.string().valid(ExecuteTemplateMessageOutcome.Skipped).required(),
    reason: Joi.string().min(1).required(),
  }),
  Joi.object<ExecuteTemplateMessageReply>({
    outcome: Joi.string().valid(ExecuteTemplateMessageOutcome.Executed).required(),
    output: Joi.string().min(1).required(),
  }),
);
