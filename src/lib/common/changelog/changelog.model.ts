import { type ChangelogEntry } from 'extension/common/changelog/changelog.schema';
import { type IntlMessageKey } from 'extension/common/intl/intl-message-key';

export type ChangelogCategoryKey = Exclude<keyof ChangelogEntry, 'date' | 'unreleased' | 'version'>;

export type ChangelogCategory = {
  readonly key: ChangelogCategoryKey;
  readonly titleKey: IntlMessageKey;
};

/**
 * Every change category, ordered by how notable it is expected to be to a user reading the changelog after an update.
 *
 * `deprecations` and `removals` are deliberately separate from `improvements`: taking something away is not an
 * improvement to the user who was relying on it.
 *
 * This is the source of truth for the in-extension changelog UI. "scripts/changelog.mjs" has to repeat it, because
 * everything under "scripts" is plain, dependency-free Node that cannot import TypeScript, so
 * `changelog-categories.test.ts` asserts the two stay identical.
 */
export const CHANGELOG_CATEGORIES: readonly ChangelogCategory[] = [
  { key: 'features', titleKey: 'changelog_category_features' },
  { key: 'improvements', titleKey: 'changelog_category_improvements' },
  { key: 'deprecations', titleKey: 'changelog_category_deprecations' },
  { key: 'removals', titleKey: 'changelog_category_removals' },
  { key: 'fixes', titleKey: 'changelog_category_fixes' },
  { key: 'knownIssues', titleKey: 'changelog_category_known_issues' },
];
