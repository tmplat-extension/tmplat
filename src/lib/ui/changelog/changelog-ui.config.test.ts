import { describe, expect, it } from 'vitest';
import { ChangelogUi } from 'extension/ui/changelog/changelog-ui';
import { container } from 'extension/ui/changelog/changelog-ui.config';
import { UiToken } from 'extension/ui/ui';

/*
 * See `src/lib/worker/background/background-worker.config.test.ts` for why this resolves the entry token rather than
 * enumerating bindings, and why these imports are static.
 */
describe('changelog UI container', () => {
  it('resolves the changelog UI entry point with its full dependency graph', () => {
    expect(container.get(UiToken)).toBeInstanceOf(ChangelogUi);
  });
});
