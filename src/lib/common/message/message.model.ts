import { MessageReplyResult } from 'extension/common/message/message-reply-result.enum';
import { MessageType } from 'extension/common/message/message-type.enum';
import { Tab } from 'extension/tab/tab.model';

export type Message = {
  readonly data: any;
  readonly id: string;
  readonly type: MessageType;
};

export type MessageReply = { readonly id: string } & (
  | {
      readonly reason: string;
      readonly result: MessageReplyResult.Failure;
    }
  | {
      readonly data: any;
      readonly result: MessageReplyResult.Success;
    }
);

export type MessageSender = {
  readonly extensionId?: string;
  readonly frameId?: number;
  readonly tab?: Tab;
  readonly url?: string;
};
