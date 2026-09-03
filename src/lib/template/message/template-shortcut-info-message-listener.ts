import { inject, injectable } from 'extension/common/di';
import { RespondingMessageListener } from 'extension/common/message/message-listener';
import { MessageType } from 'extension/common/message/message-type.enum';
import { type MessageService, MessageServiceToken } from 'extension/common/message/message.service';
import {
  type TemplateShortcutInfoMessageInput,
  type TemplateShortcutInfoMessageOutput,
} from 'extension/template/message/template-shortcut-info-message.schema';
import { type TemplateService, TemplateServiceToken } from 'extension/template/template.service';

@injectable()
export class TemplateShortcutInfoMessageListener extends RespondingMessageListener<
  TemplateShortcutInfoMessageInput,
  TemplateShortcutInfoMessageOutput
> {
  constructor(
    @inject(MessageServiceToken) messageService: MessageService,
    @inject(TemplateServiceToken) private readonly templateService: TemplateService,
  ) {
    super(messageService, MessageType.TemplateShortcutInfo);
  }

  protected async onMessage(_input: TemplateShortcutInfoMessageInput): Promise<TemplateShortcutInfoMessageOutput> {
    const { autoPasteEnabled, enabled, shortcuts } = await this.templateService.getTemplateShortcutInfo();

    return { autoPasteEnabled, enabled, shortcuts: [...shortcuts] };
  }
}
