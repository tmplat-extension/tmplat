// Validates that a git version tag is genuinely releasable and, optionally, renders its release notes.
//
// Run as part of the "Release" workflow, before anything is built or published, so that a mistyped tag or a
// changelog entry that was never finalised fails the run within seconds instead of after a store upload.
//
// Usage:
//   node scripts/release-notes.mjs <tag> [--out <file>] [--allow-unreleased]
//
//   <tag>               The git tag being released, with or without the leading "v" (e.g. "v2.0.0").
//   --out <file>        Write the rendered release notes to <file>, creating parent directories as needed.
//   --allow-unreleased  Downgrade the "entry is still marked unreleased"/"entry has no date" errors to warnings.
//                       Used only by a dry run of the release workflow, so the pipeline can be rehearsed against
//                       a version that is still in progress. Never pass this for a real release.
//
// Writes `version` and `tag` to $GITHUB_OUTPUT when running under GitHub Actions.

import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { countChanges, findChangelogEntry, formatChangelogChanges, readChangelog } from './changelog.mjs';

const packageFile = 'package.json';
const versionPattern = /^\d+\.\d+\.\d+$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

function warn(message) {
  console.warn(process.env.GITHUB_ACTIONS ? `::warning::${message}` : `Warning: ${message}`);
}

function parseArgs(argv) {
  const args = { allowUnreleased: false, out: undefined, tag: undefined };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    if (arg === '--allow-unreleased') {
      args.allowUnreleased = true;
    } else if (arg === '--out') {
      args.out = argv[++i];
      if (!args.out) {
        throw new Error('Missing value for --out');
      }
    } else if (arg.startsWith('-')) {
      throw new Error(`Unknown option: ${arg}`);
    } else if (args.tag === undefined) {
      args.tag = arg;
    } else {
      throw new Error(`Unexpected argument: ${arg}`);
    }
  }

  if (!args.tag) {
    throw new Error('Missing required <tag> argument');
  }

  return args;
}

function validate(tag, allowUnreleased) {
  const version = tag.replace(/^v/, '');
  const errors = [];

  if (!versionPattern.test(version)) {
    // Bail out immediately: every other check is meaningless if the tag is not a version
    throw new Error(`Tag '${tag}' is not a release version: must match v${versionPattern.source.slice(1, -1)}`);
  }

  const packageVersion = JSON.parse(readFileSync(packageFile, 'utf8')).version;
  if (packageVersion !== version) {
    errors.push(
      `Tag '${tag}' does not match the version in '${packageFile}' ('${packageVersion}'). Either the tag or the ` +
        'package version is wrong - they must always be released together.',
    );
  }

  const entry = findChangelogEntry(readChangelog(), version);
  if (!entry) {
    errors.push(`No changelog entry was found for version '${version}'. Add one to 'src/changelog.json'.`);
  } else {
    // Whether a version is finalised is exactly what a dry run needs to ignore, and nothing else is
    const report = (message) => (allowUnreleased ? warn(message) : errors.push(message));

    if (entry.unreleased) {
      report(
        `The changelog entry for version '${version}' is still marked as unreleased. Remove "unreleased": true and ` +
          'add the release "date" before tagging.',
      );
    }
    if (!datePattern.test(entry.date ?? '')) {
      report(
        `The changelog entry for version '${version}' has no valid release "date" (expected YYYY-MM-DD, got ` +
          `${JSON.stringify(entry.date)}).`,
      );
    }
    if (countChanges(entry) === 0) {
      errors.push(
        `The changelog entry for version '${version}' records no changes. At least one entry is required across ` +
          'features, improvements, fixes or knownIssues.',
      );
    }
  }

  if (errors.length > 0) {
    throw new Error(errors.join('\n'));
  }

  return { entry, version };
}

function writeOutputs(outputs) {
  const outputFile = process.env.GITHUB_OUTPUT;
  if (!outputFile) {
    return;
  }

  const lines = Object.entries(outputs).map(([key, value]) => `${key}=${value}`);
  appendFileSync(outputFile, `${lines.join('\n')}\n`);
}

function main() {
  const { allowUnreleased, out, tag } = parseArgs(process.argv.slice(2));
  const { entry, version } = validate(tag, allowUnreleased);

  const dated = entry.date ? `dated ${entry.date}` : 'undated';
  console.log(`Version ${version}: ${countChanges(entry)} change(s) recorded, ${dated}.`);

  if (out) {
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, `${formatChangelogChanges(entry)}\n`);
    console.log(`Release notes written to '${out}'.`);
  }

  writeOutputs({ tag, version });
}

try {
  main();
} catch (e) {
  const message = e instanceof Error ? e.message : String(e);

  for (const line of message.split('\n')) {
    console.error(process.env.GITHUB_ACTIONS ? `::error::${line}` : line);
  }

  process.exitCode = 1;
}
