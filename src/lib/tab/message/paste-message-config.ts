import { defineMessageConfig } from 'extension/common/message/message-config';
import { MessageType } from 'extension/common/message/message-type.enum';
import { PasteMessageInputSchema } from 'extension/tab/message/paste-message.schema';

export const PasteMessageConfig = defineMessageConfig(MessageType.Paste, {
  input: PasteMessageInputSchema,
});
