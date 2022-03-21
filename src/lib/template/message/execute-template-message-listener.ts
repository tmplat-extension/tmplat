import { isUndefined } from 'lodash-es';

import { inject, injectable } from 'extension/common/di';
import { ReturnMessageListener } from 'extension/common/message/message-listener';
import { MessageType } from 'extension/common/message/message-type.enum';
import { MessageSender } from 'extension/common/message/message.model';
import { MessageService, MessageServiceToken } from 'extension/common/message/message.service';
import { TabService, TabServiceToken } from 'extension/tab/tab.service';
import { ExecuteTemplateMessageOutcome } from 'extension/template/message/execute-template-message-outcome.enum';
import { ExecuteTemplateMessageSource } from 'extension/template/message/execute-template-message-source.enum';
import {
  ExecuteTemplateMessage,
  ExecuteTemplateMessageReply,
} from 'extension/template/message/execute-template-message.model';
import {
  executeTemplateMessageReplySchema,
  executeTemplateMessageSchema,
} from 'extension/template/message/execute-template-message.schema';
import { TemplateEngine, TemplateEngineToken } from 'extension/template/template-engine';
import { Template } from 'extension/template/template.model';
import { TemplateService, TemplateServiceToken } from 'extension/template/template.service';

@injectable()
export class ExecuteTemplateMessageListener extends ReturnMessageListener<
  ExecuteTemplateMessage,
  ExecuteTemplateMessageReply
> {
  constructor(
    @inject(MessageServiceToken) messageService: MessageService,
    @inject(TabServiceToken) private readonly tabService: TabService,
    @inject(TemplateEngineToken) private readonly templateEngine: TemplateEngine,
    @inject(TemplateServiceToken) private readonly templateService: TemplateService,
  ) {
    super(
      {
        schemas: {
          message: executeTemplateMessageSchema,
          reply: executeTemplateMessageReplySchema,
        },
        type: MessageType.ExecuteTemplate,
      },
      messageService,
    );
  }

  protected async onMessage(
    message: ExecuteTemplateMessage,
    { tab }: MessageSender,
  ): Promise<ExecuteTemplateMessageReply> {
    if (!(tab || isUndefined(message.tabId))) {
      tab = await this.tabService.getTab(message.tabId);
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
      url = new URL(message.url ?? tab.url);
    } catch (_) {
      // TODO: Localise error message and use ExtensionError instead
      throw new Error('URL is invalid');
    }

    const template = await this.getTemplate(message);
    if (!template) {
      return {
        outcome: ExecuteTemplateMessageOutcome.Skipped,
        // TODO: Localise reason
        reason: 'Template could not be found',
      };
    }

    const output = await this.templateEngine.execute({ tab, template, url });

    return {
      outcome: ExecuteTemplateMessageOutcome.Executed,
      output,
    };
  }

  private async getTemplate(message: ExecuteTemplateMessage): Promise<Template | undefined> {
    if (message.source === ExecuteTemplateMessageSource.Shortcut) {
      return await this.templateService.findTemplateByShortcut(message.shortcut);
    }

    const template = await this.templateService.findTemplateById(message.id);
    if (!template) {
      // TODO: Localise error message and use ExtensionError instead
      throw new Error(`Template not found with ID: '${message.id}'`);
    }

    return template;
  }
}
