import { inject, injectable } from 'extension/common/di';
import { ExtensionError } from 'extension/common/error/extension-error';
import { type IntlService, IntlServiceToken } from 'extension/common/intl/intl.service';
import { RespondingMessageListener } from 'extension/common/message/message-listener';
import { MessageType } from 'extension/common/message/message-type.enum';
import { type MessageSender } from 'extension/common/message/message.model';
import { type MessageService, MessageServiceToken } from 'extension/common/message/message.service';
import { type TabService, TabServiceToken } from 'extension/tab/tab.service';
import { ExecuteTemplateMessageOutcome } from 'extension/template/message/execute-template-message-outcome.enum';
import { ExecuteTemplateMessageSource } from 'extension/template/message/execute-template-message-source.enum';
import {
  type ExecuteTemplateMessageInput,
  type ExecuteTemplateMessageOutput,
} from 'extension/template/message/execute-template-message.schema';
import { type TemplateEngine, TemplateEngineToken } from 'extension/template/template-engine';
import { type Template } from 'extension/template/template.model';
import { type TemplateService, TemplateServiceToken } from 'extension/template/template.service';

@injectable()
export class ExecuteTemplateMessageListener extends RespondingMessageListener<
  ExecuteTemplateMessageInput,
  ExecuteTemplateMessageOutput
> {
  constructor(
    @inject(IntlServiceToken) private readonly intl: IntlService,
    @inject(MessageServiceToken) messageService: MessageService,
    @inject(TabServiceToken) private readonly tabService: TabService,
    @inject(TemplateEngineToken) private readonly templateEngine: TemplateEngine,
    @inject(TemplateServiceToken) private readonly templateService: TemplateService,
  ) {
    super(messageService, MessageType.ExecuteTemplate);
  }

  protected async onMessage(
    input: ExecuteTemplateMessageInput,
    { tab }: MessageSender,
  ): Promise<ExecuteTemplateMessageOutput> {
    // An explicit `tabId` takes precedence over the sender's own tab. Chrome populates `sender.tab` for *any*
    // extension page loaded in a tab, not just content scripts, so preferring the sender meant such a page asking to
    // run a template against a specific tab silently targeted itself instead.
    if (input.tabId !== undefined) {
      tab = await this.tabService.getTab(input.tabId);
    }

    if (!tab) {
      return {
        outcome: ExecuteTemplateMessageOutcome.Skipped,
        reason: this.intl.getMessage('template_execution_skipped_tab_reason'),
      };
    }

    let url: URL;
    try {
      url = new URL(input.url ?? tab.url);
    } catch (e) {
      throw ExtensionError.fromCause(e, 'TPL422100');
    }

    const template = await this.getTemplate(input);
    if (!template) {
      return {
        outcome: ExecuteTemplateMessageOutcome.Skipped,
        reason: this.intl.getMessage('template_execution_skipped_template_reason'),
      };
    }

    const output = await this.templateEngine.execute({
      suppressNotifications: input.suppressNotifications,
      tab,
      template,
      url,
    });

    return {
      outcome: ExecuteTemplateMessageOutcome.Executed,
      output,
    };
  }

  private async getTemplate(input: ExecuteTemplateMessageInput): Promise<Template | undefined> {
    if (input.source === ExecuteTemplateMessageSource.Shortcut) {
      // `TemplateShortcutInfo` only carries the shortcuts of enabled templates, but it is cached in the content
      // script and refreshed asynchronously, so a keypress can still arrive for one that has just been disabled.
      // Treating that as no match rather than an error matches an unrecognised shortcut, which is equally benign
      const template = await this.templateService.findTemplateByShortcut(input.shortcut);

      return template?.enabled ? template : undefined;
    }

    const template = await this.templateService.findTemplateById(input.id);
    if (!template) {
      throw ExtensionError.from('TPL404000', input.id);
    }

    return template;
  }
}
