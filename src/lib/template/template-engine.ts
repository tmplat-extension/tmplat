import TmplatMustache from 'tmplat-mustache';

import { inject, injectable } from 'extension/common/di';
import { ExtensionError } from 'extension/common/extension-error';
import { IntlMessageKey } from 'extension/common/intl/intl-message-key.enum';
import { IntlService, IntlServiceToken } from 'extension/common/intl/intl.service';
import { MessageType } from 'extension/common/message/message-type.enum';
import { NotificationService, NotificationServiceToken } from 'extension/common/notification/notification.service';
import { Tab } from 'extension/tab/tab.model';
import { TabService, TabServiceToken } from 'extension/tab/tab.service';
import {
  TemplateContextManagerFactory,
  TemplateContextManagerFactoryToken,
} from 'extension/template/context/template-context-manager.factory';
import { CopyMessage } from 'extension/template/message/copy-message.model';
import { Template } from 'extension/template/template.model';
import { TemplateService, TemplateServiceToken } from 'extension/template/template.service';

export const TemplateEngineToken = Symbol('TemplateEngine');

@injectable()
export class TemplateEngine {
  constructor(
    @inject(IntlServiceToken) private readonly intl: IntlService,
    @inject(NotificationServiceToken) private readonly notificationService: NotificationService,
    @inject(TabServiceToken) private readonly tabService: TabService,
    @inject(TemplateContextManagerFactoryToken)
    private readonly templateContextManagerFactory: TemplateContextManagerFactory,
    @inject(TemplateServiceToken) private readonly templateService: TemplateService,
  ) {}

  async execute(config: TemplateEngineConfig): Promise<string> {
    try {
      const output = await this.compile(config);

      await this.tabService.sendTabMessage<CopyMessage>(config.tab.id, MessageType.Copy, { content: output });

      await this.notificationService.createNotification({
        message: this.intl.getMessage(
          IntlMessageKey.TemplateExecutionSuccessDescription,
          this.templateService.getTemplateTitle(config.template),
        ),
        title: this.intl.getMessage(IntlMessageKey.TemplateExecutionSuccessTitle),
      });

      return output;
    } catch (e) {
      await this.notificationService.createNotification({
        message:
          e instanceof ExtensionError
            ? e.message
            : this.intl.getMessage(
                IntlMessageKey.TemplateExecutionFailGeneralDescription,
                this.templateService.getTemplateTitle(config.template),
              ),
        title: this.intl.getMessage(IntlMessageKey.TemplateExecutionFailTitle),
      });

      throw e;
    }
  }

  private async compile(config: TemplateEngineConfig): Promise<string> {
    const contextManager = this.templateContextManagerFactory.createTemplateContextManager(config);
    const output = await TmplatMustache.render(config.template.content, contextManager.context);
    if (!output) {
      throw new ExtensionError(
        this.intl.getMessage(
          IntlMessageKey.TemplateExecutionFailEmptyDescription,
          this.templateService.getTemplateTitle(config.template),
        ),
      );
    }

    return output;
  }
}

export type TemplateEngineConfig = {
  readonly tab: Tab;
  readonly template: Template;
  readonly url: URL;
};
