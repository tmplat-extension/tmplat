import { execSync } from 'node:child_process';
import { copyFileSync, cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join as joinPath } from 'node:path';
import * as sass from 'sass';
import { defineConfig } from 'rolldown';
import { replacePlugin } from 'rolldown/plugins';
import { changelogFile, formatChangelogEntry, readChangelog as readChangelogFile } from './scripts/changelog.mjs';

const entries = {
  'lib/content/any-content': './src/lib/content/any-content/index.ts',
  'lib/content/homepage-content': './src/lib/content/homepage-content/index.ts',
  'lib/offscreen/main': './src/lib/offscreen/main/index.ts',
  'lib/ui/changelog': './src/lib/ui/changelog/index.ts',
  'lib/ui/guide': './src/lib/ui/guide/index.ts',
  'lib/ui/migrate': './src/lib/ui/migrate/index.ts',
  'lib/ui/options': './src/lib/ui/options/index.ts',
  'lib/ui/popup': './src/lib/ui/popup/index.ts',
  'lib/worker/background': './src/lib/worker/background/index.ts',
};

function buildUnion(name, values, source) {
  return `${[
    `// This file is generated during the build from ${source}.`,
    '// Do not edit it manually as any changes will be overwritten.',
    '',
    values.length === 0
      ? `export type ${name} = never;`
      : [
          `export type ${name} =`,
          ...values.map((value, index) => `  | '${value}'${index === values.length - 1 ? ';' : ''}`),
        ].join('\n'),
  ].join('\n')}\n`;
}

function compareVersions(a, b) {
  const left = a.split('.').map(Number);
  const right = b.split('.').map(Number);

  for (let i = 0; i < left.length; i++) {
    if (left[i] !== right[i]) {
      return left[i] - right[i];
    }
  }

  return 0;
}

function generateMarkdown(changelogEntries) {
  // Unreleased (i.e. work in progress) versions are only shown within the extension, never in the published changelog
  const sections = [...changelogEntries]
    .filter((entry) => !entry.unreleased)
    .toReversed()
    .map((entry) => formatChangelogEntry(entry));

  return `${[
    '<!-- This file is generated during the build from "src/changelog.json". -->',
    '<!-- Do not edit it manually as any changes will be overwritten. -->',
    '',
    '# Changelog',
    '',
    sections.join('\n\n'),
  ].join('\n')}\n`;
}

function changelogPlugin() {
  const changelogSrc = changelogFile;
  const markdownDest = 'CHANGELOG.md';
  const changelogSource = 'the changelog within "src/changelog.json"';
  const versionFile = 'src/lib/common/extension-version.ts';
  const versionPattern = /^\d+\.\d+\.\d+$/;

  function readChangelog() {
    return readChangelogFile(changelogSrc);
  }

  function buildVersionUnion(versions) {
    return `${[
      `// This file is generated during the build from ${changelogSource}.`,
      '// Do not edit it manually as any changes will be overwritten.',
      '',
      'type SemanticVersion = `${number}.${number}.${number}`;',
      '',
      '// Compilation fails if any version below is not a valid semantic version',
      'type AssertSemanticVersion<Version extends SemanticVersion> = Version;',
      '',
      'export type ExtensionVersion = AssertSemanticVersion<',
      ...versions.map((version) => `  | '${version}'`),
      '>;',
    ].join('\n')}\n`;
  }

  function generateVersions(changelogEntries) {
    const versions = new Set();
    const errors = [];

    for (const { version } of changelogEntries) {
      if (!versionPattern.test(version)) {
        errors.push(`Invalid version '${version}' in '${changelogSrc}': must match ${versionPattern.source}`);
      } else if (versions.has(version)) {
        errors.push(`Duplicate version '${version}' in '${changelogSrc}'`);
      }
      versions.add(version);
    }

    if (errors.length > 0) {
      return { errors };
    }
    if (versions.size === 0) {
      return { errors: [`No versions were found in '${changelogSrc}'`] };
    }

    mkdirSync(joinPath('src', 'lib', 'common'), { recursive: true });
    writeFileSync(versionFile, buildVersionUnion([...versions].toSorted(compareVersions)));

    return { errors: [] };
  }

  return {
    name: 'changelog-plugin',
    buildStart() {
      if (!existsSync(changelogSrc)) {
        this.error(`No changelog was found at '${changelogSrc}'`);
      }

      this.addWatchFile(changelogSrc);

      const { errors } = generateVersions(readChangelog());
      if (errors.length > 0) {
        this.error(errors.join('\n'));
      }
    },
    writeBundle() {
      // Now that the changelog lives in "src", `jsonPlugin` copies it to "dist/temp" (minifying when asked) along
      // with every other top-level JSON file, so this plugin deliberately does not write it there itself - two
      // plugins writing the same destination would leave the result decided by plugin order alone
      writeFileSync(markdownDest, generateMarkdown(readChangelog()));
    },
  };
}

function compressPlaceholders(placeholders) {
  if (!placeholders) {
    return;
  }

  return Object.entries(placeholders).reduce((acc, [name, placeholder]) => {
    if (placeholder.content) {
      acc[name] = { content: placeholder.content };
    }
    return acc;
  }, {});
}

function getCommit() {
  try {
    return (
      execSync('git rev-parse --short HEAD', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim() ||
      'unknown'
    );
  } catch {
    return 'unknown';
  }
}

function jsonPlugin(minify) {
  return {
    name: 'json-plugin',
    buildStart() {
      if (existsSync('package.json')) {
        this.addWatchFile('package.json');
      }
      if (existsSync('src')) {
        for (const file of readdirSync('src')) {
          if (file.endsWith('.json')) {
            this.addWatchFile(joinPath('src', file));
          }
        }
      }
    },
    writeBundle() {
      const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));

      if (existsSync('src')) {
        mkdirSync('dist/temp', { recursive: true });
        for (const file of readdirSync('src')) {
          if (!file.endsWith('.json')) {
            continue;
          }

          const srcFile = joinPath('src', file);
          const destFile = joinPath('dist/temp', file);
          const isManifest = file === 'manifest.json';

          if (!minify && !isManifest) {
            copyFileSync(srcFile, destFile);
            continue;
          }

          const content = JSON.parse(readFileSync(srcFile, 'utf8'));
          if (isManifest) {
            content.version = packageJson.version;
          }
          writeFileSync(destFile, JSON.stringify(content, null, minify ? '' : 2));
        }
      }
    },
  };
}

function readMessages(msgFile) {
  return JSON.parse(readFileSync(msgFile, 'utf8'));
}

function localesPlugin(minify) {
  const localesSrc = 'src/_locales';
  const localesDest = 'dist/temp/_locales';
  const manifestSrc = 'src/manifest.json';
  const i18nSource = 'the i18n messages within "src/_locales"';
  const messageKeysFile = 'src/lib/common/intl/intl-message-key.ts';
  const errorCodesFile = 'src/lib/common/error/extension-error-code.ts';
  const errorKeyPrefix = 'xerr_';
  const messageKeyPattern = /^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/;
  const errorMessageKeyPattern = /^xerr_[a-z]{3}[1-9][0-9]{5}$/;

  // Every non-default locale is machine-generated: it is downloaded from Crowdin during a release and is always
  // some lagging subset of the default locale, potentially still carrying keys retired years ago. Only the default
  // locale is authored by hand, so it alone defines which keys exist - deriving the generated unions from *all*
  // locales would let a stale translation invent `IntlMessageKey`/`ExtensionErrorCode` members that nothing can
  // ever resolve. Chrome falls back to `default_locale` per message, so the missing keys need no handling here.
  function getDefaultLocale() {
    return JSON.parse(readFileSync(manifestSrc, 'utf8')).default_locale;
  }

  function getMessageFile(locale) {
    return joinPath(localesSrc, locale, 'messages.json');
  }

  function getMessageFiles() {
    if (!existsSync(localesSrc)) {
      return [];
    }

    return readdirSync(localesSrc)
      .map((locale) => getMessageFile(locale))
      .filter((msgFile) => existsSync(msgFile));
  }

  function validateMessageKey(key) {
    if (!messageKeyPattern.test(key)) {
      return `must match ${messageKeyPattern.source}`;
    }
    if (key.startsWith(errorKeyPrefix) && !errorMessageKeyPattern.test(key)) {
      return `must match ${errorMessageKeyPattern.source}`;
    }
  }

  function generateMessageKeys() {
    const defaultMsgFile = getMessageFile(getDefaultLocale());
    if (!existsSync(defaultMsgFile)) {
      return { errors: [`No default locale i18n messages were found at '${defaultMsgFile}'`] };
    }

    const keys = new Set();
    const errors = [];
    for (const key of Object.keys(readMessages(defaultMsgFile))) {
      const failure = validateMessageKey(key);
      if (failure) {
        errors.push(`Invalid i18n message key '${key}' in '${defaultMsgFile}': ${failure}`);
      }
      keys.add(key);
    }

    if (errors.length > 0) {
      return { errors };
    }
    if (keys.size === 0) {
      return { errors: [`No i18n message keys were found in '${defaultMsgFile}'`] };
    }

    const sortedKeys = [...keys].toSorted();
    const messageKeys = sortedKeys;
    const errorCodes = sortedKeys
      .filter((key) => key.startsWith(errorKeyPrefix))
      .map((key) => key.slice(errorKeyPrefix.length).toUpperCase());

    mkdirSync(joinPath('src', 'lib', 'common', 'intl'), { recursive: true });
    writeFileSync(messageKeysFile, buildUnion('IntlMessageKey', messageKeys, i18nSource));

    mkdirSync(joinPath('src', 'lib', 'common', 'error'), { recursive: true });
    writeFileSync(errorCodesFile, buildUnion('ExtensionErrorCode', errorCodes, i18nSource));

    return { errors: [] };
  }

  function compressMessage(message) {
    if (!message?.message) {
      return;
    }

    return {
      message: message.message,
      placeholders: compressPlaceholders(message.placeholders),
    };
  }

  return {
    name: 'locales-plugin',
    buildStart() {
      this.addWatchFile(manifestSrc);
      for (const msgFile of getMessageFiles()) {
        this.addWatchFile(msgFile);
      }

      const { errors } = generateMessageKeys();
      if (errors.length > 0) {
        this.error(errors.join('\n'));
      }
    },
    writeBundle() {
      if (!existsSync(localesSrc)) {
        return;
      }

      const defaultLocale = getDefaultLocale();
      const knownKeys = new Set(Object.keys(readMessages(getMessageFile(defaultLocale))));

      rmSync(localesDest, { recursive: true, force: true });

      for (const locale of readdirSync(localesSrc)) {
        const srcFile = getMessageFile(locale);
        if (!existsSync(srcFile)) {
          continue;
        }

        const destDir = joinPath(localesDest, locale);
        mkdirSync(destDir, { recursive: true });
        const destFile = joinPath(destDir, 'messages.json');

        const original = readMessages(srcFile);
        const staleKeys = Object.keys(original).filter((name) => !knownKeys.has(name));
        if (staleKeys.length > 0) {
          // Dead weight at best and a source of confusion at worst, since Chrome silently ignores them
          this.warn(
            `Excluding ${staleKeys.length} i18n message key(s) from '${srcFile}' that no longer exist in the ` +
              `'${defaultLocale}' locale: ${staleKeys.join(', ')}`,
          );
        }

        const output = Object.entries(original).reduce((acc, [name, message]) => {
          if (!knownKeys.has(name)) {
            return acc;
          }

          const value = minify ? compressMessage(message) : message;
          if (value) {
            acc[name] = value;
          }
          return acc;
        }, {});

        writeFileSync(destFile, JSON.stringify(output, null, minify ? '' : 2));
      }
    },
  };
}

function scssPlugin() {
  return {
    name: 'scss-plugin',
    transform(_code, id) {
      if (id.endsWith('.scss') || id.endsWith('.sass')) {
        const { css, sourceMap } = sass.compile(id, {
          style: 'compressed',
          sourceMap: true,
        });
        const code = `
(function() {
  const style = document.createElement('style');
  style.textContent = ${JSON.stringify(css)};
  (document.head || document.documentElement).appendChild(style);
})();
`;
        return {
          code,
          map: sourceMap,
          moduleType: 'js',
        };
      }
    },
  };
}

function staticAssetsPlugin() {
  const copyTargets = [{ src: 'src/img', dest: 'dist/temp/img' }];

  return {
    name: 'static-assets-plugin',
    buildStart() {
      for (const { src } of copyTargets) {
        if (existsSync(src)) {
          this.addWatchFile(src);
        }
      }
      if (existsSync('src')) {
        for (const file of readdirSync('src')) {
          if (file.endsWith('.html')) {
            this.addWatchFile(joinPath('src', file));
          }
        }
      }
    },
    writeBundle() {
      // 1. Copy static directories
      for (const { src, dest } of copyTargets) {
        if (existsSync(src)) {
          rmSync(dest, { recursive: true, force: true });
          mkdirSync(dest, { recursive: true });
          cpSync(src, dest, { recursive: true });
        }
      }

      // 2. Copy root HTML files
      if (existsSync('src')) {
        for (const file of readdirSync('src')) {
          if (file.endsWith('.html')) {
            mkdirSync('dist/temp', { recursive: true });
            copyFileSync(joinPath('src', file), joinPath('dist/temp', file));
          }
        }
      }
    },
  };
}

export default defineConfig((commandLineArgs) => {
  const commit = getCommit();
  const env = commandLineArgs.minify ? 'production' : 'development';

  return Object.entries(entries).map(([name, input], index) => ({
    input: { [name]: input },
    output: {
      dir: 'dist/temp',
      format: 'iife',
      sourcemap: commandLineArgs.minify ? true : 'inline',
      minify: commandLineArgs.minify,
      codeSplitting: false,
    },
    plugins: [
      ...(index === 0
        ? [
            staticAssetsPlugin(),
            changelogPlugin(),
            jsonPlugin(commandLineArgs.minify),
            localesPlugin(commandLineArgs.minify),
          ]
        : []),
      scssPlugin(),
      replacePlugin(
        {
          'process.env.EXT_COMMIT': JSON.stringify(commit),
          'process.env.EXT_ENV': JSON.stringify(env),
        },
        { preventAssignment: true },
      ),
    ],
  }));
});
