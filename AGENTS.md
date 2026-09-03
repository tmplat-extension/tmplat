# AGENTS.md

Guidance for AI coding agents (and human contributors) working in this repository.

## Project Overview

**tmplat** (`package.json` name: `tmplat`) is a Google Chrome extension that quickly and easily copies info
about the current page using a simple, unique template system.

This repository is **mid-migration** from a legacy codebase (internally still referred to as "Template") to the
new "tmplat" codebase. Both old and new code currently coexist in `src/`. Understand which "world" a file
belongs to before editing it.

| Aspect            | Legacy ("Template")                                                                                                          | New ("tmplat")                                                                         |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Language          | CoffeeScript (`.coffee`)                                                                                                     | TypeScript (`.ts` / `.tsx`)                                                            |
| UI framework      | Bootstrap 2/3 + jQuery + Backbone + Mustache (`.html` templates)                                                             | React + MUI (Material UI) + Emotion                                                    |
| Manifest          | Manifest V2 (background page, `browser_action`, etc.)                                                                        | Manifest V3 (`src/manifest.json` — service worker, `action`)                           |
| Build tool        | Grunt (no longer present in this repo)                                                                                       | [rolldown](rolldown.config.mjs) via `rolldown.config.mjs`                              |
| Dependency style  | Vendored libraries in `src/vendor/` (jQuery, Backbone, Underscore, Async, Mustache, purl.js, date-ext, md.min.js, Bootstrap) | npm packages (React, MUI, inversify, luxon, numeral, lodash.\*, tmplat-mustache, etc.) |
| DI / architecture | Ad-hoc globals/singletons                                                                                                    | `inversify` DI container (see `src/lib/common/di.ts`)                                  |

### Signs a file is legacy vs new

- Legacy: `src/lib/*.coffee` (`background.coffee`, `content.coffee`, `options.coffee`, `popup.coffee`,
  `utils.coffee`), `src/options.legacy.html`, `src/popup.legacy.html`, and anything under `src/vendor/`.
- New: everything under `src/lib/**/*.ts` and `src/lib/**/*.tsx`, especially the `ui/` (React+MUI),
  `worker/` (MV3 service worker), `content/` (MV3 content scripts), `template/`, `tab/`, `oauth/`,
  `context-menu/`, `analytics/`, and `common/` directories, plus `src/options.html`, `src/popup.html`,
  `src/migrate.html`.
- `src/migrate.html` / `src/lib/ui/migrate/` exists specifically to help migrate a user's data/settings from the
  legacy storage format to the new one — this is a real, permanent feature of the migration, not a scratch file.

See [MIGRATION-GAPS.md](MIGRATION-GAPS.md) for an evidence-backed list of the known functional gaps between the
legacy CoffeeScript implementation and the new TypeScript one (non-UI). Consult it before assuming a feature has
already been ported.

**Do not "fix" legacy CoffeeScript files by rewriting them in TypeScript unless explicitly asked to migrate that
specific piece of functionality.** When asked to migrate functionality, prefer creating idiomatic new TypeScript
(strict mode, DI via `inversify`, React function components with MUI) rather than a literal line-by-line port.
Once a piece of legacy functionality has an equivalent under `src/lib/**/*.ts(x)`, the corresponding `.coffee`
file/logic should eventually be removed — check whether that has already happened before assuming legacy code is
still in use.

## Tech Stack (new codebase)

- **Language**: TypeScript (strict mode), targeting `es2022`, compiled/bundled with type-stripping via rolldown
  (see `tsconfig.json`). Path alias `extension/*` maps to `src/lib/*`.
- **UI**: React 19 + MUI (`@mui/material`, `@mui/icons-material`, `@mui/x-data-grid`) + Emotion for styling. SCSS
  is still used in a couple of places (`src/scss/migrate.scss`, `src/scss/popup.scss`) and compiled by a custom
  Sass plugin in `rolldown.config.mjs`.
- **DI**: `inversify` (re-exported through `src/lib/common/di.ts`, which also imports `reflect-metadata`).
  Decorators (`experimentalDecorators`/`emitDecoratorMetadata`) are enabled for this reason.
- **Build**: [rolldown](https://rolldown.rs) configured in `rolldown.config.mjs`. Each entry point in the
  `entries` map produces an IIFE bundle under `dist/temp/...`. The config also has custom plugins to: copy static
  assets/images/vendor files, compile SCSS to CSS, minify/copy `_locales` i18n files, copy `manifest.json`/other
  JSON (injecting the version from `package.json`), and copy root HTML files.
- **Manifest**: Manifest V3 (`src/manifest.json`) — service worker background (`lib/worker/background.js`),
  `action` (not `browser_action`), `host_permissions`/`optional_host_permissions`, `scripting` permission.
- **Linting/formatting**: [oxlint](https://oxc.rs) (`.oxlintrc.json`) and [oxfmt](https://oxc.rs) (`.oxfmtrc.json`)
  — not ESLint/Prettier, even though the config shape looks similar (rules use `@typescript-eslint/*` names for
  compatibility). Both ignore `dist/**` and `src/vendor/**`. Import ordering in `.ts`/`.tsx` files is enforced by
  `import-x-js/order`, loaded through oxlint's `jsPlugins` support (`eslint-plugin-import-x`, aliased to
  `import-x-js` because `import`/`import-x` are reserved for oxlint's native plugin).
- **Package manager**: npm (`package-lock.json` is present). Node.js v22+ required (see `CONTRIBUTING.md`).

## Key Commands

Run from the repository root:

```sh
npm install              # install dependencies
npm run build            # alias for build:prod
npm run build:dev        # type:check, then fast dev build (unminified) into dist/temp
npm run build:prod       # type:check, then minified build + zip into dist/tmplat.zip
npm run build:watch      # rebuild on file changes (no type checking)
npm run dev              # build:watch + type:check:watch together (concurrently), for local dev
npm run lint             # oxlint --fix
npm run lint:check       # oxlint (no fixes) — used in CI/test
npm run format           # oxfmt (write)
npm run format:check     # oxfmt --check — used in CI/test
npm run fix              # lint + format (writes changes)
npm run test             # lint:check + format:check (no unit tests currently exist)
npm run check            # type:check + lint:check + format:check — full non-mutating verification
npm run type:check       # tsc (noEmit, incremental) — type check only, not part of `npm run test`
npm run type:check:watch # tsc --watch — used by `npm run dev`
npm run analyze          # bundle analysis (rollup-plugin-visualizer) for prod build
```

There is currently **no unit test runner/framework configured** — `npm run test` only checks linting/formatting.
Do not assume Jest/Vitest/Mocha exist unless you find evidence of them being added.

## Conventions & Notes for Agents

- Prefer editing/adding TypeScript under `src/lib/**` over touching `.coffee` files or `.legacy.html` pages,
  unless the task is specifically about legacy behavior or the migration path itself.
- Use the `extension/*` path alias (maps to `src/lib/*`) for imports within TypeScript, matching existing files.
- Order imports as: builtin/external packages first, then internal `extension/*` and relative imports, then
  `object`/`type`/`unknown` imports — alphabetized case-insensitively, with no blank lines between groups. This
  is auto-fixable via `npm run lint`.
- Follow the existing DI pattern: inject dependencies via `inversify`, don't introduce a second DI framework.
- `TemplateContextName` values (including alias names) are written in **camel case** (e.g. `browserFullVersion`)
  so they read well in the guide, but `TemplateContextManager` registers them via `toTemplateContextKey()`, which
  lower-cases them (`TemplateContextKey = Lowercase<TemplateContextName>`). Templates are matched
  case-insensitively either way, so casing is cosmetic — but keep the value equal to the member name with a
  lower-cased first letter, and never rely on a context name being lower case at the type level.
- `TemplateContextOptions` property names are likewise camel case, and are documented in
  `template-context-options-documentation.ts`. That descriptor's type is _derived from the model_
  (`OptionsDocumentation<TemplateContextOptions>`), so adding an option to `buildOptions()` without documenting it
  is a compile error — never widen or cast around this, just document the new option.
- Templates use `tmplat-mustache`, a fork of mustache.js — **not** stock Mustache. Tags use _single_ curly braces
  (`{name}`, `{#name}...{/name}`, `{^name}`, `{.}`, `{!...}`), values are **unescaped by default**, and
  `{{name}}`/`{&name}` is what HTML-escapes. Stock syntax fails silently rather than erroring, so verify any
  template snippet against the engine before documenting it.
- New UI should be React function components using MUI components/theme, not Bootstrap/jQuery/Backbone.
- Respect `oxlint`/`oxfmt` config (2-space indent implied, single quotes, trailing commas, 120 print width). Run
  `npm run fix` after making changes, and `npm run lint:check`/`npm run format:check` (or `npm run test`) before
  considering a change complete.
- After any non-trivial TypeScript change, run `npm run type:check` (`tsc`, configured with `noEmit` +
  `incremental`) and `npm run build:dev` to make sure types and the rolldown build are both still fine. Note:
  rolldown (like esbuild/swc) only strips types during bundling and never validates them on its own — that's why
  both `build:dev` and `build:prod` now run `npm run type:check` first, so a type error fails the build instead
  of silently shipping. There is a known backlog of pre-existing type errors (currently failing `type:check`,
  and therefore `build:dev`/`build:prod`), so compare against the baseline rather than expecting zero, and don't
  assume `npm run build` will succeed until that backlog is cleared. For local dev, `npm run dev` runs
  `build:watch` and `type:check:watch` side by side — `build:watch` itself skips type checking so rebuilds stay
  fast, while `type:check:watch` reports errors live in parallel. `npm run check` runs `type:check` + `lint:check`
  - `format:check` together as a full, non-mutating verification pass.
- Always run `npm run build` after finishing a set of changes (not just `build:dev`/`type:check`), so the user can
  load the freshly built extension from `dist/` and try it out immediately.
- The extension's version is derived from `package.json` at build time and injected into `manifest.json`; don't
  hardcode versions in `src/manifest.json` (it intentionally stays `0.0.0`).
- i18n strings live in `src/_locales/<locale>/messages.json` and are referenced via `__MSG_*__` placeholders
  (see `manifest.json`) or the `intl` utilities under `src/lib/common/intl/`.
- `src/lib/declarations.d.ts` holds ambient type declarations, notably for the untyped vendored legacy scripts.

## Verification Performed While Writing This File

- Confirmed manifest is MV3 (`src/manifest.json`: `manifest_version: 3`, `action`, `background.service_worker`).
- Confirmed legacy CoffeeScript files still exist alongside new TS/TSX equivalents in `src/lib/` (e.g.
  `background.coffee` vs `src/lib/worker/`, `options.coffee`/`options.legacy.html` vs `src/lib/ui/options/` +
  `src/options.html`, `popup.coffee`/`popup.legacy.html` vs `src/lib/ui/popup/` + `src/popup.html`).
- Confirmed React + MUI is the actual UI stack in use (`package.json` devDependencies, `src/lib/ui/**`
  component/app folder structure, `tsconfig.json` `"jsx": "react-jsx"`).
- Confirmed the build tool is rolldown (`rolldown.config.mjs`, `package.json` scripts), not Grunt (no
  Gruntfile present in this repo).
- Confirmed lint/format tooling is oxlint/oxfmt (`.oxlintrc.json`, `.oxfmtrc.json`, `package.json` scripts),
  not ESLint/Prettier.
- Confirmed `inversify` + `reflect-metadata` is the DI mechanism (`src/lib/common/di.ts`).
