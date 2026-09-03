import TmplatMustache from 'tmplat-mustache';
import { type ClipboardService, ClipboardServiceToken } from 'extension/common/clipboard/clipboard.service';
import { inject, injectable } from 'extension/common/di';
import { ExtensionError } from 'extension/common/error/extension-error';
import { type IntlService, IntlServiceToken } from 'extension/common/intl/intl.service';
import { type Logger } from 'extension/common/logging/logger';
import { type LoggingService, LoggingServiceToken } from 'extension/common/logging/logging.service';
import { type Notification } from 'extension/common/notification/notification.model';
import { type NotificationService, NotificationServiceToken } from 'extension/common/notification/notification.service';
import { isInjectableUrl } from 'extension/common/url.utils';
import { type Tab } from 'extension/tab/tab.model';
import {
  type TemplateContextManagerFactory,
  TemplateContextManagerFactoryToken,
} from 'extension/template/context/template-context-manager.factory';
import { type Template } from 'extension/template/template.model';
import { type TemplateService, TemplateServiceToken } from 'extension/template/template.service';

const TemplateEngineName = 'TemplateEngine';

export const TemplateEngineToken = Symbol(TemplateEngineName);

@injectable()
export class TemplateEngine {
  private readonly logger: Logger;

  constructor(
    @inject(ClipboardServiceToken) private readonly clipboardService: ClipboardService,
    @inject(IntlServiceToken) private readonly intl: IntlService,
    @inject(LoggingServiceToken) logging: LoggingService,
    @inject(NotificationServiceToken) private readonly notificationService: NotificationService,
    @inject(TemplateContextManagerFactoryToken)
    private readonly templateContextManagerFactory: TemplateContextManagerFactory,
    @inject(TemplateServiceToken) private readonly templateService: TemplateService,
  ) {
    this.logger = logging.getLogger(TemplateEngineName);
  }

  async execute(options: TemplateEngineExecuteOptions): Promise<string> {
    let output: string;

    try {
      if (!(options.tab.url && isInjectableUrl(new URL(options.tab.url)))) {
        throw ExtensionError.from('TEE403000', this.templateService.getTemplateTitle(options.template));
      }

      output = await this.compile(options);

      await this.clipboardService.copy(output);
    } catch (e) {
      await this.notify(options, {
        message:
          e instanceof ExtensionError
            ? e.message
            : this.intl.getMessage(
                'template_execution_fail_general_description',
                this.templateService.getTemplateTitle(options.template),
              ),
        title: this.intl.getMessage('template_execution_fail_title'),
      });

      throw e;
    }

    await this.notify(options, {
      message: this.intl.getMessage(
        'template_execution_success_description',
        this.templateService.getTemplateTitle(options.template),
      ),
      title: this.intl.getMessage('template_execution_success_title'),
    });

    return output;
  }

  private async notify(options: TemplateEngineExecuteOptions, notification: Notification): Promise<void> {
    if (options.suppressNotifications) {
      return;
    }

    try {
      await this.notificationService.createNotification(notification);
    } catch (e) {
      this.logger.error('Failed to create template execution notification:', e);
    }
  }

  private async compile(options: TemplateEngineExecuteOptions): Promise<string> {
    const contextManager = this.templateContextManagerFactory.createTemplateContextManager(options);
    const output = await TmplatMustache.render(options.template.content, contextManager.context);
    if (!output) {
      throw ExtensionError.from('TEE400000', this.templateService.getTemplateTitle(options.template));
    }

    return output;
  }
}

export type TemplateEngineExecuteOptions = {
  suppressNotifications?: boolean;
  tab: Tab;
  template: Template;
  url: URL;
};
