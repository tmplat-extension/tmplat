import ClipboardJS from 'clipboard';

import { inject, injectable } from 'extension/common/di';
import { OneWayMessageListener } from 'extension/common/message/message-listener';
import { MessageType } from 'extension/common/message/message-type.enum';
import { MessageService, MessageServiceToken } from 'extension/common/message/message.service';
import { CopyMessage } from 'extension/template/message/copy-message.model';
import { copyMessageSchema } from 'extension/template/message/copy-message.schema';

@injectable()
export class CopyMessageListener extends OneWayMessageListener<CopyMessage> {
  constructor(@inject(MessageServiceToken) messageService: MessageService) {
    super(
      {
        schemas: {
          message: copyMessageSchema,
        },
        type: MessageType.Copy,
      },
      messageService,
    );
  }

  protected async onMessage({ content }: CopyMessage): Promise<void> {
    ClipboardJS.copy(content, { container: document.body });
  }
}
