import { ExecuteTemplateMessageOutcome } from 'extension/template/message/execute-template-message-outcome.enum';
import { ExecuteTemplateMessageSource } from 'extension/template/message/execute-template-message-source.enum';

export type ExecuteTemplateMessage = { readonly tabId?: number; readonly url?: string } & (
  | {
      readonly id: string;
      readonly source: ExecuteTemplateMessageSource.Popup;
    }
  | {
      readonly shortcut: string;
      readonly source: ExecuteTemplateMessageSource.Shortcut;
    }
);

export type ExecuteTemplateMessageReply =
  | {
      readonly outcome: ExecuteTemplateMessageOutcome.Executed;
      readonly output: string;
    }
  | {
      readonly outcome: ExecuteTemplateMessageOutcome.Skipped;
      readonly reason: string;
    };
