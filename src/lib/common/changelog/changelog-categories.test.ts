import { describe, expect, it } from 'vitest';
import { changelogCategories } from '../../../../scripts/changelog.mjs';
import { CHANGELOG_CATEGORIES } from 'extension/common/changelog/changelog.model';
import { ChangelogEntryBaseSchema } from 'extension/common/changelog/changelog.schema';

/*
 * The changelog is rendered by three consumers - the in-extension UI, "CHANGELOG.md" and the GitHub release notes -
 * and only the first two can share code, since everything under "scripts" is deliberately dependency-free plain Node
 * that cannot import TypeScript. A category added to one and forgotten in the other would silently *drop* those
 * changes from whichever consumer was missed, which is exactly the kind of omission nobody notices until after a
 * release.
 */
describe('changelog categories', () => {
  const schemaCategories = Object.keys(ChangelogEntryBaseSchema.shape).filter((key) => key !== 'version');

  it('covers every category in the entry schema', () => {
    expect(CHANGELOG_CATEGORIES.map(({ key }) => key).toSorted()).toEqual(schemaCategories.toSorted());
  });

  it('matches "scripts/changelog.mjs" in both content and order', () => {
    expect(changelogCategories.map(([key]) => key)).toEqual(CHANGELOG_CATEGORIES.map(({ key }) => key));
  });

  it('titles each category with the message key the UI resolves', () => {
    expect(CHANGELOG_CATEGORIES.map(({ titleKey }) => titleKey)).toEqual([
      'changelog_category_features',
      'changelog_category_improvements',
      'changelog_category_deprecations',
      'changelog_category_removals',
      'changelog_category_fixes',
      'changelog_category_known_issues',
    ]);
  });
});
