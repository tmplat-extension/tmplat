import { allFulfilled } from 'allfulfilled';
import { inject, injectable, multiInject } from 'extension/common/di';
import { ExtensionError } from 'extension/common/error/extension-error';
import { type ExtensionInfo, ExtensionInfoToken } from 'extension/common/extension-info';
import { type Logger } from 'extension/common/logging/logger';
import { type LoggingService, LoggingServiceToken } from 'extension/common/logging/logging.service';
import { mapMessageConfigs, type MessageConfig, MessageConfigToken } from 'extension/common/message/message-config';
import { type MessageIdGenerator, MessageIdGeneratorToken } from 'extension/common/message/message-id-generator';
import { MessageType } from 'extension/common/message/message-type.enum';
import { type MessageInput, MessageOutputSchema } from 'extension/common/message/message.schema';
import { type ValidationService, ValidationServiceToken } from 'extension/common/validation/validation.service';
import {
  type TabContentMessageInput,
  type TabContentMessageOutput,
} from 'extension/tab/message/tab-content-message.schema';
import {
  type TabContextMessageInput,
  type TabContextMessageOutput,
} from 'extension/tab/message/tab-context-message.schema';
import { type TabContext } from 'extension/tab/tab-context.schema';
import { type Tab, type TabCriteria } from 'extension/tab/tab.model';
import { filterTab, isTab } from 'extension/tab/tab.utils';

const TabServiceName = 'TabService';

export const TabServiceToken = Symbol(TabServiceName);

@injectable()
export class TabService {
  private readonly configs: ReadonlyMap<MessageType, MessageConfig<unknown, unknown>>;
  private readonly logger: Logger;

  constructor(
    @inject(ExtensionInfoToken) private readonly extensionInfo: ExtensionInfo,
    @inject(LoggingServiceToken) logging: LoggingService,
    @multiInject(MessageConfigToken) messageConfigs: Array<MessageConfig<unknown, unknown>>,
    @inject(MessageIdGeneratorToken) private readonly messageIdGenerator: MessageIdGenerator,
    @inject(ValidationServiceToken) private readonly validationService: ValidationService,
  ) {
    this.configs = mapMessageConfigs(messageConfigs);
    this.logger = logging.getLogger(TabServiceName);
  }

  async createExtensionTab(path?: string, params?: Record<string, string>) {
    await this.createTab(this.extensionInfo.createExtensionUrl(path, params).toString());
  }

  async createTab(url: string) {
    await browser.tabs.create({ url });
  }

  async executeScriptInAllTabs(filePath: string, criteria?: TabCriteria): Promise<void> {
    const tabs = await this.findAllTabs(criteria);

    // `executeScriptInTab` logs and swallows its own failures, so no reason can reach a reducer here and the
    // default `aggregate()` is unreachable. Injecting a script into one tab must not prevent the others.
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

  /**
   * Overloaded on `queryAll` so that a caller receives the shape it asked for rather than a union it has to narrow.
   *
   * The response is validated against the discriminated `TabContentMessageOutputSchema` before it gets here, so the
   * cast is checked rather than assumed — a content script returning the wrong shape rejects with `MSG422000`.
   */
  async getTabContent(tabId: number, message: TabContentMessageInput & { queryAll: true }): Promise<readonly string[]>;
  async getTabContent(tabId: number, message: TabContentMessageInput & { queryAll: false }): Promise<string>;
  async getTabContent(tabId: number, message: TabContentMessageInput): Promise<string | readonly string[]>;
  async getTabContent(tabId: number, message: TabContentMessageInput): Promise<string | readonly string[]> {
    const { output, queryAll } = await this.sendTabMessageAwaitResponse<
      TabContentMessageInput,
      TabContentMessageOutput
    >(tabId, MessageType.TabContent, message);

    // The schema only proves the response is self-consistent. A content script that ignored `queryAll` entirely
    // would still satisfy it while answering a different question from the one asked, which would in turn make the
    // overloads above unsound, so the discriminator is checked against the request as well.
    if (queryAll !== message.queryAll) {
      throw ExtensionError.from('MSG422000', MessageType.TabContent);
    }

    return output;
  }

  async getTabContext(tabId: number): Promise<TabContext> {
    const { context } = await this.sendTabMessageAwaitResponse<TabContextMessageInput, TabContextMessageOutput>(
      tabId,
      MessageType.TabContext,
      {},
    );

    return context;
  }

  async sendAllTabsMessage<Input>(type: MessageType, input: Input, criteria?: TabCriteria): Promise<void> {
    const config = this.getConfig<Input, void>(type);
    const tabs = await this.findAllTabs(criteria);

    // Each message is sent inside its own try/catch below, so no reason can reach a reducer here and the default
    // `aggregate()` is unreachable. A tab that cannot be reached must not prevent the others being messaged.
    await allFulfilled(
      tabs.map(async (tab) => {
        try {
          await this.sendTabMessageInternal(tab.id, config, input);
        } catch (e) {
          this.logger.warn(`Failed to send tab[${tab.id}] '${type}' message:`, e);
        }
      }),
    );
  }

  async sendTabMessage<Input>(tabId: number, type: MessageType, input: Input): Promise<void> {
    const config = this.getConfig<Input, void>(type);
    return this.sendTabMessageInternal(tabId, config, input);
  }

  async sendTabMessageAwaitResponse<Input, Output>(tabId: number, type: MessageType, input: Input): Promise<Output> {
    const config = this.getConfig<Input, Output>(type);
    const id = this.messageIdGenerator.generate();

    this.logger.trace(`Sending tab[${tabId}] '${type}' message[${id}]:`, input);

    if (!config.responds) {
      throw ExtensionError.from('MSG400201', type);
    }

    const data = this.validationService.validateSchema(input, config.schemas.input, {
      code: 'MSG400000',
      parentLogger: this.logger,
      substitutions: [type],
    });

    const response = await browser.tabs.sendMessage(tabId, { data, id, type } satisfies MessageInput);
    const output = this.validationService.validateSchema(response, MessageOutputSchema, {
      code: 'MSG422000',
      parentLogger: this.logger,
      substitutions: [type],
    });

    if (output.result === 'failure') {
      throw ExtensionError.fromJSON(output.error, { logger: this.logger });
    }

    return this.validationService.validateSchema(output.data, config.schemas.output, {
      code: 'MSG422000',
      parentLogger: this.logger,
      substitutions: [type],
    });
  }

  private getConfig<Input, Output>(type: MessageType): MessageConfig<Input, Output> {
    const config = this.configs.get(type);
    if (!config) {
      this.logger.error('Failed to find message config for type:', type);

      throw ExtensionError.from('MSG404100', type);
    }

    return config as MessageConfig<Input, Output>;
  }

  private async sendTabMessageInternal<Input>(
    tabId: number,
    config: MessageConfig<Input, void>,
    input: Input,
  ): Promise<void> {
    const { type } = config;
    const id = this.messageIdGenerator.generate();

    this.logger.trace(`Sending tab[${tabId}] '${type}' message[${id}]:`, input);

    if (config.responds) {
      throw ExtensionError.from('MSG400200', type);
    }

    const data = this.validationService.validateSchema(input, config.schemas.input, {
      code: 'MSG400000',
      parentLogger: this.logger,
      substitutions: [type],
    });

    return browser.tabs.sendMessage(tabId, { data, id, type } satisfies MessageInput);
  }
}
