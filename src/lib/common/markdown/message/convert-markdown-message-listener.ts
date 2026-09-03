import { inject, injectable } from 'extension/common/di';
import { type MarkdownService, MarkdownServiceToken } from 'extension/common/markdown/markdown.service';
import {
  type ConvertMarkdownMessageInput,
  type ConvertMarkdownMessageOutput,
} from 'extension/common/markdown/message/convert-markdown-message.schema';
import { RespondingMessageListener } from 'extension/common/message/message-listener';
import { MessageType } from 'extension/common/message/message-type.enum';
import { type MessageService, MessageServiceToken } from 'extension/common/message/message.service';

@injectable()
export class ConvertMarkdownMessageListener extends RespondingMessageListener<
  ConvertMarkdownMessageInput,
  ConvertMarkdownMessageOutput
> {
  constructor(
    @inject(MarkdownServiceToken) private readonly markdownService: MarkdownService,
    @inject(MessageServiceToken) messageService: MessageService,
  ) {
    super(messageService, MessageType.ConvertMarkdown);
  }

  protected async onMessage({ html, inline }: ConvertMarkdownMessageInput): Promise<ConvertMarkdownMessageOutput> {
    return { markdown: await this.markdownService.convert(html, { inline }) };
  }
}
