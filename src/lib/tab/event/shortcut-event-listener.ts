import { inject, injectable } from 'extension/common/di';
import { type EventListener } from 'extension/common/event/event-listener';
import { type Logger } from 'extension/common/logging/logger';
import { type LoggingService, LoggingServiceToken } from 'extension/common/logging/logging.service';
import { MessageType } from 'extension/common/message/message-type.enum';
import { type MessageService, MessageServiceToken } from 'extension/common/message/message.service';
import { isShortcutModifierActive } from 'extension/common/system/system.utils';
import { getPasteTarget, paste } from 'extension/tab/paste.utils';
import { ExecuteTemplateMessageOutcome } from 'extension/template/message/execute-template-message-outcome.enum';
import { ExecuteTemplateMessageSource } from 'extension/template/message/execute-template-message-source.enum';
import {
  type ExecuteTemplateMessageInput,
  type ExecuteTemplateMessageOutput,
} from 'extension/template/message/execute-template-message.schema';
import {
  type TemplateShortcutInfoChangedMessageInput,
  type TemplateShortcutInfoMessageInput,
  type TemplateShortcutInfoMessageOutput,
} from 'extension/template/message/template-shortcut-info-message.schema';
import { type TemplateShortcutInfo } from 'extension/template/template.service';

const ShortcutEventListenerName = 'ShortcutEventListener';

/**
 * Shortcuts are matched on {@link KeyboardEvent.code} rather than `key` or the deprecated `keyCode`.
 *
 * `code` names the physical key (`KeyU`, `Digit1`), which is what the other two cannot reliably provide here: the
 * shortcut modifier is Shift+Alt on macOS and Ctrl+Alt elsewhere (see `isShortcutModifierActive`), and both of those
 * combinations rewrite `key` - Shift+Alt+1 reports `!`, Ctrl+Alt is AltGr on many layouts - so digit shortcuts in
 * particular would never match. `code` also reproduces exactly what `String.fromCharCode(event.keyCode)` used to
 * yield for these keys (85 -> `U`, 49 -> `1`), so replacing the deprecated API changes no shortcut that worked
 * before.
 */
const ShortcutCodePattern = /^(?:Key([A-Z])|Digit([0-9]))$/;

@injectable()
export class ShortcutEventListener implements EventListener {
  private cache: TemplateShortcutInfo | null = null;
  /** The in-flight {@link cache} load, if any, so concurrent keystrokes share one request rather than stampeding. */
  private loading: Promise<void> | null = null;
  /**
   * Incremented whenever a change invalidates the cache, so that a load started before it cannot overwrite the result
   * of one started after it.
   */
  private generation = 0;
  private readonly logger: Logger;

  constructor(
    @inject(LoggingServiceToken) logging: LoggingService,
    @inject(MessageServiceToken) private readonly messageService: MessageService,
  ) {
    this.logger = logging.getLogger(ShortcutEventListenerName);
  }

  listen() {
    addEventListener('keydown', this.onKeyDown.bind(this));

    void this.load();

    // Templates live in local storage, which this context cannot read (see `TemplateShortcutInfoMessageConfig`), so
    // the cache is invalidated by a broadcast from the service worker rather than by observing storage directly
    this.messageService.addMessageListener<TemplateShortcutInfoChangedMessageInput>(
      MessageType.TemplateShortcutInfoChanged,
      async () => {
        await this.reload();
      },
    );
  }

  /**
   * Populates {@link cache}, reusing the in-flight request if one is already running.
   *
   * A failure is logged and swallowed rather than rejecting, both so callers cannot hang and so the failure clears
   * {@link loading} - which is what makes a later keystroke retry instead of being stuck with a permanently empty
   * cache. Without that, a page loaded during a transient storage failure would have dead shortcuts for its whole
   * lifetime, since the only other thing that repopulates the cache is the user changing their settings.
   */
  private async load(): Promise<void> {
    const generation = this.generation;

    this.loading ??= this.messageService
      .sendMessageAwaitResponse<TemplateShortcutInfoMessageInput, TemplateShortcutInfoMessageOutput>(
        MessageType.TemplateShortcutInfo,
        {},
      )
      .then((data) => {
        // A load that was already running when the data changed describes the state before it, so its result is
        // dropped rather than allowed to overwrite a fresher one
        if (generation === this.generation) {
          this.cache = data;
        }
      })
      .catch((error: unknown) => {
        this.logger.error('Failed to get template settings', error);
      })
      .finally(() => {
        this.loading = null;
      });

    await this.loading;
  }

  /** Reloads {@link cache} after a change, ignoring any load that started before it. */
  private async reload(): Promise<void> {
    this.generation++;
    this.loading = null;

    await this.load();
  }

  private async onKeyDown(event: KeyboardEvent): Promise<void> {
    // The cache is populated asynchronously, so a keypress can arrive before it is ready - which used to mean the
    // shortcut silently did nothing. Waiting for the load is the only way to honour that keypress at all.
    // The cost is that `preventDefault()` has no effect once a handler has awaited, so an early shortcut still
    // copies but does not suppress the browser's own handling of the key. Losing the suppression on the first
    // keypress after injection is a far smaller failure than losing the copy.
    const primed = this.cache != null;
    if (!primed) {
      await this.load();
    }

    const shortcut = this.getShortcut(event);
    if (!shortcut) {
      return;
    }

    if (primed) {
      event.preventDefault();
    }

    const target = getPasteTarget(event.target);
    const autoPaste = target && this.cache?.autoPasteEnabled;

    const output = await this.messageService.sendMessageAwaitResponse<
      ExecuteTemplateMessageInput,
      ExecuteTemplateMessageOutput
    >(MessageType.ExecuteTemplate, {
      source: ExecuteTemplateMessageSource.Shortcut,
      shortcut,
    });

    if (output.outcome === ExecuteTemplateMessageOutcome.Executed && autoPaste) {
      paste(target, output.output);
    }
  }

  private getShortcut(event: KeyboardEvent): string | null {
    if (!(this.cache && this.cache.enabled && isShortcutModifierActive(event))) {
      return null;
    }

    const match = ShortcutCodePattern.exec(event.code);
    const key = match?.[1] ?? match?.[2];

    return key && this.isShortcutEnabled(key) ? key : null;
  }

  private isShortcutEnabled(shortcut: string): boolean {
    const cache = this.cache;

    return cache != null && cache.enabled && cache.shortcuts.includes(shortcut);
  }
}
