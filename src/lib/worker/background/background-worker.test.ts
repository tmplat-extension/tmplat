import { describe, expect, it, vi } from 'vitest';
import { type ExtensionManager } from 'extension/common/extension-manager';
import { type MessageListener } from 'extension/common/message/message-listener';
import { BackgroundWorker } from 'extension/worker/background/background-worker';

const createMessageListener = (listen = vi.fn()): MessageListener => ({ listen }) as unknown as MessageListener;

const createExtensionManager = (run = vi.fn().mockResolvedValue(undefined)): ExtensionManager =>
  ({ run }) as unknown as ExtensionManager;

describe('BackgroundWorker', () => {
  describe('run', () => {
    it('starts every registered message listener', async () => {
      const first = vi.fn();
      const second = vi.fn();
      const worker = new BackgroundWorker(
        [createMessageListener(first), createMessageListener(second)],
        createExtensionManager(),
      );

      await worker.run();

      expect(first).toHaveBeenCalledOnce();
      expect(second).toHaveBeenCalledOnce();
    });

    it('runs the extension manager', async () => {
      const run = vi.fn().mockResolvedValue(undefined);
      const worker = new BackgroundWorker([], createExtensionManager(run));

      await worker.run();

      expect(run).toHaveBeenCalledOnce();
    });

    // Ordering matters: the service worker can be handed a message the moment it wakes, so listeners have to be
    // attached before any awaited work gives the event loop a chance to deliver one
    it('registers the message listeners before awaiting the extension manager', async () => {
      const calls: string[] = [];
      const listen = vi.fn(() => {
        calls.push('listen');
      });
      const run = vi.fn(async () => {
        calls.push('run');
      });
      const worker = new BackgroundWorker([createMessageListener(listen)], createExtensionManager(run));

      await worker.run();

      expect(calls).toEqual(['listen', 'run']);
    });

    it('tolerates having no message listeners', async () => {
      const worker = new BackgroundWorker([], createExtensionManager());

      await expect(worker.run()).resolves.toBeUndefined();
    });

    it('rejects when the extension manager fails', async () => {
      const worker = new BackgroundWorker([], createExtensionManager(vi.fn().mockRejectedValue(new Error('nope'))));

      await expect(worker.run()).rejects.toThrow('nope');
    });

    // `run` is `async`, so even a listener that throws synchronously must surface as a rejection rather than
    // escaping into the service worker's global scope
    it('rejects rather than throwing synchronously when a listener fails', async () => {
      const worker = new BackgroundWorker(
        [
          createMessageListener(
            vi.fn(() => {
              throw new Error('listener exploded');
            }),
          ),
        ],
        createExtensionManager(),
      );

      let promise!: Promise<void>;
      expect(() => {
        promise = worker.run();
      }).not.toThrow();

      await expect(promise).rejects.toThrow('listener exploded');
    });

    it('does not run the extension manager when a listener fails', async () => {
      const run = vi.fn().mockResolvedValue(undefined);
      const worker = new BackgroundWorker(
        [
          createMessageListener(
            vi.fn(() => {
              throw new Error('listener exploded');
            }),
          ),
        ],
        createExtensionManager(run),
      );

      await expect(worker.run()).rejects.toThrow('listener exploded');

      expect(run).not.toHaveBeenCalled();
    });
  });
});
