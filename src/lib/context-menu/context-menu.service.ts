import { aggregate, allFulfilled } from 'allfulfilled';
import { isString } from 'es-toolkit';
import { inject, injectable } from 'extension/common/di';
import { ExtensionError } from 'extension/common/error/extension-error';
import { type IntlService, IntlServiceToken } from 'extension/common/intl/intl.service';
import { type Logger } from 'extension/common/logging/logger';
import { type LoggingService, LoggingServiceToken } from 'extension/common/logging/logging.service';
import { MessageType } from 'extension/common/message/message-type.enum';
import { type NotificationService, NotificationServiceToken } from 'extension/common/notification/notification.service';
import { type PasteMessageInput } from 'extension/tab/message/paste-message.schema';
import { type Tab } from 'extension/tab/tab.model';
import { type TabService, TabServiceToken } from 'extension/tab/tab.service';
import { isTab } from 'extension/tab/tab.utils';
import { TemplateContextMenuMode } from 'extension/template/template-context-menu-mode.enum';
import { type TemplateEngine, TemplateEngineToken } from 'extension/template/template-engine';
import { type Template } from 'extension/template/template.model';
import {
  type TemplateContextMenuInfo,
  type TemplateService,
  TemplateServiceToken,
} from 'extension/template/template.service';

const ContextMenuServiceName = 'ContextMenuService';

export const ContextMenuServiceToken = Symbol(ContextMenuServiceName);

@injectable()
export class ContextMenuService {
  private static readonly OPTIONS_MENU_ID = 'options';
  private static readonly TEMPLATE_MENU_ID_PREFIX = 'template.';

  private readonly logger: Logger;

  constructor(
    @inject(IntlServiceToken) private readonly intl: IntlService,
    @inject(LoggingServiceToken) logging: LoggingService,
    @inject(NotificationServiceToken) private readonly notificationService: NotificationService,
    @inject(TabServiceToken) private readonly tabService: TabService,
    @inject(TemplateEngineToken) private readonly templateEngine: TemplateEngine,
    @inject(TemplateServiceToken) private readonly templateService: TemplateService,
  ) {
    this.logger = logging.getLogger(ContextMenuServiceName);
  }

  listen() {
    browser.contextMenus.onClicked.addListener((info, tab) => {
      this.onClicked(info, tab).catch((error) => {
        this.logger.error('Failed to handle context menu click event', error);
      });
    });

    this.templateService.addChangeListener(() => {
      this.update().catch((error) => {
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
          reject(ExtensionError.fromCause(browser.runtime.lastError, 'CTX500000'));
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

    throw ExtensionError.from('CTX400000', String(menuItemId));
  }

  /**
   * Resolves the template a clicked menu item stands for.
   *
   * In single-template mode the one item is created from the configured template whether or not it is enabled, so it
   * cannot be looked up in `templates` - that only lists what a *menu* would offer, which excludes disabled
   * templates. Resolving it here lets the caller report "disabled" rather than "missing".
   */
  private static findTemplate(contextMenuInfo: TemplateContextMenuInfo, templateId: string): Template | undefined {
    if (contextMenuInfo.mode === TemplateContextMenuMode.Template) {
      return contextMenuInfo.template.id === templateId ? contextMenuInfo.template : undefined;
    }

    return contextMenuInfo.templates.find((template) => template.id === templateId);
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

    const contextMenuInfo = await this.templateService.getTemplateContextMenuInfo();
    const templateId = menuItemId.substring(ContextMenuService.TEMPLATE_MENU_ID_PREFIX.length, menuItemId.length);
    const template = ContextMenuService.findTemplate(contextMenuInfo, templateId);
    if (!template) {
      throw ExtensionError.from('CTX404000', templateId);
    }

    /*
     * `TemplateEngine.execute` reports its own failures to the user, but these two happen before it is reached, so
     * without this the click would appear to do nothing at all. The same reasoning as `ActionService.onClicked`.
     */
    try {
      if (!template.enabled) {
        throw ExtensionError.from('CTX409000', this.templateService.getTemplateTitle(template));
      }
      if (!isTab(tab)) {
        throw ExtensionError.from('CTX404100');
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

    const url = ContextMenuService.getClickUrl(info, tab);

    const output = await this.templateEngine.execute({
      tab,
      template,
      url,
    });

    if (contextMenuInfo.autoPasteEnabled && info.editable) {
      await this.paste(tab, output);
    }
  }

  /**
   * Pastes `value` into the field the context menu was opened on, if the user has asked for that.
   *
   * `info.editable` only tells us that Chrome considered the clicked context editable; the content script owns the
   * element itself, so it makes the final decision (see `PasteMessageListener`).
   *
   * A failure here is logged and swallowed, because the copy it follows has already succeeded: the output is on the
   * clipboard and the user has been told so. Rethrowing would turn a completed copy into a logged failure, which is
   * the same trap the template engine's notifications used to fall into.
   */
  private async paste(tab: Tab, value: string): Promise<void> {
    try {
      await this.tabService.sendTabMessage<PasteMessageInput>(tab.id, MessageType.Paste, { value });
    } catch (e) {
      this.logger.warn(`Failed to paste template output into tab[${tab.id}]:`, e);
    }
  }

  private async updateInternal(contextMenuInfo: TemplateContextMenuInfo) {
    await browser.contextMenus.removeAll();

    if (!contextMenuInfo.enabled) {
      return;
    }

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
        await allFulfilled(
          contextMenuInfo.templates.map((template) =>
            ContextMenuService.createMenuItem({
              contexts,
              parentId,
              id: `${ContextMenuService.TEMPLATE_MENU_ID_PREFIX}${template.id}`,
              title: this.templateService.getTemplateTitle(template),
            }),
          ),
          // These reasons are only ever logged, so every failure is worth keeping. An explicit message is passed
          // because `AggregateError` otherwise has an empty one.
          aggregate('One or more context menu items could not be added'),
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
        await allFulfilled(
          [
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
          ],
          aggregate('The options context menu items could not be added'),
        );
      } catch (e) {
        this.logger.error('Failed to add options context menu item', e);
      }
    }
  }
}

type CreateMenuItemOptions = browser.contextMenus.CreateProperties & {
  id: string;
};
