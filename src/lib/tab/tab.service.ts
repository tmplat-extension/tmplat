import { allFulfilled } from 'allfulfilled';
import { inject, injectable } from 'extension/common/di';
import { ExtensionError } from 'extension/common/extension-error';
import { ExtensionInfo, ExtensionInfoToken } from 'extension/common/extension-info';
import { Logger } from 'extension/common/logging/logger';
import { LoggingService, LoggingServiceToken } from 'extension/common/logging/logging.service';
import { MessageIdGenerator, MessageIdGeneratorToken } from 'extension/common/message/message-id-generator';
import { MessageReplyResult } from 'extension/common/message/message-reply-result.enum';
import { MessageType } from 'extension/common/message/message-type.enum';
import { MessageReply } from 'extension/common/message/message.model';
import { messageReplySchema } from 'extension/common/message/message.schema';
import { validateSchemaAsync } from 'extension/common/validation.utils';
import { GetTabContentMessage, GetTabContentMessageReply } from 'extension/tab/message/get-tab-content-message.model';
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
    @inject(LoggingServiceToken) loggingService: LoggingService,
    @inject(MessageIdGeneratorToken) private readonly messageIdGenerator: MessageIdGenerator,
  ) {
    this.logger = loggingService.createLogger(TabServiceName);
  }

  async createExtensionTab(path?: string, params?: Record<string, string>) {
    await this.createTab(this.extensionInfo.createExtensionUrl(path, params).toString());
  }

  async createTab(url: string) {
    await browser.tabs.create({ url });
  }

  async executeScriptInAllTabs(filePath: string, criteria?: TabCriteria): Promise<void> {
    const tabs = await this.findAllTabs(criteria);

    await allFulfilled(tabs.map((tab) => this.executeScriptInTab(tab.id, filePath)));
  }

  async executeScriptInTab(tabId: number, filePath: string): Promise<void> {
    try {
      await browser.scripting.executeScript({ files: [filePath], target: { tabId: tabId } });
    } catch (e) {
      this.logger.error(`Failed to execute '${filePath}' script in tab[${tabId}]:`, e);
    }
  }

  async findActiveTab(criteria: TabCriteria = {}): Promise<Tab | undefined> {
    const query = criteria.query ?? {};
    const [tab] = (await browser.tabs.query({ ...query, active: true, currentWindow: true })) as browser.tabs.Tab[];
    if (!filterTab(tab, criteria.filter)) {
      return;
    }

    return tab;
  }

  async findAllTabs(criteria: TabCriteria = {}): Promise<Tab[]> {
    const tabs = await browser.tabs.query(criteria.query ?? {});

    return tabs.filter((tab) => filterTab(tab, criteria.filter)) as Tab[];
  }

  async findFirstTab(criteria: TabCriteria = {}): Promise<Tab | undefined> {
    const tabs = await browser.tabs.query(criteria.query ?? {});

    return tabs.find((tab) => filterTab(tab, criteria.filter)) as Tab | undefined;
  }

  async getCurrentTab(): Promise<Tab | undefined> {
    const tab = await browser.tabs.getCurrent();

    return isTab(tab) ? tab : undefined;
  }

  async getTab(tabId: number): Promise<Tab | undefined> {
    const tab = await browser.tabs.get(tabId);

    return isTab(tab) ? tab : undefined;
  }

  async getTabContent(tabId: number, message: GetTabContentMessage): Promise<GetTabContentMessageReply['output']> {
    const { output } = await this.sendTabMessageAndAwaitReply<GetTabContentMessage, GetTabContentMessageReply>(
      tabId,
      MessageType.GetTabContent,
      message,
    );

    return output;
  }

  async getTabContext(tabId: number): Promise<TabContext> {
    const { context } = await this.sendTabMessageAndAwaitReply<unknown, GetTabContextMessageReply>(
      tabId,
      MessageType.GetTabContext,
      null,
    );

    return context;
  }

  async sendAllTabsMessage<D = unknown>(type: MessageType, data: D, criteria?: TabCriteria): Promise<void> {
    const tabs = await this.findAllTabs(criteria);

    await allFulfilled(
      tabs.map(async (tab) => {
        try {
          await this.sendTabMessage(tab.id, type, data);
        } catch (e) {
          this.logger.warn(`Failed to send tab[${tab.id}] '${type}' message:`, e);
        }
      }),
    );
  }

  sendTabMessage<D = unknown>(tabId: number, type: MessageType, data: D): Promise<void> {
    const id = this.messageIdGenerator.generate();

    this.logger.trace(`Sending tab[${tabId}] '${type}' message[${id}]:`, data);

    return browser.tabs.sendMessage(tabId, { data, id, type });
  }

  async sendTabMessageAndAwaitReply<D = unknown, R = unknown>(tabId: number, type: MessageType, data: D): Promise<R> {
    const id = this.messageIdGenerator.generate();

    this.logger.trace(`Sending tab[${tabId}] '${type}' message[${id}]:`, data);

    const response = await browser.tabs.sendMessage(tabId, { data, id, type });
    const reply = await validateSchemaAsync<MessageReply>(messageReplySchema, response, {
      // TODO: Localise error message and use ExtensionError instead?
      general: (error) => new Error(`Message reply was invalid: ${error?.message}`),
      undefinedValue: () => new Error('Message reply cannot be validated'),
    });

    if (reply.result === MessageReplyResult.Failure) {
      throw new ExtensionError(reply.reason);
    }

    return reply.data as R;
  }
}
