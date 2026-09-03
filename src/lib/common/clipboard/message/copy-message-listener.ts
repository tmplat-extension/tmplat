import { type CopyMessageInput, type CopyMessageOutput } from 'extension/common/clipboard/message/copy-message.schema';
import { inject, injectable } from 'extension/common/di';
import { RespondingMessageListener } from 'extension/common/message/message-listener';
import { MessageType } from 'extension/common/message/message-type.enum';
import { type MessageService, MessageServiceToken } from 'extension/common/message/message.service';

@injectable()
export class CopyMessageListener extends RespondingMessageListener<CopyMessageInput, CopyMessageOutput> {
  constructor(@inject(MessageServiceToken) messageService: MessageService) {
    super(messageService, MessageType.Copy);
  }

  protected async onMessage({ content }: CopyMessageInput): Promise<CopyMessageOutput> {
    // `navigator.clipboard` requires a focused document and offscreen documents can never be focused,
    // so the content is selected within a temporary textarea (which also preserves the formatting of
    // multiline content) and copied using the legacy `document.execCommand` API instead.
    const textArea = document.createElement('textarea');
    textArea.value = content;

    document.body.append(textArea);

    try {
      textArea.select();

      return { copied: document.execCommand('copy') };
    } finally {
      textArea.remove();
    }
  }
}
