import {
  CopyMessageInputSchema,
  CopyMessageOutputSchema,
} from 'extension/common/clipboard/message/copy-message.schema';
import { defineMessageConfigWithResponse } from 'extension/common/message/message-config';
import { MessageType } from 'extension/common/message/message-type.enum';

export const CopyMessageConfig = defineMessageConfigWithResponse(MessageType.Copy, {
  input: CopyMessageInputSchema,
  output: CopyMessageOutputSchema,
});
