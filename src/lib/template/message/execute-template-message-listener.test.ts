import { beforeEach, describe, expect, it, vi } from 'vitest';
import { type MessageSender } from 'extension/common/message/message.model';
import { type MessageService } from 'extension/common/message/message.service';
import { type TabService } from 'extension/tab/tab.service';
import { ExecuteTemplateMessageListener } from 'extension/template/message/execute-template-message-listener';
import { ExecuteTemplateMessageOutcome } from 'extension/template/message/execute-template-message-outcome.enum';
import { ExecuteTemplateMessageSource } from 'extension/template/message/execute-template-message-source.enum';
import { type ExecuteTemplateMessageInput } from 'extension/template/message/execute-template-message.schema';
import { type TemplateEngine } from 'extension/template/template-engine';
import { type Template } from 'extension/template/template.model';
import { type TemplateService } from 'extension/template/template.service';
import { asIntlService, createIntlServiceMock, type IntlServiceMock } from 'extension/test/intl.mock';

const TAB = { id: 7, url: 'https://example.com/page' } as browser.tabs.Tab;
const TEMPLATE = { enabled: true, id: 'tpl-1', title: 'My template' } as unknown as Template;

const popupInput = (overrides: Partial<ExecuteTemplateMessageInput> = {}): ExecuteTemplateMessageInput =>
  ({
    id: 'tpl-1',
    source: ExecuteTemplateMessageSource.Popup,
    ...overrides,
  }) as ExecuteTemplateMessageInput;

describe('ExecuteTemplateMessageListener', () => {
  let intl: IntlServiceMock;
  let tabService: { getTab: ReturnType<typeof vi.fn> };
  let templateEngine: { execute: ReturnType<typeof vi.fn> };
  let templateService: {
    findTemplateById: ReturnType<typeof vi.fn>;
    findTemplateByShortcut: ReturnType<typeof vi.fn>;
  };
  let listener: ExecuteTemplateMessageListener;

  const invoke = (input: ExecuteTemplateMessageInput, sender: MessageSender = {} as MessageSender) =>
    (
      listener as unknown as { onMessage(i: ExecuteTemplateMessageInput, s: MessageSender): Promise<unknown> }
    ).onMessage(input, sender);

  beforeEach(() => {
    intl = createIntlServiceMock();
    tabService = { getTab: vi.fn(async () => TAB) };
    templateEngine = { execute: vi.fn(async () => 'rendered output') };
    templateService = {
      findTemplateById: vi.fn(async () => TEMPLATE),
      findTemplateByShortcut: vi.fn(async () => TEMPLATE),
    };
    listener = new ExecuteTemplateMessageListener(
      asIntlService(intl),
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

  /*
   * Chrome populates `sender.tab` for *any* extension page loaded in a tab, not just content scripts, so preferring
   * the sender meant such a page asking to run a template against a specific tab silently targeted itself instead.
   */
  it('prefers an explicit tabId over the sender tab', async () => {
    const other = { id: 7, url: 'https://other.example/page' } as browser.tabs.Tab;
    tabService.getTab.mockResolvedValue(other);

    await invoke(popupInput({ tabId: 7 } as Partial<ExecuteTemplateMessageInput>), { tab: TAB } as MessageSender);

    expect(tabService.getTab).toHaveBeenCalledWith(7);
    expect(templateEngine.execute).toHaveBeenCalledWith(
      expect.objectContaining({ tab: other, url: new URL(other.url as string) }),
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

    expect(result).toEqual({
      outcome: ExecuteTemplateMessageOutcome.Skipped,
      reason: 'template_execution_skipped_tab_reason',
    });
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
    await expect(invoke(popupInput(), { tab: { ...TAB, url: 'not a url' } } as MessageSender)).rejects.toMatchObject({
      code: 'TPL422100',
    });
  });

  it('skips when a shortcut resolves to no template', async () => {
    templateService.findTemplateByShortcut.mockResolvedValue(undefined);

    const input = {
      shortcut: 'k',
      source: ExecuteTemplateMessageSource.Shortcut,
    } as unknown as ExecuteTemplateMessageInput;
    const result = await invoke(input, { tab: TAB } as MessageSender);

    expect(templateService.findTemplateByShortcut).toHaveBeenCalledWith('k');
    expect(result).toEqual({
      outcome: ExecuteTemplateMessageOutcome.Skipped,
      reason: 'template_execution_skipped_template_reason',
    });
  });

  /*
   * The shortcut cache in the content script only carries enabled templates, but it is refreshed asynchronously, so a
   * keypress can still arrive for one that has just been disabled. Executing it anyway would make a shortcut the one
   * way to run something the user switched off.
   */
  it('skips when a shortcut resolves to a disabled template', async () => {
    templateService.findTemplateByShortcut.mockResolvedValue({ ...TEMPLATE, enabled: false });

    const input = {
      shortcut: 'k',
      source: ExecuteTemplateMessageSource.Shortcut,
    } as unknown as ExecuteTemplateMessageInput;
    const result = await invoke(input, { tab: TAB } as MessageSender);

    expect(templateEngine.execute).not.toHaveBeenCalled();
    expect(result).toEqual({
      outcome: ExecuteTemplateMessageOutcome.Skipped,
      reason: 'template_execution_skipped_template_reason',
    });
  });

  it('executes when a shortcut resolves to an enabled template', async () => {
    const input = {
      shortcut: 'k',
      source: ExecuteTemplateMessageSource.Shortcut,
    } as unknown as ExecuteTemplateMessageInput;

    await invoke(input, { tab: TAB } as MessageSender);

    expect(templateEngine.execute).toHaveBeenCalledWith(expect.objectContaining({ template: TEMPLATE }));
  });

  it('looks up a popup template by id', async () => {
    await invoke(popupInput(), { tab: TAB } as MessageSender);

    expect(templateService.findTemplateById).toHaveBeenCalledWith('tpl-1');
  });

  it('throws when a popup template id is not found', async () => {
    templateService.findTemplateById.mockResolvedValue(undefined);

    await expect(invoke(popupInput(), { tab: TAB } as MessageSender)).rejects.toMatchObject({ code: 'TPL404000' });
  });

  it('forwards suppressNotifications to the engine', async () => {
    await invoke(popupInput({ suppressNotifications: true } as Partial<ExecuteTemplateMessageInput>), {
      tab: TAB,
    } as MessageSender);

    expect(templateEngine.execute).toHaveBeenCalledWith(expect.objectContaining({ suppressNotifications: true }));
  });
});
