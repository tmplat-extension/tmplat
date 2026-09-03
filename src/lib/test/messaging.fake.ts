import { type Mock } from 'vitest';
import { getBrowserApiMock, type RuntimeOnMessageListener } from 'extension/test/browser-api.mock';

export { type RuntimeOnMessageListener } from 'extension/test/browser-api.mock';

export type RuntimeMessagingFake = {
  /** Every listener registered via `browser.runtime.onMessage.addListener`, in registration order. */
  readonly listeners: RuntimeOnMessageListener[];
  readonly sendMessage: Mock<(message: unknown) => Promise<unknown>>;
  /**
   * Dispatches `message` to every registered listener, mimicking `browser.runtime`'s behavior of invoking each
   * `onMessage` listener. The returned `response` promise resolves with the first value any listener passes to
   * `sendResponse`, and `keptChannelOpen` reports whether any listener returned `true` (i.e. intends to respond
   * asynchronously).
   */
  dispatch(message: unknown, sender?: unknown): { keptChannelOpen: boolean; response: Promise<unknown> };
};

/**
 * Makes the browser API mock installed for the current test record the listeners passed to
 * `browser.runtime.onMessage.addListener`, and returns a handle for driving them.
 *
 * This augments the mock installed by `extension/test/setup` in place rather than replacing it, so `sendMessage` and
 * the other namespaces (e.g. `i18n`, which `ExtensionError` relies on) stay reachable via `getBrowserApiMock` and
 * refer to the same instance that the code under test sees.
 */
export const installRuntimeMessagingFake = (): RuntimeMessagingFake => {
  const { runtime } = getBrowserApiMock();
  const listeners: RuntimeOnMessageListener[] = [];

  runtime.onMessage.addListener.mockImplementation((listener) => {
    listeners.push(listener);
  });
  runtime.onMessage.hasListener.mockImplementation((listener) => listeners.includes(listener));
  runtime.onMessage.removeListener.mockImplementation((listener) => {
    const index = listeners.indexOf(listener);

    if (index !== -1) {
      listeners.splice(index, 1);
    }
  });

  return {
    dispatch(message: unknown, sender: unknown = {}) {
      let resolveResponse!: (response: unknown) => void;
      const response = new Promise<unknown>((resolve) => {
        resolveResponse = resolve;
      });
      const sendResponse = (value?: unknown) => resolveResponse(value);

      const keptChannelOpen = listeners.map((listener) => listener(message, sender, sendResponse)).some(Boolean);

      return { keptChannelOpen, response };
    },
    listeners,
    sendMessage: runtime.sendMessage,
  };
};
