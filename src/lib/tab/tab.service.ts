import { inject, injectable } from 'extension/common/di';
import { ExtensionError } from 'extension/common/extension-error';
import { ExtensionInfo, ExtensionInfoToken } from 'extension/common/extension-info';
import { LogService, LogServiceToken } from 'extension/common/log/log.service';
import { Logger } from 'extension/common/log/logger';
import { MessageIdGenerator, MessageIdGeneratorToken } from 'extension/common/message/message-id-generator';
import { MessageReplyResult } from 'extension/common/message/message-reply-result.enum';
import { MessageType } from 'extension/common/message/message-type.enum';
import { MessageReply } from 'extension/common/message/message.model';
import { messageReplySchema } from 'extension/common/message/message.schema';
import { validateSchemaAsync } from 'extension/common/validation.utils';
import { GetTabContextMessageReply } from 'extension/tab/message/get-tab-context-message.model';
import { Tab, TabContext, TabCriteria } from 'extension/tab/tab.model';
import { filterTab, isTab } from 'extension/tab/tab.utils';

const TabServiceName = 'TabService';

export const TabServiceToken = Symbol(TabServiceName);

@injectable()
export class TabService {
  private readonly logger: Logger;

  constructor(
    @inject(ExtensionInfoToken) private readonly extensionInfo: ExtensionInfo,
    @inject(LogServiceToken) logService: LogService,
    @inject(MessageIdGeneratorToken) private readonly messageIdGenerator: MessageIdGenerator,
  ) {
    this.logger = logService.createLogger(TabServiceName);
  }

  async createExtensionTab(path?: string, params?: Record<string, string>): Promise<void> {
    await this.createTab(this.extensionInfo.createExtensionUrl(path, params).toString());
  }

  async createTab(url: string): Promise<void> {
    await chrome.tabs.create({ url });
  }

  async executeScriptInAllTabs(filePath: string, criteria?: TabCriteria): Promise<void> {
    const tabs = await this.findAllTabs(criteria);

    await Promise.all(
      tabs.map(async (tab) => {
        try {
          await this.executeScriptInTab(tab.id, filePath);
        } catch (e) {
          this.logger.warn(`Failed to execute '${filePath}' script in tab[${tab.id}]:`, e);
        }
      }),
    );
  }

  async executeScriptInTab(tabId: number, filePath: string): Promise<void> {
    await chrome.scripting.executeScript({ files: [filePath], target: { tabId: tabId } });
  }

  async findActiveTab(criteria: TabCriteria = {}): Promise<Tab | undefined> {
    const query = criteria.query ?? {};
    const [tab] = (await chrome.tabs.query({ ...query, active: true, currentWindow: true })) as chrome.tabs.Tab[];
    if (!filterTab(tab, criteria.filter)) {
      return;
    }

    return tab;
  }

  async findAllTabs(criteria: TabCriteria = {}): Promise<Tab[]> {
    const tabs = (await chrome.tabs.query(criteria.query ?? {})) as chrome.tabs.Tab[];

    return tabs.filter((tab) => filterTab(tab, criteria.filter)) as Tab[];
  }

  async findFirstTab(criteria: TabCriteria = {}): Promise<Tab | undefined> {
    const tabs = (await chrome.tabs.query(criteria.query ?? {})) as chrome.tabs.Tab[];

    return tabs.find((tab) => filterTab(tab, criteria.filter)) as Tab | undefined;
  }

  async getCurrentTab(): Promise<Tab | undefined> {
    const tab = await chrome.tabs.getCurrent();
    if (!isTab(tab)) {
      return;
    }

    return tab;
  }

  async getTab(tabId: number): Promise<Tab | undefined> {
    const tab = await chrome.tabs.get(tabId);
    if (!isTab(tab)) {
      return;
    }

    return tab;
  }

  async getTabContext(tabId: number): Promise<TabContext> {
    const { context } = await this.sendTabMessageAndAwaitReply<any, GetTabContextMessageReply>(
      tabId,
      MessageType.GetTabContext,
      null,
    );

    return context;
  }

  async sendAllTabsMessage<D = any>(type: MessageType, data: D, criteria?: TabCriteria): Promise<void> {
    const tabs = await this.findAllTabs(criteria);

    await Promise.all(
      tabs.map(async (tab) => {
        try {
          await this.sendTabMessage(tab.id, type, data);
        } catch (e) {
          this.logger.warn(`Failed to send tab[${tab.id}] '${type}' message:`, e);
        }
      }),
    );
  }

  sendTabMessage<D = any>(tabId: number, type: MessageType, data: D): Promise<void> {
    const id = this.messageIdGenerator.generate();

    this.logger.trace(`Sending tab[${tabId}] '${type}' message[${id}]:`, data);

    return new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(tabId, { data, id, type }, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve();
        }
      });
    });
  }

  async sendTabMessageAndAwaitReply<D = any, R = any>(tabId: number, type: MessageType, data: D): Promise<R> {
    const id = this.messageIdGenerator.generate();

    this.logger.trace(`Sending tab[${tabId}] '${type}' message[${id}]:`, data);

    const response = await new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(tabId, { data, id, type }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    });

    const reply = await validateSchemaAsync<MessageReply>(messageReplySchema, response, {
      // TODO: Localise error message and use ExtensionError instead?
      general: (error) => new Error(`Message reply was invalid: ${error?.message}`),
      undefinedValue: () => new Error('Message reply cannot be validated'),
    });

    if (reply.result === MessageReplyResult.Failure) {
      throw new ExtensionError(reply.reason);
    }

    return reply.data;
  }
}
