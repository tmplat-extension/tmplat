import { describe, expect, it } from 'vitest';
import { GuideUi } from 'extension/ui/guide/guide-ui';
import { container } from 'extension/ui/guide/guide-ui.config';
import { UiToken } from 'extension/ui/ui';

/*
 * See `src/lib/worker/background/background-worker.config.test.ts` for why this resolves the entry token rather than
 * enumerating bindings, and why these imports are static.
 */
describe('guide UI container', () => {
  it('resolves the guide UI entry point with its full dependency graph', () => {
    expect(container.get(UiToken)).toBeInstanceOf(GuideUi);
  });
});
