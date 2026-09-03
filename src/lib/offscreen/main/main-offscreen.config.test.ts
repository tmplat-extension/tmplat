import { describe, expect, it } from 'vitest';
import { MainOffscreen } from 'extension/offscreen/main/main-offscreen';
import { container } from 'extension/offscreen/main/main-offscreen.config';
import { OffscreenToken } from 'extension/offscreen/offscreen';

/*
 * See `src/lib/worker/background/background-worker.config.test.ts` for why this resolves the entry token rather than
 * enumerating bindings, and why these imports are static.
 */
describe('main offscreen container', () => {
  it('resolves the offscreen entry point with its full dependency graph', () => {
    expect(container.get(OffscreenToken)).toBeInstanceOf(MainOffscreen);
  });
});
