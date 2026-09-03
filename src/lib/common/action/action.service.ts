import { inject, injectable } from 'extension/common/di';
import { ExtensionError } from 'extension/common/error/extension-error';
import { type IntlService, IntlServiceToken } from 'extension/common/intl/intl.service';
import { type Logger } from 'extension/common/logging/logger';
import { type LoggingService, LoggingServiceToken } from 'extension/common/logging/logging.service';
import { type NotificationService, NotificationServiceToken } from 'extension/common/notification/notification.service';
import { isTab } from 'extension/tab/tab.utils';
import { TemplateActionMode } from 'extension/template/template-action-mode.enum';
import { type TemplateEngine, TemplateEngineToken } from 'extension/template/template-engine';
import {
  type TemplateActionInfo,
  type TemplateService,
  TemplateServiceToken,
} from 'extension/template/template.service';

const ActionServiceName = 'ActionService';

export const ActionServiceToken = Symbol(ActionServiceName);

@injectable()
export class ActionService {
  private readonly logger: Logger;

  constructor(
    @inject(IntlServiceToken) private readonly intl: IntlService,
    @inject(LoggingServiceToken) logging: LoggingService,
    @inject(NotificationServiceToken) private readonly notificationService: NotificationService,
    @inject(TemplateEngineToken) private readonly templateEngine: TemplateEngine,
    @inject(TemplateServiceToken) private readonly templateService: TemplateService,
  ) {
    this.logger = logging.getLogger(ActionServiceName);
  }

  listen() {
    browser.action.onClicked.addListener((tab) => {
      this.onClicked(tab).catch((error) => {
        this.logger.error('Failed to handle action click event', error);
      });
    });

    this.templateService.addChangeListener(() => {
      this.update().catch((error) => {
        this.logger.error('Failed to update action', error);
      });
    });
  }

  async update() {
    const actionInfo = await this.templateService.getTemplateActionInfo();

    await this.updateInternal(actionInfo);
  }

  private async onClicked(tab: browser.tabs.Tab) {
    const actionInfo = await this.templateService.getTemplateActionInfo();
    if (actionInfo.mode !== TemplateActionMode.Template) {
      return;
    }

    const { template } = actionInfo;

    /*
     * `TemplateEngine.execute` reports its own failures to the user, but these two happen before it is reached, so
     * without this the action click would appear to do nothing at all.
     */
    try {
      if (!template.enabled) {
        throw ExtensionError.from('ACT409000', this.templateService.getTemplateTitle(template));
      }
      if (!isTab(tab)) {
        throw ExtensionError.from('ACT404100');
      }
    } catch (e) {
      // A notification reports the outcome of a click and must never change it, which `notifyError` guarantees by
      // never rejecting.
      await this.notificationService.notifyError(e, {
        messageKey: 'template_execution_fail_general_description',
        substitutions: [this.templateService.getTemplateTitle(template)],
        title: this.intl.getMessage('template_execution_fail_title'),
      });

      throw e;
    }

    await this.templateEngine.execute({
      tab,
      template,
      url: new URL(tab.url),
    });
  }

  private async updateInternal(actionInfo: TemplateActionInfo): Promise<void> {
    await browser.action.setPopup({
      popup: actionInfo.mode === TemplateActionMode.Popup ? 'popup.html' : '',
    });
  }
}
