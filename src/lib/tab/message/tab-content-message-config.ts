import { defineMessageConfigWithResponse } from 'extension/common/message/message-config';
import { MessageType } from 'extension/common/message/message-type.enum';
import {
  TabContentMessageInputSchema,
  TabContentMessageOutputSchema,
} from 'extension/tab/message/tab-content-message.schema';

export const TabContentMessageConfig = defineMessageConfigWithResponse(MessageType.TabContent, {
  input: TabContentMessageInputSchema,
  output: TabContentMessageOutputSchema,
});
