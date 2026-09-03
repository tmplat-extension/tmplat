import { describe, expect, it, vi } from 'vitest';
import { type MessageListener } from 'extension/common/message/message-listener';
import { MainOffscreen } from 'extension/offscreen/main/main-offscreen';

function createMessageListener(onListen?: () => void): MessageListener {
  return { listen: vi.fn(onListen) } as unknown as MessageListener;
}

describe('MainOffscreen', () => {
  describe('run', () => {
    it('starts every injected message listener', () => {
      const messageListeners = [createMessageListener(), createMessageListener(), createMessageListener()];

      new MainOffscreen(messageListeners).run();

      messageListeners.forEach((messageListener) => {
        expect(messageListener.listen).toHaveBeenCalledOnce();
      });
    });

    it('starts the listeners in registration order', () => {
      const started: number[] = [];
      const messageListeners = [0, 1, 2].map((index) => createMessageListener(() => started.push(index)));

      new MainOffscreen(messageListeners).run();

      expect(started).toEqual([0, 1, 2]);
    });

    it('throws when a listener fails', () => {
      const messageListener = createMessageListener(() => {
        throw new Error('failed');
      });

      expect(() => new MainOffscreen([messageListener]).run()).toThrow('failed');
    });

    /*
     * Characterization, matching `BackgroundWorker.run` - both iterate with `forEach`, so a listener that throws
     * stops the ones after it from ever attaching. Harmless today, since `listen` only calls
     * `browser.runtime.onMessage.addListener`, but the offscreen document is created on demand and torn down again,
     * so `run` is the only chance a listener gets.
     */
    it('does not start listeners registered after one that fails', () => {
      const failing = createMessageListener(() => {
        throw new Error('failed');
      });
      const subsequent = createMessageListener();

      expect(() => new MainOffscreen([failing, subsequent]).run()).toThrow('failed');

      expect(subsequent.listen).not.toHaveBeenCalled();
    });

    it('tolerates having no message listeners', () => {
      expect(() => new MainOffscreen([]).run()).not.toThrow();
    });
  });
});
