import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { type MessageSender } from 'extension/common/message/message.model';
import { type MessageService } from 'extension/common/message/message.service';
import { type TabService } from 'extension/tab/tab.service';
import type * as ListenerModuleExports from 'extension/template/message/execute-template-message-listener';
import { ExecuteTemplateMessageOutcome } from 'extension/template/message/execute-template-message-outcome.enum';
import { ExecuteTemplateMessageSource } from 'extension/template/message/execute-template-message-source.enum';
import { type ExecuteTemplateMessageInput } from 'extension/template/message/execute-template-message.schema';
import { type TemplateEngine } from 'extension/template/template-engine';
import { type Template } from 'extension/template/template.model';
import { type TemplateService } from 'extension/template/template.service';

// The listener imports `TemplateEngineToken`, which transitively loads `markdown.service` -> Europa, and Europa
// references the browser-only `self` global at module-evaluation time. The Node test environment has no `self`, so it
// is stubbed and the module is imported dynamically after the stub is in place (mirroring `markdown.service.test.ts`).
type ListenerModule = typeof ListenerModuleExports;

let ExecuteTemplateMessageListener: ListenerModule['ExecuteTemplateMessageListener'];

const TAB = { id: 7, url: 'https://example.com/page' } as browser.tabs.Tab;
const TEMPLATE = { id: 'tpl-1', title: 'My template' } as unknown as Template;

const popupInput = (overrides: Partial<ExecuteTemplateMessageInput> = {}): ExecuteTemplateMessageInput =>
  ({
    id: 'tpl-1',
    source: ExecuteTemplateMessageSource.Popup,
    ...overrides,
  }) as ExecuteTemplateMessageInput;

describe('ExecuteTemplateMessageListener', () => {
  let tabService: { getTab: ReturnType<typeof vi.fn> };
  let templateEngine: { execute: ReturnType<typeof vi.fn> };
  let templateService: {
    findTemplateById: ReturnType<typeof vi.fn>;
    findTemplateByShortcut: ReturnType<typeof vi.fn>;
  };
  let listener: InstanceType<ListenerModule['ExecuteTemplateMessageListener']>;

  const invoke = (input: ExecuteTemplateMessageInput, sender: MessageSender = {} as MessageSender) =>
    (
      listener as unknown as { onMessage(i: ExecuteTemplateMessageInput, s: MessageSender): Promise<unknown> }
    ).onMessage(input, sender);

  beforeAll(async () => {
    vi.stubGlobal('self', globalThis);
    ({ ExecuteTemplateMessageListener } = await import('extension/template/message/execute-template-message-listener'));
  });

  beforeEach(() => {
    tabService = { getTab: vi.fn(async () => TAB) };
    templateEngine = { execute: vi.fn(async () => 'rendered output') };
    templateService = {
      findTemplateById: vi.fn(async () => TEMPLATE),
      findTemplateByShortcut: vi.fn(async () => TEMPLATE),
    };
    listener = new ExecuteTemplateMessageListener(
      {} as MessageService,
      tabService as unknown as TabService,
      templateEngine as unknown as TemplateEngine,
      templateService as unknown as TemplateService,
    );
  });

  it('executes the template using the sender tab and reports the output', async () => {
    const result = await invoke(popupInput(), { tab: TAB } as MessageSender);

    expect(result).toEqual({ outcome: ExecuteTemplateMessageOutcome.Executed, output: 'rendered output' });
    expect(tabService.getTab).not.toHaveBeenCalled();
    expect(templateEngine.execute).toHaveBeenCalledWith(
      expect.objectContaining({ tab: TAB, template: TEMPLATE, url: new URL(TAB.url as string) }),
    );
  });

  it('resolves the tab via the tab service when the sender has none but a tabId is given', async () => {
    const result = await invoke(popupInput({ tabId: 7 } as Partial<ExecuteTemplateMessageInput>));

    expect(tabService.getTab).toHaveBeenCalledWith(7);
    expect((result as { outcome: string }).outcome).toBe(ExecuteTemplateMessageOutcome.Executed);
  });

  it('skips when the tab cannot be resolved', async () => {
    tabService.getTab.mockResolvedValue(undefined);

    const result = await invoke(popupInput({ tabId: 7 } as Partial<ExecuteTemplateMessageInput>));

    expect(result).toEqual({ outcome: ExecuteTemplateMessageOutcome.Skipped, reason: 'Tab could not be found' });
    expect(templateEngine.execute).not.toHaveBeenCalled();
  });

  it('prefers the URL from the input over the tab URL', async () => {
    await invoke(popupInput({ url: 'https://override.example/x' } as Partial<ExecuteTemplateMessageInput>), {
      tab: TAB,
    } as MessageSender);

    expect(templateEngine.execute).toHaveBeenCalledWith(
      expect.objectContaining({ url: new URL('https://override.example/x') }),
    );
  });

  it('throws when the resolved URL is invalid', async () => {
    await expect(invoke(popupInput(), { tab: { ...TAB, url: 'not a url' } } as MessageSender)).rejects.toThrow(
      'URL is invalid',
    );
  });

  it('skips when a shortcut resolves to no template', async () => {
    templateService.findTemplateByShortcut.mockResolvedValue(undefined);

    const input = {
      shortcut: 'k',
      source: ExecuteTemplateMessageSource.Shortcut,
    } as unknown as ExecuteTemplateMessageInput;
    const result = await invoke(input, { tab: TAB } as MessageSender);

    expect(templateService.findTemplateByShortcut).toHaveBeenCalledWith('k');
    expect(result).toEqual({ outcome: ExecuteTemplateMessageOutcome.Skipped, reason: 'Template could not be found' });
  });

  it('looks up a popup template by id', async () => {
    await invoke(popupInput(), { tab: TAB } as MessageSender);

    expect(templateService.findTemplateById).toHaveBeenCalledWith('tpl-1');
  });

  it('throws when a popup template id is not found', async () => {
    templateService.findTemplateById.mockResolvedValue(undefined);

    await expect(invoke(popupInput(), { tab: TAB } as MessageSender)).rejects.toThrow(
      "Template not found with ID: 'tpl-1'",
    );
  });

  it('forwards suppressNotifications to the engine', async () => {
    await invoke(popupInput({ suppressNotifications: true } as Partial<ExecuteTemplateMessageInput>), {
      tab: TAB,
    } as MessageSender);

    expect(templateEngine.execute).toHaveBeenCalledWith(expect.objectContaining({ suppressNotifications: true }));
  });
});
