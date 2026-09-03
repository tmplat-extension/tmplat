import { describe, expect, it } from 'vitest';
import { ContentToken } from 'extension/content/content';
import { HomepageContent } from 'extension/content/homepage-content/homepage-content';
import { container } from 'extension/content/homepage-content/homepage-content.config';

/*
 * See `src/lib/worker/background/background-worker.config.test.ts` for why this resolves the entry token rather than
 * enumerating bindings, and why these imports are static.
 */
describe('homepage content container', () => {
  it('resolves the content script entry point with its full dependency graph', () => {
    expect(container.get(ContentToken)).toBeInstanceOf(HomepageContent);
  });
});
