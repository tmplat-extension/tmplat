import { type CopyMessageInput, type CopyMessageOutput } from 'extension/common/clipboard/message/copy-message.schema';
import { inject, injectable } from 'extension/common/di';
import { ExtensionError } from 'extension/common/error/extension-error';
import { type Logger } from 'extension/common/logging/logger';
import { type LoggingService, LoggingServiceToken } from 'extension/common/logging/logging.service';
import { MessageType } from 'extension/common/message/message-type.enum';
import { type OffscreenService, OffscreenServiceToken } from 'extension/common/offscreen/offscreen.service';

const ClipboardServiceName = 'ClipboardService';

export const ClipboardServiceToken = Symbol(ClipboardServiceName);

@injectable()
export class ClipboardService {
  private readonly logger: Logger;

  constructor(
    @inject(OffscreenServiceToken) private readonly offscreenService: OffscreenService,
    @inject(LoggingServiceToken) logging: LoggingService,
  ) {
    this.logger = logging.getLogger(ClipboardServiceName);
  }

  async copy(content: string): Promise<void> {
    this.logger.debug('Copying content to clipboard', { content });

    const { copied } = await this.offscreenService.sendMessageAwaitResponse<CopyMessageInput, CopyMessageOutput>(
      MessageType.Copy,
      { content },
    );
    if (!copied) {
      this.logger.error('Failed to copy content to clipboard', { content });

      throw ExtensionError.from('CLI500000');
    } else {
      this.logger.debug('Successfully copied content to clipboard', { content });
    }
  }
}
