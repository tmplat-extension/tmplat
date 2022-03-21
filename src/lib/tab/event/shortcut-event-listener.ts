import { inject, injectable } from 'extension/common/di';
import { EventListener } from 'extension/common/event/event-listener';
import { LogService, LogServiceToken } from 'extension/common/log/log.service';
import { Logger } from 'extension/common/log/logger';
import { MessageType } from 'extension/common/message/message-type.enum';
import { MessageService, MessageServiceToken } from 'extension/common/message/message.service';
import { isShortcutModifierActive } from 'extension/common/system/system.utils';
import { TabService, TabServiceToken } from 'extension/tab/tab.service';
import { ExecuteTemplateMessageOutcome } from 'extension/template/message/execute-template-message-outcome.enum';
import { ExecuteTemplateMessageSource } from 'extension/template/message/execute-template-message-source.enum';
import {
  ExecuteTemplateMessage,
  ExecuteTemplateMessageReply,
} from 'extension/template/message/execute-template-message.model';
import { TemplateService, TemplateServiceToken, TemplateShortcutInfo } from 'extension/template/template.service';

const ShortcutEventListenerName = 'ShortcutEventListener';

@injectable()
export class ShortcutEventListener implements EventListener {
  private cache: TemplateShortcutInfo | null = null;
  private readonly logger: Logger;

  constructor(
    @inject(LogServiceToken) logService: LogService,
    @inject(MessageServiceToken) private readonly messageService: MessageService,
    @inject(TabServiceToken) private readonly tabService: TabService,
    @inject(TemplateServiceToken) private readonly templateService: TemplateService,
  ) {
    this.logger = logService.createLogger(ShortcutEventListenerName);
  }

  listen() {
    addEventListener('keydown', this.onKeyDown.bind(this));

    this.templateService.getTemplateShortcutInfo().then(
      (data) => {
        this.cache = data;
      },
      (error) => {
        this.logger.error('Failed to get template settings', error);
      },
    );

    this.templateService.addChangeListener(async (data) => {
      this.cache = this.templateService.createTemplateShortcutInfo(data);
    });
  }

  private async onKeyDown(event: KeyboardEvent): Promise<void> {
    const shortcut = this.getShortcut(event);
    if (!shortcut) {
      return;
    }

    event.preventDefault();

    const target = ShortcutEventListener.getPasteTarget(event.target);
    const autoPaste = target && this.cache?.autoPasteEnabled;

    const tab = await this.tabService.getCurrentTab();

    const reply = await this.messageService.sendMessageAndAwaitReply<
      ExecuteTemplateMessage,
      ExecuteTemplateMessageReply
    >(MessageType.ExecuteTemplate, {
      source: ExecuteTemplateMessageSource.Shortcut,
      shortcut,
      tabId: tab?.id,
    });

    if (reply.outcome === ExecuteTemplateMessageOutcome.Executed && autoPaste) {
      ShortcutEventListener.paste(target, reply.output);
    }
  }

  private static getPasteTarget(target: EventTarget | null): HTMLInputElement | HTMLTextAreaElement | undefined {
    if (!target) {
      return;
    }

    switch ((target as Element).nodeName) {
      case 'INPUT':
        return target as HTMLInputElement;
      case 'TEXTAREA':
        return target as HTMLTextAreaElement;
      default:
        return;
    }
  }

  private getShortcut(event: KeyboardEvent): string | null {
    if (!(this.cache && this.cache.enabled && isShortcutModifierActive(event))) {
      return null;
    }

    const key = String.fromCharCode(event.keyCode).toUpperCase();

    return this.isShortcutEnabled(key) ? key : null;
  }

  private static isEditable(element: HTMLInputElement | HTMLTextAreaElement): boolean {
    return !(element.disabled || element.readOnly);
  }

  private isShortcutEnabled(shortcut: string): boolean {
    const cache = this.cache;

    return cache != null && cache.enabled && cache.shortcuts.includes(shortcut);
  }

  private static paste(element: HTMLInputElement | HTMLTextAreaElement, value: string) {
    if (element.selectionStart == null || element.selectionEnd == null) {
      // Input element is not text-based (e.g. checkbox)
      return;
    }
    if (!ShortcutEventListener.isEditable(element)) {
      return;
    }

    let buffer = element.value.substring(0, element.selectionStart);
    buffer += value;
    buffer += element.value.substring(element.selectionEnd, element.value.length);

    element.value = buffer;
  }
}
