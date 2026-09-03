import {
  ConvertMarkdownMessageInputSchema,
  ConvertMarkdownMessageOutputSchema,
} from 'extension/common/markdown/message/convert-markdown-message.schema';
import { defineMessageConfigWithResponse } from 'extension/common/message/message-config';
import { MessageType } from 'extension/common/message/message-type.enum';

export const ConvertMarkdownMessageConfig = defineMessageConfigWithResponse(MessageType.ConvertMarkdown, {
  input: ConvertMarkdownMessageInputSchema,
  output: ConvertMarkdownMessageOutputSchema,
});
