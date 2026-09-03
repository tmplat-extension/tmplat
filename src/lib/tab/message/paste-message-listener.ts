import { inject, injectable } from 'extension/common/di';
import { type Logger } from 'extension/common/logging/logger';
import { type LoggingService, LoggingServiceToken } from 'extension/common/logging/logging.service';
import { VoidMessageListener } from 'extension/common/message/message-listener';
import { MessageType } from 'extension/common/message/message-type.enum';
import { type MessageService, MessageServiceToken } from 'extension/common/message/message.service';
import {
  type ContextMenuTargetHolder,
  ContextMenuTargetHolderToken,
} from 'extension/common/state/context-menu-target-holder';
import { type PasteMessageInput } from 'extension/tab/message/paste-message.schema';
import { getPasteTarget, paste } from 'extension/tab/paste.utils';

const PasteMessageListenerName = 'PasteMessageListener';

/**
 * Pastes the output of a context menu template execution into the field the menu was opened on.
 *
 * The element cannot be resolved from the message itself, because the background worker has no reference to a DOM
 * node — only Chrome's `OnClickData.editable` flag, which says an editable context was clicked but not which
 * element it was. The element is therefore taken from {@link ContextMenuTargetHolder}, which
 * `ContextMenuEventListener` populates from the `contextmenu` event that opened the menu in the first place.
 */
@injectable()
export class PasteMessageListener extends VoidMessageListener<PasteMessageInput> {
  private readonly logger: Logger;

  constructor(
    @inject(ContextMenuTargetHolderToken) private readonly contextMenuTargetHolder: ContextMenuTargetHolder,
    @inject(LoggingServiceToken) logging: LoggingService,
    @inject(MessageServiceToken) messageService: MessageService,
  ) {
    super(messageService, MessageType.Paste);

    this.logger = logging.getLogger(PasteMessageListenerName);
  }

  protected async onMessage({ value }: PasteMessageInput): Promise<void> {
    const target = getPasteTarget(this.contextMenuTargetHolder.get());
    if (!target) {
      /*
       * Reachable whenever the worker's view and the page's disagree: Chrome reports `contenteditable` elements as
       * editable, and the recorded target can also have been cleared by a blur/click between opening the menu and
       * choosing an item. The copy itself has already succeeded, so there is nothing to report to the user.
       */
      this.logger.debug('Ignoring paste message as no editable target was recorded for the context menu');

      return;
    }

    if (!paste(target, value)) {
      this.logger.debug('Ignoring paste message as the recorded context menu target cannot be written to');
    }
  }
}
