import { describe, expect, it } from 'vitest';
import { PopupUi } from 'extension/ui/popup/popup-ui';
import { container } from 'extension/ui/popup/popup-ui.config';
import { UiToken } from 'extension/ui/ui';

/*
 * See `src/lib/worker/background/background-worker.config.test.ts` for why this resolves the entry token rather than
 * enumerating bindings, and why these imports are static.
 */
describe('popup UI container', () => {
  it('resolves the popup UI entry point with its full dependency graph', () => {
    expect(container.get(UiToken)).toBeInstanceOf(PopupUi);
  });
});
