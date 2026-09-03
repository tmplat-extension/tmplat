// Shared changelog helpers.
//
// "src/changelog.json" is the single source of truth for what changed in each version. It is consumed by the
// extension itself (via `ChangelogService`), by `rolldown.config.mjs` to generate "CHANGELOG.md" and by
// "scripts/release-notes.mjs" to generate the GitHub release notes. This module exists so that the last two
// produce *identical* markdown rather than drifting apart.

import { readFileSync } from 'node:fs';

export const changelogFile = 'src/changelog.json';

/**
 * The change categories, in the order they are rendered. Must be kept in sync with `ChangelogEntryBaseSchema` in
 * "src/lib/common/changelog/changelog.schema.ts" and with `categories` in
 * "src/lib/ui/common/components/changelog/changelog.tsx" - `changelog-categories.test.ts` enforces that.
 *
 * `deprecations` and `removals` are separate from `improvements` because taking something away is not an
 * improvement to the user who was relying on it, and 2.0.0 does a lot of both.
 */
export const changelogCategories = [
  ['features', 'Features'],
  ['improvements', 'Improvements'],
  ['deprecations', 'Deprecations'],
  ['removals', 'Removals'],
  ['fixes', 'Fixes'],
  ['knownIssues', 'Known Issues'],
];

export function readChangelog(file = changelogFile) {
  return JSON.parse(readFileSync(file, 'utf8'));
}

export function findChangelogEntry(changelogEntries, version) {
  return changelogEntries.find((entry) => entry.version === version);
}

export function countChanges(entry) {
  return changelogCategories.reduce((count, [key]) => count + (entry?.[key]?.length ?? 0), 0);
}

/**
 * Renders only the categorised changes for a single entry, without the version heading, so that consumers which
 * already have their own title (e.g. a GitHub release) do not repeat it.
 */
export function formatChangelogChanges(entry) {
  const lines = [];

  for (const [key, title] of changelogCategories) {
    const changes = entry[key];
    if (!changes?.length) {
      continue;
    }

    if (lines.length > 0) {
      lines.push('');
    }
    lines.push(`### ${title}`, '', ...changes.map((change) => `- ${change}`));
  }

  return lines.join('\n');
}

/**
 * Renders a single entry as a complete markdown section, including its version heading.
 */
export function formatChangelogEntry(entry) {
  const changes = formatChangelogChanges(entry);

  return `## Version ${entry.version}, ${entry.date}${changes ? `\n\n${changes}` : ''}`;
}
