import { defineMessageConfigWithResponse } from 'extension/common/message/message-config';
import { MessageType } from 'extension/common/message/message-type.enum';
import {
  ExecuteTemplateMessageInputSchema,
  ExecuteTemplateMessageOutputSchema,
} from 'extension/template/message/execute-template-message.schema';

export const ExecuteTemplateMessageConfig = defineMessageConfigWithResponse(MessageType.ExecuteTemplate, {
  input: ExecuteTemplateMessageInputSchema,
  output: ExecuteTemplateMessageOutputSchema,
});
