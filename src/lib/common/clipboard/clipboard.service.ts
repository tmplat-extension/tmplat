import { CopyMessage, CopyMessageReply } from 'extension/common/clipboard/message/copy-message.model';
import { inject, injectable } from 'extension/common/di';
import { MessageType } from 'extension/common/message/message-type.enum';
import { OffscreenService, OffscreenServiceToken } from 'extension/common/offscreen/offscreen.service';

export const ClipboardServiceToken = Symbol('ClipboardService');

@injectable()
export class ClipboardService {
  constructor(@inject(OffscreenServiceToken) private readonly offscreenService: OffscreenService) {}

  async copy(content: string): Promise<void> {
    const { copied } = await this.offscreenService.sendMessageAndAwaitReply<CopyMessage, CopyMessageReply>(
      MessageType.Copy,
      { content },
    );
    if (!copied) {
      throw new Error('Content was rejected by the clipboard');
    }
  }
}
