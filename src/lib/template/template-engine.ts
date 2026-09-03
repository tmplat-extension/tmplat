import TmplatMustache from 'tmplat-mustache';
import { ClipboardService, ClipboardServiceToken } from 'extension/common/clipboard/clipboard.service';
import { inject, injectable } from 'extension/common/di';
import { ExtensionError } from 'extension/common/extension-error';
import { ExtensionErrorFactory, ExtensionErrorFactoryToken } from 'extension/common/extension-error-factory';
import { IntlService, IntlServiceToken } from 'extension/common/intl/intl.service';
import { NotificationService, NotificationServiceToken } from 'extension/common/notification/notification.service';
import { isInjectableUrl } from 'extension/common/url.utils';
import { Tab } from 'extension/tab/tab.model';
import {
  TemplateContextManagerFactory,
  TemplateContextManagerFactoryToken,
} from 'extension/template/context/template-context-manager.factory';
import { Template } from 'extension/template/template.model';
import { TemplateService, TemplateServiceToken } from 'extension/template/template.service';

export const TemplateEngineToken = Symbol('TemplateEngine');

@injectable()
export class TemplateEngine {
  constructor(
    @inject(ClipboardServiceToken) private readonly clipboardService: ClipboardService,
    @inject(ExtensionErrorFactoryToken) private readonly errorFactory: ExtensionErrorFactory,
    @inject(IntlServiceToken) private readonly intl: IntlService,
    @inject(NotificationServiceToken) private readonly notificationService: NotificationService,
    @inject(TemplateContextManagerFactoryToken)
    private readonly templateContextManagerFactory: TemplateContextManagerFactory,
    @inject(TemplateServiceToken) private readonly templateService: TemplateService,
  ) {}

  async execute(config: TemplateEngineConfig): Promise<string> {
    if (!(config.tab.url && isInjectableUrl(new URL(config.tab.url)))) {
      throw this.errorFactory.intl(
        'template_execution_fail_protected_description',
        this.templateService.getTemplateTitle(config.template),
      );
    }

    try {
      const output = await this.compile(config);

      await this.clipboardService.copy(output);

      await this.notificationService.createNotification({
        message: this.intl.getMessage(
          'template_execution_success_description',
          this.templateService.getTemplateTitle(config.template),
        ),
        title: this.intl.getMessage('template_execution_success_title'),
      });

      return output;
    } catch (e) {
      await this.notificationService.createNotification({
        message:
          e instanceof ExtensionError
            ? e.message
            : this.intl.getMessage(
                'template_execution_fail_general_description',
                this.templateService.getTemplateTitle(config.template),
              ),
        title: this.intl.getMessage('template_execution_fail_title'),
      });

      throw e;
    }
  }

  private async compile(config: TemplateEngineConfig): Promise<string> {
    const contextManager = this.templateContextManagerFactory.createTemplateContextManager(config);
    const output = await TmplatMustache.render(config.template.content, contextManager.context);
    if (!output) {
      throw this.errorFactory.intl(
        'template_execution_fail_empty_description',
        this.templateService.getTemplateTitle(config.template),
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
