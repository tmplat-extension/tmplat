import { inject, injectable } from 'extension/common/di';
import { MarkdownService, MarkdownServiceToken } from 'extension/common/markdown/markdown.service';
import {
  ConvertMarkdownMessage,
  ConvertMarkdownMessageReply,
} from 'extension/common/markdown/message/convert-markdown-message.model';
import {
  convertMarkdownMessageReplySchema,
  convertMarkdownMessageSchema,
} from 'extension/common/markdown/message/convert-markdown-message.schema';
import { ReturnMessageListener } from 'extension/common/message/message-listener';
import { MessageType } from 'extension/common/message/message-type.enum';
import { MessageService, MessageServiceToken } from 'extension/common/message/message.service';

@injectable()
export class ConvertMarkdownMessageListener extends ReturnMessageListener<
  ConvertMarkdownMessage,
  ConvertMarkdownMessageReply
> {
  constructor(
    @inject(MarkdownServiceToken) private readonly markdownService: MarkdownService,
    @inject(MessageServiceToken) messageService: MessageService,
  ) {
    super(
      {
        schemas: {
          message: convertMarkdownMessageSchema,
          reply: convertMarkdownMessageReplySchema,
        },
        type: MessageType.ConvertMarkdown,
      },
      messageService,
    );
  }

  protected async onMessage({ html, inline }: ConvertMarkdownMessage): Promise<ConvertMarkdownMessageReply> {
    return { markdown: await this.markdownService.convert(html, { inline }) };
  }
}
