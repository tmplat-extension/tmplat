import { beforeEach, describe, expect, it, vi } from 'vitest';
import { type EventListener } from 'extension/common/event/event-listener';
import { type ExtensionInfo } from 'extension/common/extension-info';
import { type MessageListener } from 'extension/common/message/message-listener';
import { AnyContent } from 'extension/content/any-content/any-content';

const extensionId = 'abcdef';
const version = '2.0.0';

const createExtensionInfo = (): ExtensionInfo =>
  ({ id: extensionId, getVersion: vi.fn().mockReturnValue(version) }) as unknown as ExtensionInfo;

const createEventListener = (listen = vi.fn()): EventListener => ({ listen }) as unknown as EventListener;

const createMessageListener = (listen = vi.fn()): MessageListener => ({ listen }) as unknown as MessageListener;

const markerName = `data-extension-${extensionId}`;

describe('AnyContent', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    document.body.removeAttribute(markerName);
  });

  describe('inject', () => {
    it('starts every event and message listener', () => {
      const eventListen = vi.fn();
      const messageListen = vi.fn();
      const content = new AnyContent(
        createExtensionInfo(),
        [createEventListener(eventListen)],
        [createMessageListener(messageListen)],
      );

      content.inject();

      expect(eventListen).toHaveBeenCalledOnce();
      expect(messageListen).toHaveBeenCalledOnce();
    });

    it('marks the document so that it can detect itself later', () => {
      const content = new AnyContent(createExtensionInfo(), [], []);

      content.inject();

      expect(document.body.getAttribute(markerName)).toBe(version);
    });

    // Chrome can inject the same content script more than once (e.g. a programmatic `scripting.executeScript` on a
    // page that already matched the manifest), which would otherwise register every listener twice and copy twice
    it('does nothing when it has already been injected', () => {
      const eventListen = vi.fn();
      const extensionInfo = createExtensionInfo();
      const listeners = [createEventListener(eventListen)];

      new AnyContent(extensionInfo, listeners, []).inject();
      new AnyContent(extensionInfo, listeners, []).inject();

      expect(eventListen).toHaveBeenCalledOnce();
    });

    it('is idempotent when the same instance injects twice', () => {
      const eventListen = vi.fn();
      const content = new AnyContent(createExtensionInfo(), [createEventListener(eventListen)], []);

      content.inject();
      content.inject();

      expect(eventListen).toHaveBeenCalledOnce();
    });

    // The marker carries the version, so a content script from a *newer* version of the extension must still install
    // itself over an older one rather than mistaking it for its own marker
    it('injects when the existing marker belongs to a different version', () => {
      document.body.setAttribute(markerName, '1.0.0');

      const eventListen = vi.fn();
      const content = new AnyContent(createExtensionInfo(), [createEventListener(eventListen)], []);

      content.inject();

      expect(eventListen).toHaveBeenCalledOnce();
      expect(document.body.getAttribute(markerName)).toBe(version);
    });

    it('injects when the marker belongs to a different extension', () => {
      document.body.setAttribute('data-extension-other', version);

      const eventListen = vi.fn();
      const content = new AnyContent(createExtensionInfo(), [createEventListener(eventListen)], []);

      content.inject();

      expect(eventListen).toHaveBeenCalledOnce();
    });

    it('marks the document before starting the listeners', () => {
      const calls: string[] = [];
      const extensionInfo = createExtensionInfo();
      const content = new AnyContent(
        extensionInfo,
        [
          createEventListener(
            vi.fn(() => {
              calls.push(document.body.getAttribute(markerName) === version ? 'marked' : 'unmarked');
            }),
          ),
        ],
        [],
      );

      content.inject();

      expect(calls).toEqual(['marked']);
    });

    it('uses the version qualified with the build metadata', () => {
      const extensionInfo = createExtensionInfo();
      const content = new AnyContent(extensionInfo, [], []);

      content.inject();

      expect(extensionInfo.getVersion).toHaveBeenCalledWith(true);
    });

    it('tolerates having no listeners at all', () => {
      const content = new AnyContent(createExtensionInfo(), [], []);

      expect(() => content.inject()).not.toThrow();
      expect(document.body.getAttribute(markerName)).toBe(version);
    });
  });
});
