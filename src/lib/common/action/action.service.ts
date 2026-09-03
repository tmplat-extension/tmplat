import { inject, injectable } from 'extension/common/di';
import { type Logger } from 'extension/common/logging/logger';
import { type LoggingService, LoggingServiceToken } from 'extension/common/logging/logging.service';
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
    @inject(LoggingServiceToken) logging: LoggingService,
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

    this.templateService.addChangeListener((data) => {
      this.updateInternal(this.templateService.createTemplateActionInfo(data)).catch((error) => {
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

    const { template, templateId } = actionInfo;
    if (!template) {
      throw new Error(`Template could not be found: '${templateId}'`);
    }

    if (!isTab(tab)) {
      throw new Error('Tab could not be found');
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
