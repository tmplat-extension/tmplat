# AGENTS.md

Guidance for AI coding agents (and human contributors) working in this repository.

## Project Overview

**tmplat** (`package.json` name: `tmplat`) is a Google Chrome extension that quickly and easily copies info
about the current page using a simple, unique template system.

This repository is **mid-migration** from a legacy codebase (internally still referred to as "Template") to the
new "tmplat" codebase. Both old and new code currently coexist in `src/`. Understand which "world" a file
belongs to before editing it.

| Aspect            | Legacy ("Template")                                                                                                          | New ("tmplat")                                                                 |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Language          | CoffeeScript (`.coffee`)                                                                                                     | TypeScript (`.ts` / `.tsx`)                                                    |
| UI framework      | Bootstrap 2/3 + jQuery + Backbone + Mustache (`.html` templates)                                                             | React + MUI (Material UI) + Emotion                                            |
| Manifest          | Manifest V2 (background page, `browser_action`, etc.)                                                                        | Manifest V3 (`src/manifest.json` — service worker, `action`)                   |
| Build tool        | Grunt (no longer present in this repo)                                                                                       | [rolldown](rolldown.config.mjs) via `rolldown.config.mjs`                      |
| Dependency style  | Vendored libraries in `src/vendor/` (jQuery, Backbone, Underscore, Async, Mustache, purl.js, date-ext, md.min.js, Bootstrap) | npm packages (React, MUI, inversify, luxon, es-toolkit, tmplat-mustache, etc.) |
| DI / architecture | Ad-hoc globals/singletons                                                                                                    | `inversify` DI container (see `src/lib/common/di.ts`)                          |

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

- **Language**: TypeScript (strict mode), targeting `es2025`, compiled/bundled with type-stripping via rolldown
  (see `tsconfig.json`). Path alias `extension/*` maps to `src/lib/*`.
  - `target`/`lib` are deliberately pinned to `es2025` rather than `esnext`. `esnext` is a _moving_ target that
    includes unratified proposals no runtime has shipped, so it type-checks code that crashes at runtime. Although
    the extension itself only runs in Chrome (`minimum_chrome_version` 152), the unit tests execute the same source
    under Node, which makes **Node the effective lower bound** — and Node 24 implements all of ES2025 but none of
    ES2026. The repo therefore requires Node 24 (`engines.node`, `.node-version`), so the runtime floor and the
    `es2025` target line up exactly; CI previously ran Node 22, which was quietly weaker than this rationale
    assumed. This was not hypothetical: `Map.prototype.getOrInsert`/`getOrInsertComputed` (ES2026, Chrome 145+) had
    already reached `main` in three services and passed `tsc` while being unrunnable under Node. Use
    `getOrInsertComputed` from `extension/common/map.utils` instead of the native method.
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
- **Package manager**: pnpm (`pnpm-lock.yaml`), pinned via the `packageManager` field in `package.json`. `npm`/
  `yarn` are blocked by an `only-allow` preinstall guard, so use `pnpm install` (CI uses
  `pnpm install --frozen-lockfile`). Node.js v24.15+ required — the exact version lives in `.node-version`, which both
  `actions/setup-node` and most version managers read, and `engines.node` plus `engineStrict: true` in
  `pnpm-workspace.yaml` make an unsupported Node fail up front rather than midway through a build. Note that
  `engineStrict` gates `pnpm run` as well as `pnpm install`, and that pnpm 10+ reads settings from
  `pnpm-workspace.yaml`, **not** `.npmrc` — an `engine-strict=true` there is silently ignored.
  - If a version manager reports the wrong Node here, check that it isn't pinning pnpm itself to an older
    runtime. Volta, for example, binds a global tool to whichever Node was default when it was installed, so
    `node -v` and `pnpm exec node -v` can disagree; `volta install pnpm@<version>` rebinds it.
  - pnpm blocks dependency install scripts by default. The allowlist lives under `allowBuilds` in
    `pnpm-workspace.yaml` and is deliberately tiny (`@parcel/watcher`, `unrs-resolver`). If a new dependency needs
    to build a native binary, add it there with a comment saying why — don't disable the guard. Note
    `unrs-resolver` is what `eslint-plugin-import-x` uses to resolve modules, so linting breaks without it.
- **Dependency split**: although the package is `private` and every dependency is bundled by rolldown (nothing is
  installed at a user's runtime), `dependencies` and `devDependencies` are kept separate and mean something
  specific here: **`dependencies` is exactly the set of packages whose code ends up inside the shipped bundle**,
  `devDependencies` is build/test/type-only tooling. That makes `npm audit --omit=dev` answer "does this CVE
  actually reach users?", and keeps the shipped surface reviewable. All `@types/*` and
  ambient-only packages (`user-agent-data-types`) are dev, since types are erased at build time. The split is
  machine-enforced by `import-x-js/no-extraneous-dependencies` in `.oxlintrc.json`, so it cannot silently rot:
  importing a `devDependency` from shipped code under `src/` is a lint error, and `devDependencies` are only
  permitted in `**/*.test.ts(x)`, `src/lib/test/**`, `e2e/**` and root `*.config.*` files. If you add a package,
  put it in the section matching where you import it rather than defaulting to `devDependencies`.

## Key Commands

Run from the repository root:

```sh
pnpm install              # install dependencies
pnpm build            # alias for build:prod
pnpm build:dev        # type:check, then fast dev build (unminified) into dist/temp
pnpm build:dev:watch  # rebuild on file changes (no type checking)
pnpm build:prod       # type:check, then minified build + zip into dist/tmplat.zip
pnpm dev              # build:dev:watch + type:check:watch together (concurrently), for local dev
pnpm lint             # oxlint --fix
pnpm lint:check       # oxlint (no fixes) — used in CI/test
pnpm format           # oxfmt (write)
pnpm format:check     # oxfmt --check — used in CI/test
pnpm fix              # lint + format (writes changes)
pnpm test             # lint:check + format:check + test:unit
pnpm check            # type:check + lint:check + format:check + test:unit — full non-mutating verification
pnpm test:unit        # vitest run — unit tests only
pnpm test:unit:watch  # vitest — unit tests in watch mode
pnpm test:unit:coverage # vitest run --coverage — writes a report to dist/coverage
pnpm test:e2e         # playwright test — builds the extension, then drives it in a real Chromium
pnpm type:check:e2e   # tsc -p e2e/tsconfig.json — Playwright does not type check specs itself
pnpm type:check       # tsc (noEmit, incremental) — type check only
pnpm type:check:watch # tsc --watch — used by `pnpm dev`
```

Unit tests run on **[Vitest](https://vitest.dev)** (`vitest.config.mts`) — not Jest/Mocha. Tests are colocated
with the code they cover as `<name>.test.ts` (`.test.tsx` where the test contains JSX). The config defines two
projects: **`node`** (covering `analytics`, `common`, `context-menu`, `oauth`, `tab`, `template`, `url-shortener`
and `worker`) and **`dom`** (`content` and `ui`, running under `jsdom`). Run one with
`pnpm exec vitest run --project dom`; `pnpm test:unit` runs both. React components are rendered via `renderUi()` from
`extension/test/ui`, which wraps them in the app's context providers. Shared helpers (browser API fake, logger
mock, in-memory `DataStorage`, tab builders) live in `src/lib/test/` and are imported as `extension/test/*`.

End-to-end tests run on **[Playwright](https://playwright.dev)** (`playwright.config.ts`), with specs in `e2e/`.
They load the built extension from `dist/temp` into a real Chromium persistent context, so they cover what unit
tests cannot: the manifest, service worker registration, content script injection and the system clipboard. `e2e/`
is outside the main `tsconfig.json` `include`, so it has its own `e2e/tsconfig.json` and its own `type:check:e2e`
script. `pnpm test:e2e` builds first (set `E2E_SKIP_BUILD=true` to reuse an existing `dist/temp`), and needs
`pnpm exec playwright install chromium` once. `pnpm test` deliberately excludes e2e to stay fast; CI runs it as a
separate job. See [TESTING.md](TESTING.md) for the full strategy, current coverage and the e2e gotchas (notably:
the headless shell cannot load extensions, and template execution cannot be driven from a popup opened as a tab).

## Conventions & Notes for Agents

- Prefer editing/adding TypeScript under `src/lib/**` over touching `.coffee` files or `.legacy.html` pages,
  unless the task is specifically about legacy behavior or the migration path itself.
- Use the `extension/*` path alias (maps to `src/lib/*`) for imports within TypeScript, matching existing files.
- Order imports as: builtin/external packages first, then internal `extension/*` and relative imports, then
  `object`/`type`/`unknown` imports — alphabetized case-insensitively, with no blank lines between groups. This
  is auto-fixable via `pnpm lint`.
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
  See [TEMPLATE-OPERATION-LEAK.md](TEMPLATE-OPERATION-LEAK.md) for a known open bug in this area: referencing an
  `Operation` context entry bare (e.g. `{camelCase}` instead of `{#camelCase}...{/camelCase}`) renders the
  renderer's JavaScript source into the user's output. This also breaks `{dateTime}`, `{lastModified}` and
  `{shorten}`, which declare a `Standard` category and are _documented_ to work bare (they did in 1.x). The fix is
  specified and verified in that document, but is blocked on a `tmplat-mustache` release — don't work around it in
  individual entry files.
- New UI should be React function components using MUI components/theme, not Bootstrap/jQuery/Backbone.
- Respect `oxlint`/`oxfmt` config (2-space indent implied, single quotes, trailing commas, 120 print width). Run
  `pnpm fix` after making changes, and `pnpm lint:check`/`pnpm format:check` (or `pnpm test`) before
  considering a change complete.
- After any non-trivial TypeScript change, run `pnpm type:check` (`tsc`, configured with `noEmit` +
  `incremental`) and `pnpm build:dev` to make sure types and the rolldown build are both still fine. Note:
  rolldown (like esbuild/swc) only strips types during bundling and never validates them on its own — that's why
  both `build:dev` and `build:prod` now run `pnpm type:check` first, so a type error fails the build instead
  of silently shipping. `type:check` currently passes cleanly, so treat **any** type error as one you introduced.
  For local dev, `pnpm dev` runs
  `build:dev:watch` and `type:check:watch` side by side — `build:dev:watch` itself skips type checking so rebuilds stay
  fast, while `type:check:watch` reports errors live in parallel. `pnpm check` runs `type:check` + `lint:check`
  - `format:check` + `test:unit` together as a full, non-mutating verification pass.
- Add or update unit tests alongside any change to logic under a tree covered by either Vitest project (see
  "Key Commands"). Colocate them as `<name>.test.ts`/`.test.tsx`, import `describe`/`it`/`expect`/`vi` explicitly
  from `vitest` (globals are disabled), and substitute collaborators through the existing DI/interface seams
  rather than `vi.mock`. Mocks and stubbed globals reset automatically between tests. For React components, render
  through `renderUi()` and assert on accessible roles/text — never MUI class names or internal state. Note MUI's
  `Switch` exposes `role="switch"`, not `role="checkbox"`.
- **A method that returns a `Promise` must be declared `async`** (or must route every failure through a rejected
  promise). A non-`async` method whose signature says `: Promise<T>` still throws _synchronously_ if it validates
  arguments or looks something up before its first `await`, which silently bypasses a caller's `.catch(...)`.
  Neither `tsc` nor oxlint catches this. It has been found four separate times in this codebase
  (`OptionalDataRepository`, `MessageService`, `TabService.sendTabMessage`, all of `OAuthService`). Related:
  `.then(onFulfilled, onRejected)` handlers are _siblings_ — `onRejected` never sees what `onFulfilled` throws, so
  use a trailing `.catch()`.
- Always run `pnpm build` after finishing a set of changes (not just `build:dev`/`type:check`), so the user can
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
