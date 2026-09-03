import { beforeEach, describe, expect, it } from 'vitest';
import { HomepageContent } from 'extension/content/homepage-content/homepage-content';

// Runs on tmplat.com (document_start, ahead of the site's own React bundle) so its Install button can
// read this flag on mount and show visitors who already have the extension that it's installed.
describe('HomepageContent', () => {
  beforeEach(() => {
    delete document.documentElement.dataset.tmplatInstalled;
  });

  describe('inject', () => {
    it('flags the extension as installed', () => {
      new HomepageContent().inject();

      expect(document.documentElement.dataset.tmplatInstalled).toBe('true');
    });

    it('is idempotent', () => {
      const content = new HomepageContent();
      content.inject();
      content.inject();

      expect(document.documentElement.dataset.tmplatInstalled).toBe('true');
    });
  });
});
