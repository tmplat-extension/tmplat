import { GetTabContentMessageExpressionType } from 'extension/tab/message/get-tab-content-message-expression-type.enum';
import { GetTabContentMessageFormat } from 'extension/tab/message/get-tab-content-message-format.enum';

export type GetTabContentMessage = {
  readonly expression: string;
  readonly expressionType: GetTabContentMessageExpressionType;
  readonly format: GetTabContentMessageFormat;
  readonly queryAll: boolean;
};

export type GetTabContentMessageReply = {
  readonly output: string | readonly string[];
};
