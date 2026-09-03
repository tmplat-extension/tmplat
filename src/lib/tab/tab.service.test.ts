import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { type ExtensionInfo } from 'extension/common/extension-info';
import { type LoggingService } from 'extension/common/logging/logging.service';
import { defineMessageConfig, type MessageConfig } from 'extension/common/message/message-config';
import { type MessageIdGenerator } from 'extension/common/message/message-id-generator';
import { MessageType } from 'extension/common/message/message-type.enum';
import { ValidationService } from 'extension/common/validation/validation.service';
import { TabContentMessageConfig } from 'extension/tab/message/tab-content-message-config';
import { TabContentMessageExpressionType } from 'extension/tab/message/tab-content-message-expression-type.enum';
import { TabContentMessageFormat } from 'extension/tab/message/tab-content-message-format.enum';
import { TabContextMessageConfig } from 'extension/tab/message/tab-context-message-config';
import { type Tab } from 'extension/tab/tab.model';
import { TabService } from 'extension/tab/tab.service';
import { getBrowserApiMock } from 'extension/test/browser-api.mock';
import { createLoggingServiceMock, type LoggingServiceMock } from 'extension/test/logger.mock';
import { createTab, createTabContext } from 'extension/test/tab.fake';

const MESSAGE_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const RESPONSE_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

// A non-responding config, so `sendTabMessage`/`sendAllTabsMessage` have a valid type to drive and the
// responds-mismatch branches can be exercised in both directions.
const VOID_CONFIG = defineMessageConfig(MessageType.ConvertMarkdown, {
  input: z.object({ value: z.string() }),
});

const CONTENT_INPUT = {
  expression: 'h1',
  expressionType: TabContentMessageExpressionType.Selector,
  format: TabContentMessageFormat.Text,
  queryAll: false,
};

const failureError = () => ({
  code: 'CLI500000',
  message: 'boom',
  name: 'ExtensionError(CLI500000)',
});

describe('TabService', () => {
  let logging: LoggingServiceMock;
  let extensionInfo: { createExtensionUrl: ReturnType<typeof vi.fn> };

  const createService = (
    configs = [TabContentMessageConfig, TabContextMessageConfig, VOID_CONFIG] as Array<MessageConfig<unknown, unknown>>,
  ) => {
    logging = createLoggingServiceMock();
    extensionInfo = {
      createExtensionUrl: vi.fn(() => new URL('chrome-extension://test-extension-id/options.html?foo=bar')),
    };
    const messageIdGenerator = { generate: vi.fn(() => MESSAGE_ID) } as unknown as MessageIdGenerator;

    return new TabService(
      extensionInfo as unknown as ExtensionInfo,
      logging as unknown as LoggingService,
      configs,
      messageIdGenerator,
      new ValidationService(createLoggingServiceMock() as never),
    );
  };

  describe('createTab', () => {
    it('creates a tab for the given url', async () => {
      const service = createService();

      await service.createTab('https://www.example.com/');

      expect(getBrowserApiMock().tabs.create).toHaveBeenCalledWith({ url: 'https://www.example.com/' });
    });
  });

  describe('createExtensionTab', () => {
    it('resolves the extension url and opens it in a new tab', async () => {
      const service = createService();

      await service.createExtensionTab('options.html', { foo: 'bar' });

      expect(extensionInfo.createExtensionUrl).toHaveBeenCalledWith('options.html', { foo: 'bar' });
      expect(getBrowserApiMock().tabs.create).toHaveBeenCalledWith({
        url: 'chrome-extension://test-extension-id/options.html?foo=bar',
      });
    });
  });

  describe('executeScriptInTab', () => {
    it('injects the file into the target tab', async () => {
      const service = createService();

      await service.executeScriptInTab(7, 'content.js');

      expect(getBrowserApiMock().scripting.executeScript).toHaveBeenCalledWith({
        files: ['content.js'],
        target: { tabId: 7 },
      });
    });

    it('logs and swallows an injection failure rather than rejecting', async () => {
      const service = createService();
      getBrowserApiMock().scripting.executeScript.mockRejectedValue(new Error('no access'));

      await expect(service.executeScriptInTab(7, 'content.js')).resolves.toBeUndefined();
      expect(logging.logger.error).toHaveBeenCalled();
    });
  });

  describe('executeScriptInAllTabs', () => {
    it('injects the file into every matching tab', async () => {
      const service = createService();
      getBrowserApiMock().tabs.query.mockResolvedValue([createTab({ id: 1 }), createTab({ id: 2 })]);

      await service.executeScriptInAllTabs('content.js');

      expect(getBrowserApiMock().scripting.executeScript).toHaveBeenCalledTimes(2);
      expect(getBrowserApiMock().scripting.executeScript).toHaveBeenCalledWith({
        files: ['content.js'],
        target: { tabId: 1 },
      });
      expect(getBrowserApiMock().scripting.executeScript).toHaveBeenCalledWith({
        files: ['content.js'],
        target: { tabId: 2 },
      });
    });

    it('resolves even when one injection fails, since failures are swallowed per-tab', async () => {
      const service = createService();
      getBrowserApiMock().tabs.query.mockResolvedValue([createTab({ id: 1 }), createTab({ id: 2 })]);
      getBrowserApiMock().scripting.executeScript.mockRejectedValueOnce(new Error('boom'));

      await expect(service.executeScriptInAllTabs('content.js')).resolves.toBeUndefined();
    });
  });

  describe('findActiveTab', () => {
    it('queries the active tab of the current window and returns it', async () => {
      const service = createService();
      const tab = createTab({ id: 5 });
      getBrowserApiMock().tabs.query.mockResolvedValue([tab]);

      await expect(service.findActiveTab({ query: { url: '*://*/*' } })).resolves.toBe(tab);
      expect(getBrowserApiMock().tabs.query).toHaveBeenCalledWith({
        active: true,
        currentWindow: true,
        url: '*://*/*',
      });
    });

    it('returns undefined when the active tab is not a valid tab', async () => {
      const service = createService();
      getBrowserApiMock().tabs.query.mockResolvedValue([{ id: 5 }]);

      await expect(service.findActiveTab()).resolves.toBeUndefined();
    });

    it('returns undefined when a supplied filter rejects the tab', async () => {
      const service = createService();
      getBrowserApiMock().tabs.query.mockResolvedValue([createTab({ url: 'https://blocked.test/' })]);

      await expect(
        service.findActiveTab({ filter: (tab: Tab) => !tab.url.includes('blocked') }),
      ).resolves.toBeUndefined();
    });
  });

  describe('findAllTabs', () => {
    it('returns only the tabs that pass the filter', async () => {
      const service = createService();
      getBrowserApiMock().tabs.query.mockResolvedValue([
        createTab({ id: 1, url: 'https://keep.test/' }),
        createTab({ id: 2, url: 'https://blocked.test/' }),
        { id: 3 },
      ]);

      const tabs = await service.findAllTabs({ filter: (tab: Tab) => !tab.url.includes('blocked') });

      expect(tabs.map((tab) => tab.id)).toEqual([1]);
    });
  });

  describe('findFirstTab', () => {
    it('returns the first tab that passes the filter', async () => {
      const service = createService();
      getBrowserApiMock().tabs.query.mockResolvedValue([{ id: 1 }, createTab({ id: 2 }), createTab({ id: 3 })]);

      const tab = await service.findFirstTab();

      expect(tab?.id).toBe(2);
    });

    it('returns undefined when nothing matches', async () => {
      const service = createService();
      getBrowserApiMock().tabs.query.mockResolvedValue([]);

      await expect(service.findFirstTab()).resolves.toBeUndefined();
    });
  });

  describe('getCurrentTab', () => {
    it('returns the current tab when it is a valid tab', async () => {
      const service = createService();
      const tab = createTab();
      getBrowserApiMock().tabs.getCurrent.mockResolvedValue(tab);

      await expect(service.getCurrentTab()).resolves.toBe(tab);
    });

    it('returns undefined when there is no current tab', async () => {
      const service = createService();
      getBrowserApiMock().tabs.getCurrent.mockResolvedValue(undefined);

      await expect(service.getCurrentTab()).resolves.toBeUndefined();
    });
  });

  describe('getTab', () => {
    it('returns the tab when it is a valid tab', async () => {
      const service = createService();
      const tab = createTab({ id: 9 });
      getBrowserApiMock().tabs.get.mockResolvedValue(tab);

      await expect(service.getTab(9)).resolves.toBe(tab);
      expect(getBrowserApiMock().tabs.get).toHaveBeenCalledWith(9);
    });

    it('returns undefined when the retrieved tab is not valid', async () => {
      const service = createService();
      getBrowserApiMock().tabs.get.mockResolvedValue({ id: 9 });

      await expect(service.getTab(9)).resolves.toBeUndefined();
    });
  });

  describe('getTabContent', () => {
    it('sends a TabContent message and returns the validated output', async () => {
      const service = createService();
      getBrowserApiMock().tabs.sendMessage.mockResolvedValue({
        data: { output: ['a', 'b'] },
        id: RESPONSE_ID,
        result: 'success',
      });

      await expect(service.getTabContent(3, CONTENT_INPUT)).resolves.toEqual(['a', 'b']);
      expect(getBrowserApiMock().tabs.sendMessage).toHaveBeenCalledWith(3, {
        data: CONTENT_INPUT,
        id: MESSAGE_ID,
        type: MessageType.TabContent,
      });
    });
  });

  describe('getTabContext', () => {
    it('sends a TabContext message and returns the validated context', async () => {
      const service = createService();
      const context = createTabContext({ characterSet: 'ISO-8859-1' });
      getBrowserApiMock().tabs.sendMessage.mockResolvedValue({
        data: { context },
        id: RESPONSE_ID,
        result: 'success',
      });

      await expect(service.getTabContext(3)).resolves.toEqual(context);
      expect(getBrowserApiMock().tabs.sendMessage).toHaveBeenCalledWith(3, {
        data: {},
        id: MESSAGE_ID,
        type: MessageType.TabContext,
      });
    });
  });

  describe('sendTabMessage', () => {
    it('posts a validated message for a non-responding type without awaiting a response', async () => {
      const service = createService();

      await service.sendTabMessage(4, MessageType.ConvertMarkdown, { value: 'hi' });

      expect(getBrowserApiMock().tabs.sendMessage).toHaveBeenCalledWith(4, {
        data: { value: 'hi' },
        id: MESSAGE_ID,
        type: MessageType.ConvertMarkdown,
      });
    });

    it('rejects with MSG400200 when used for a type that expects a response', async () => {
      const service = createService();

      await expect(service.sendTabMessage(4, MessageType.TabContent, CONTENT_INPUT)).rejects.toMatchObject({
        code: 'MSG400200',
      });
      expect(getBrowserApiMock().tabs.sendMessage).not.toHaveBeenCalled();
    });

    it('rejects with MSG400000 when the input fails its schema', async () => {
      const service = createService();

      await expect(service.sendTabMessage(4, MessageType.ConvertMarkdown, { value: 123 })).rejects.toMatchObject({
        code: 'MSG400000',
      });
      expect(getBrowserApiMock().tabs.sendMessage).not.toHaveBeenCalled();
    });

    // Regression: `sendTabMessage` was once not declared `async`, so a config lookup miss threw *synchronously*
    // from `getConfig` rather than rejecting, bypassing a caller written as `service.sendTabMessage(...).catch(...)`.
    // Its siblings `sendAllTabsMessage` and `sendTabMessageAwaitResponse` always rejected, so it was inconsistent.
    it('rejects with MSG404100 for an unregistered message type rather than throwing synchronously', async () => {
      const service = createService();
      let promise!: Promise<void>;

      expect(() => {
        promise = service.sendTabMessage(4, MessageType.Geolocation, {});
      }).not.toThrow();
      await expect(promise).rejects.toMatchObject({ code: 'MSG404100' });
    });
  });

  describe('sendAllTabsMessage', () => {
    it('sends the message to every matching tab', async () => {
      const service = createService();
      getBrowserApiMock().tabs.query.mockResolvedValue([createTab({ id: 1 }), createTab({ id: 2 })]);
      getBrowserApiMock().tabs.sendMessage.mockResolvedValue(undefined);

      await service.sendAllTabsMessage(MessageType.ConvertMarkdown, { value: 'hi' });

      expect(getBrowserApiMock().tabs.sendMessage).toHaveBeenCalledTimes(2);
      expect(getBrowserApiMock().tabs.sendMessage).toHaveBeenCalledWith(1, {
        data: { value: 'hi' },
        id: MESSAGE_ID,
        type: MessageType.ConvertMarkdown,
      });
    });

    it('logs and swallows a per-tab failure so the others still complete', async () => {
      const service = createService();
      getBrowserApiMock().tabs.query.mockResolvedValue([createTab({ id: 1 }), createTab({ id: 2 })]);
      getBrowserApiMock().tabs.sendMessage.mockRejectedValueOnce(new Error('gone')).mockResolvedValue(undefined);

      await expect(service.sendAllTabsMessage(MessageType.ConvertMarkdown, { value: 'hi' })).resolves.toBeUndefined();
      expect(logging.logger.warn).toHaveBeenCalled();
    });
  });

  describe('sendTabMessageAwaitResponse', () => {
    it('rejects with MSG400201 when used for a type that expects no response', async () => {
      const service = createService();

      await expect(
        service.sendTabMessageAwaitResponse(4, MessageType.ConvertMarkdown, { value: 'hi' }),
      ).rejects.toMatchObject({ code: 'MSG400201' });
      expect(getBrowserApiMock().tabs.sendMessage).not.toHaveBeenCalled();
    });

    it('rejects with MSG400000 when the input fails its schema', async () => {
      const service = createService();

      await expect(
        service.sendTabMessageAwaitResponse(4, MessageType.TabContent, { expression: 'h1' }),
      ).rejects.toMatchObject({ code: 'MSG400000' });
      expect(getBrowserApiMock().tabs.sendMessage).not.toHaveBeenCalled();
    });

    it('rejects with MSG422000 when the response does not match the output envelope', async () => {
      const service = createService();
      getBrowserApiMock().tabs.sendMessage.mockResolvedValue({ unexpected: true });

      await expect(service.getTabContent(3, CONTENT_INPUT)).rejects.toMatchObject({ code: 'MSG422000' });
    });

    it('rejects with MSG422000 when the success payload does not match the output schema', async () => {
      const service = createService();
      getBrowserApiMock().tabs.sendMessage.mockResolvedValue({
        data: { output: 123 },
        id: RESPONSE_ID,
        result: 'success',
      });

      await expect(service.getTabContent(3, CONTENT_INPUT)).rejects.toMatchObject({ code: 'MSG422000' });
    });

    it('rethrows the original error carried by a failure response', async () => {
      const service = createService();
      getBrowserApiMock().tabs.sendMessage.mockResolvedValue({
        error: failureError(),
        id: RESPONSE_ID,
        result: 'failure',
      });

      await expect(service.getTabContent(3, CONTENT_INPUT)).rejects.toMatchObject({ code: 'CLI500000' });
    });

    it('rejects with MSG404100 for an unregistered message type', async () => {
      const service = createService();

      await expect(service.sendTabMessageAwaitResponse(4, MessageType.Copy, {})).rejects.toMatchObject({
        code: 'MSG404100',
      });
    });
  });
});
