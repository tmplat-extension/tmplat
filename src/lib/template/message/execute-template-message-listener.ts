import { inject, injectable } from 'extension/common/di';
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
    if (!(tab || input.tabId === undefined)) {
      tab = await this.tabService.getTab(input.tabId);
    }

    if (!tab) {
      return {
        outcome: ExecuteTemplateMessageOutcome.Skipped,
        // TODO: Localise reason
        reason: 'Tab could not be found',
      };
    }

    let url: URL;
    try {
      url = new URL(input.url ?? tab.url);
    } catch (e) {
      // TODO: Localise error message and use ExtensionError instead
      throw new Error('URL is invalid', { cause: e });
    }

    const template = await this.getTemplate(input);
    if (!template) {
      return {
        outcome: ExecuteTemplateMessageOutcome.Skipped,
        // TODO: Localise reason
        reason: 'Template could not be found',
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
      return await this.templateService.findTemplateByShortcut(input.shortcut);
    }

    const template = await this.templateService.findTemplateById(input.id);
    if (!template) {
      // TODO: Localise error message and use ExtensionError instead
      throw new Error(`Template not found with ID: '${input.id}'`);
    }

    return template;
  }
}
