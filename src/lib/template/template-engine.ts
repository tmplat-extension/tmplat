import TmplatMustache from 'tmplat-mustache';
import { type ClipboardService, ClipboardServiceToken } from 'extension/common/clipboard/clipboard.service';
import { inject, injectable } from 'extension/common/di';
import { ExtensionError } from 'extension/common/error/extension-error';
import { type IntlService, IntlServiceToken } from 'extension/common/intl/intl.service';
import { type NotificationService, NotificationServiceToken } from 'extension/common/notification/notification.service';
import { isInjectableUrl } from 'extension/common/url.utils';
import { type Tab } from 'extension/tab/tab.model';
import {
  type TemplateContextManagerFactory,
  TemplateContextManagerFactoryToken,
} from 'extension/template/context/template-context-manager.factory';
import { type Template } from 'extension/template/template.model';
import { type TemplateService, TemplateServiceToken } from 'extension/template/template.service';

export const TemplateEngineToken = Symbol('TemplateEngine');

@injectable()
export class TemplateEngine {
  constructor(
    @inject(ClipboardServiceToken) private readonly clipboardService: ClipboardService,
    @inject(IntlServiceToken) private readonly intl: IntlService,
    @inject(NotificationServiceToken) private readonly notificationService: NotificationService,
    @inject(TemplateContextManagerFactoryToken)
    private readonly templateContextManagerFactory: TemplateContextManagerFactory,
    @inject(TemplateServiceToken) private readonly templateService: TemplateService,
  ) {}

  async execute(options: TemplateEngineExecuteOptions): Promise<string> {
    try {
      if (!(options.tab.url && isInjectableUrl(new URL(options.tab.url)))) {
        throw ExtensionError.from('TEE403000', this.templateService.getTemplateTitle(options.template));
      }

      const output = await this.compile(options);

      await this.clipboardService.copy(output);

      if (!options.suppressNotifications) {
        await this.notificationService.createNotification({
          message: this.intl.getMessage(
            'template_execution_success_description',
            this.templateService.getTemplateTitle(options.template),
          ),
          title: this.intl.getMessage('template_execution_success_title'),
        });
      }

      return output;
    } catch (e) {
      if (!options.suppressNotifications) {
        await this.notificationService.createNotification({
          message:
            e instanceof ExtensionError
              ? e.message
              : this.intl.getMessage(
                  'template_execution_fail_general_description',
                  this.templateService.getTemplateTitle(options.template),
                ),
          title: this.intl.getMessage('template_execution_fail_title'),
        });
      }

      throw e;
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
