import { defineMessageConfigWithResponse } from 'extension/common/message/message-config';
import { MessageType } from 'extension/common/message/message-type.enum';
import {
  TabContextMessageInputSchema,
  TabContextMessageOutputSchema,
} from 'extension/tab/message/tab-context-message.schema';

export const TabContextMessageConfig = defineMessageConfigWithResponse(MessageType.TabContext, {
  input: TabContextMessageInputSchema,
  output: TabContextMessageOutputSchema,
});
