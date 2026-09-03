import { describe, expect, it } from 'vitest';
import { OptionsUi } from 'extension/ui/options/options-ui';
import { container } from 'extension/ui/options/options-ui.config';
import { UiToken } from 'extension/ui/ui';

/*
 * See `src/lib/worker/background/background-worker.config.test.ts` for why this resolves the entry token rather than
 * enumerating bindings, and why these imports are static.
 */
describe('options UI container', () => {
  it('resolves the options UI entry point with its full dependency graph', () => {
    expect(container.get(UiToken)).toBeInstanceOf(OptionsUi);
  });
});
