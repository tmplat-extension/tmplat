import { inject, injectable } from 'extension/common/di';
import { IntlService, IntlServiceToken } from 'extension/common/intl/intl.service';
import { Logger } from 'extension/common/logging/logger';
import { LoggingService, LoggingServiceToken } from 'extension/common/logging/logging.service';
import { isString } from 'extension/common/type.utils';
import { Tab } from 'extension/tab/tab.model';
import { isTab } from 'extension/tab/tab.utils';
import { TemplateContextMenuMode } from 'extension/template/template-context-menu-mode.enum';
import { TemplateEngine, TemplateEngineToken } from 'extension/template/template-engine';
import { TemplateContextMenuInfo, TemplateService, TemplateServiceToken } from 'extension/template/template.service';

const ContextMenuServiceName = 'ContextMenuService';

export const ContextMenuServiceToken = Symbol(ContextMenuServiceName);

@injectable()
export class ContextMenuService {
  private static readonly OPTIONS_MENU_ID = 'options';
  private static readonly TEMPLATE_MENU_ID_PREFIX = 'template.';

  private readonly logger: Logger;

  constructor(
    @inject(IntlServiceToken) private readonly intl: IntlService,
    @inject(LoggingServiceToken) loggingService: LoggingService,
    @inject(TemplateEngineToken) private readonly templateEngine: TemplateEngine,
    @inject(TemplateServiceToken) private readonly templateService: TemplateService,
  ) {
    this.logger = loggingService.createLogger(ContextMenuServiceName);
  }

  listen() {
    browser.contextMenus.onClicked.addListener((info, tab) => {
      this.onClicked(info, tab).catch((error) => {
        this.logger.error('Failed to handle context menu click event', error);
      });
    });

    this.templateService.addChangeListener((data) => {
      this.updateInternal(this.templateService.createTemplateContextMenuInfo(data)).catch((error) => {
        this.logger.error('Failed to update context menu', error);
      });
    });
  }

  async update() {
    const contextMenuInfo = await this.templateService.getTemplateContextMenuInfo();

    await this.updateInternal(contextMenuInfo);
  }

  private static async createMenuItem(options: CreateMenuItemOptions): Promise<string> {
    return new Promise((resolve, reject) => {
      browser.contextMenus.create(options, () => {
        if (browser.runtime.lastError) {
          reject(new Error(browser.runtime.lastError.message));
        } else {
          resolve(options.id);
        }
      });
    });
  }

  private static getClickUrl(info: browser.contextMenus.OnClickData, tab: Tab): URL {
    return new URL(info.linkUrl || info.srcUrl || info.frameUrl || info.pageUrl || tab.url);
  }

  private static getMenuItemId({ menuItemId }: browser.contextMenus.OnClickData): string {
    if (isString(menuItemId)) {
      return menuItemId;
    }

    throw new Error(`Invalid context menu item id: '${menuItemId}'`);
  }

  private async onClicked(info: browser.contextMenus.OnClickData, tab?: browser.tabs.Tab) {
    const menuItemId = ContextMenuService.getMenuItemId(info);

    if (menuItemId === ContextMenuService.OPTIONS_MENU_ID) {
      return await browser.runtime.openOptionsPage();
    }

    const templatePrefixIndex = menuItemId.indexOf(ContextMenuService.TEMPLATE_MENU_ID_PREFIX);
    if (templatePrefixIndex !== 0) {
      return;
    }

    const { templates } = await this.templateService.getTemplateContextMenuInfo();
    const templateId = menuItemId.substring(ContextMenuService.TEMPLATE_MENU_ID_PREFIX.length, menuItemId.length);
    const template = templates.find((template) => template.id === templateId);
    if (!template) {
      throw new Error(`Template could not be found: '${templateId}'`);
    }

    if (!isTab(tab)) {
      throw new Error('Tab could not be found');
    }

    const url = ContextMenuService.getClickUrl(info, tab);

    await this.templateEngine.execute({
      tab,
      template,
      url,
    });
  }

  private async updateInternal(contextMenuInfo: TemplateContextMenuInfo) {
    await browser.contextMenus.removeAll();

    if (!contextMenuInfo.enabled) {
      return;
    }

    // TODO: Should this be a limited set?
    const contexts: browser.contextMenus.CreateProperties['contexts'] = [browser.contextMenus.ContextType.ALL];
    if (contextMenuInfo.mode === TemplateContextMenuMode.Template) {
      await ContextMenuService.createMenuItem({
        contexts,
        id: `${ContextMenuService.TEMPLATE_MENU_ID_PREFIX}${contextMenuInfo.templateId}`,
        title: this.intl.getMessage('name'),
      });
      return;
    }

    const parentId = await ContextMenuService.createMenuItem({
      contexts,
      id: 'parent',
      title: this.intl.getMessage('name'),
    });

    if (contextMenuInfo.templates.length) {
      try {
        await Promise.all(
          contextMenuInfo.templates.map((template) =>
            ContextMenuService.createMenuItem({
              contexts,
              parentId,
              id: `${ContextMenuService.TEMPLATE_MENU_ID_PREFIX}${template.id}`,
              title: this.templateService.getTemplateTitle(template),
            }),
          ),
        );
      } catch (e) {
        this.logger.error('Failed to add one or more context menu items', e);
      }
    } else {
      try {
        await ContextMenuService.createMenuItem({
          contexts,
          parentId,
          enabled: false,
          id: 'empty',
          title: this.intl.getMessage('menu_empty'),
        });
      } catch (e) {
        this.logger.error('Failed to add empty context menu item', e);
      }
    }

    if (contextMenuInfo.optionLinkEnabled) {
      try {
        await Promise.all([
          ContextMenuService.createMenuItem({
            contexts,
            parentId,
            id: 'separator',
            type: 'separator',
          }),
          ContextMenuService.createMenuItem({
            contexts,
            parentId,
            id: ContextMenuService.OPTIONS_MENU_ID,
            title: this.intl.getMessage('options'),
          }),
        ]);
      } catch (e) {
        this.logger.error('Failed to add options context menu item', e);
      }
    }
  }
}

type CreateMenuItemOptions = browser.contextMenus.CreateProperties & {
  id: string;
};
