import { describe, expect, it } from 'vitest';
import { AnyContent } from 'extension/content/any-content/any-content';
import { container } from 'extension/content/any-content/any-content.config';
import { ContentToken } from 'extension/content/content';

/*
 * See `src/lib/worker/background/background-worker.config.test.ts` for why this resolves the entry token rather than
 * enumerating bindings, and why these imports are static.
 */
describe('any content container', () => {
  it('resolves the content script entry point with its full dependency graph', () => {
    expect(container.get(ContentToken)).toBeInstanceOf(AnyContent);
  });
});
