import { inject, injectable } from 'extension/common/di';
import { type Logger } from 'extension/common/logging/logger';
import { type LoggingService, LoggingServiceToken } from 'extension/common/logging/logging.service';
import { MessageType } from 'extension/common/message/message-type.enum';
import { type TabService, TabServiceToken } from 'extension/tab/tab.service';
import { type TemplateShortcutInfoChangedMessageInput } from 'extension/template/message/template-shortcut-info-message.schema';
import { type TemplateService, TemplateServiceToken } from 'extension/template/template.service';

const TemplateShortcutBroadcasterName = 'TemplateShortcutBroadcaster';

export const TemplateShortcutBroadcasterToken = Symbol(TemplateShortcutBroadcasterName);

/**
 * Tells every injected content script to refresh its cached shortcut configuration whenever templates or template
 * settings change.
 *
 * Content scripts used to observe this themselves through `storage.onChanged`, which stopped being possible once
 * templates moved to local storage - that area is restricted to trusted contexts because it also holds URL shortener
 * credentials. Without this broadcast, a tab opened before the user edited a shortcut would keep the old one for the
 * rest of its lifetime.
 */
@injectable()
export class TemplateShortcutBroadcaster {
  private readonly logger: Logger;

  constructor(
    @inject(LoggingServiceToken) logging: LoggingService,
    @inject(TabServiceToken) private readonly tabService: TabService,
    @inject(TemplateServiceToken) private readonly templateService: TemplateService,
  ) {
    this.logger = logging.getLogger(TemplateShortcutBroadcasterName);
  }

  listen(): void {
    this.templateService.addChangeListener(() => {
      void this.broadcast();
    });
  }

  private async broadcast(): Promise<void> {
    try {
      await this.tabService.sendAllTabsMessage<TemplateShortcutInfoChangedMessageInput>(
        MessageType.TemplateShortcutInfoChanged,
        {},
      );
    } catch (error) {
      this.logger.error('Failed to broadcast template shortcut change', error);
    }
  }
}
