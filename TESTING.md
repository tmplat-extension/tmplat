# Testing

This document describes how automated testing works in this repository, what is currently covered, and how it is
expected to grow.

## Tooling

| Concern            | Tool                                                                           |
| ------------------ | ------------------------------------------------------------------------------ |
| Unit test runner   | [Vitest](https://vitest.dev) (`vitest.config.mts`)                             |
| Assertions/mocking | Vitest's built-in `expect` and `vi` (Jest-compatible API)                      |
| Coverage           | `@vitest/coverage-v8` (thresholds enforced in CI — see [Coverage](#coverage))  |
| Component testing  | React Testing Library + `jsdom` (the `ui` Vitest project)                      |
| End-to-end testing | [Playwright](https://playwright.dev) (`playwright.config.ts`, specs in `e2e/`) |

### Why Vitest

- Native ESM and TypeScript support with no separate transpile step or `ts-jest`/Babel configuration to maintain.
- Understands the repository's `tsconfig.json` settings that matter for tests, including the decorators used by
  `inversify`.
- Reuses the `extension/*` → `src/lib/*` path alias, so tests import modules exactly as source does.
- Independent of the rolldown production build, so test tooling and build tooling can evolve separately.
- Jest-compatible API, so most existing Jest knowledge and documentation still applies.
- Ships a `jsdom` environment, which the React component tests use (see [Projects](#projects)).

## Commands

```sh
pnpm test               # lint:check + format:check + test:unit (the "is this PR OK?" command)
pnpm check              # type:check + lint:check + format:check + test:unit (full verification)
pnpm test:unit          # run the unit tests once
pnpm test:unit:watch    # run the unit tests in watch mode
pnpm test:unit:coverage # run the unit tests and write a coverage report to dist/coverage
pnpm test:e2e           # build the extension and run the Playwright end-to-end suite
pnpm test:e2e:ui        # the same suite in Playwright's interactive UI mode
pnpm test:e2e:report    # open the HTML report from the last CI-style run
pnpm type:check:e2e     # type check e2e/ (Playwright transpiles specs without checking them)
```

`test:e2e` requires a browser: run `pnpm exec playwright install chromium` once beforehand.

CI (`.github/workflows/ci.yml`) runs `type:check`, `type:check:e2e`, `lint:check`, `format:check` and `test:unit` as
separate steps on every push to `main` and every pull request, and runs the e2e suite as a **separate job** (it needs
a browser and a build, so it is slower).

A third **`build`** job runs the full production build (`pnpm build`) and then asserts that the working tree is still
clean afterwards, so a build that writes into the source tree — or generated output that was committed stale — fails
the run rather than going unnoticed. `dist/` is gitignored, so today nothing the build emits is tracked and the
assertion cannot fail; it is there to catch the day that changes. The job also records bundle sizes, since rolldown
logs the size of every chunk it emits, and uploads the packaged extension as the **`tmplat-extension`** artifact.

On CI (`process.env.CI`) the unit tests use extra reporters — `junit`, written to `dist/test-results/vitest-junit.xml`
and uploaded as the **`vitest-report`** artifact, and `github-actions`, which annotates failing assertions inline on
the diff. The upload runs with `if: always()`, so the report survives a failing run, which is when it is most useful.
Locally the default reporter is used and nothing is written to disk. The e2e job likewise uploads a
**`playwright-report`** artifact, though only on failure.

`pnpm test` deliberately does **not** include the e2e suite, so the common pre-commit command stays fast.

## Projects

`vitest.config.mts` defines two projects, both sharing the `extension/*` alias and the same mock-reset settings:

| Project | Environment | Covers                                                                              |
| ------- | ----------- | ----------------------------------------------------------------------------------- |
| `node`  | `node`      | `common`, `context-menu`, `offscreen`, `tab`, `template`, `url-shortener`, `worker` |
| `dom`   | `jsdom`     | `content`, `ui`                                                                     |

The split exists so the large non-DOM suite doesn't pay the cost of constructing a DOM per file. Run one project
with `pnpm exec vitest run --project dom`; `pnpm test:unit` runs both.

### Routing a single `node` file to the `dom` project

A file inside a `node` tree that nonetheless needs a DOM is listed in **`domOverrides`** in `vitest.config.mts`,
which excludes it from the `node` project and adds it to `dom`. There are two reasons a file ends up there:

- **It cannot run under `node` at all.** `src/lib/common/markdown/markdown.service.test.ts`:
  `EuropaMarkdownService` builds `Europa`, which reads the browser-only `self` global at import time and walks real
  DOM nodes while converting.
- **A stub would make the test vacuous.** `src/lib/tab/paste.utils.test.ts` and
  `src/lib/tab/message/paste-message-listener.test.ts` could be driven with duck-typed literals — the sibling
  `shortcut-event-listener.test.ts` does exactly that — but the guards they cover are claims about how real
  elements behave (a non-text input reports a null `selectionStart`; a `contenteditable` has no `value`). Asserting
  those against a hand-rolled object only restates the assumption.

**Do not use a `// @vitest-environment jsdom` docblock for this instead.** The `node` project runs with
`isolate: false`, so a jsdom environment set up inside a shared worker leaks its globals into every other file that
worker runs — and several of those files deliberately assert against a DOM-less environment, so the leak would
silently weaken them rather than fail.

Note that `test.exclude` _replaces_ Vitest's defaults rather than extending them, so the `node` project spreads
`defaultExclude` alongside the overrides.

### Why test modules import statically

**Never move an `import` into a `beforeAll`/`beforeEach` to get a global in place first.** Two things are needed
before a module under test is imported, and `src/lib/test/setup.ts` provides both at **module scope**, which runs
before any test module is imported:

- `globalThis.self`, because `europa` (reached transitively from the markdown service, and so from anything that
  touches `TemplateEngineToken`) reads it while being evaluated.
- The browser API fake, because a DI container is a module-level singleton that eagerly constructs repositories, so
  it reads `browser` while being imported.

Twelve specs used to defer to a dynamic `await import()` inside a hook for one of those two reasons. That
**billed the entire transitive module graph — for the UI containers, all of React/MUI — against a timeout.** It was
originally noticed as `options-ui.config.test.ts` exceeding the 5s `testTimeout`, and "fixed" by moving the import
into `beforeAll` for the 10s `hookTimeout`. That only widened the window: under CPU contention seven suites still
failed with `Hook timed out in 10000ms`.

Static imports remove the exposure rather than widening it, because collection is not bounded by `testTimeout` or
`hookTimeout`. Verified by running the full suite with every core saturated **and** `node_modules/.vite` deleted —
the worst case there is — which previously failed 7 files and now passes, with the profile showing `tests 2%`
against `environment 72% / import 20%`. That split is the point: the cost was never in the tests, so it should never
have been inside a test timeout.

Both module-scope hooks are mutation-verified: removing either makes the affected specs fail outright with
`ReferenceError: browser is not defined` / `self is not defined`, rather than silently reverting to flakiness.

### Isolation and pooling

Each project trades isolation for speed differently, because Vitest's defaults made the suite spend most of its
time on setup rather than on assertions:

- **`dom` uses `pool: 'vmThreads'`.** The default `threads` pool builds a brand new jsdom for every test file,
  which was ~14s of tracked time across 17 files. `vmThreads` runs each file in its own VM context while sharing
  one jsdom per worker, so per-file isolation is preserved and the environment is constructed once per worker.
- **`node` uses `isolate: false`.** These files share most of their module graph (DI, `common` utils), which was
  otherwise re-evaluated from scratch for every file. The module registry is now shared per worker.
- **`fsModuleCache: true`** (root level) persists transformed modules under `node_modules/.vite` between runs, so
  a cold `vitest run` doesn't re-transform the whole graph. It's invalidated by file content and reinstalls.

The `isolate: false` trade-off has one real constraint worth knowing: **a module must not read a mutable global at
import time**, and tests must not call `vi.resetModules()`. Combining the two is what broke this suite when
isolation was first turned off — `system.utils` used to capture `navigator` at module scope, and its test reset the
registry after stubbing it, so whichever file the worker imported next re-evaluated the module against the real
(unstubbed) `navigator` and crashed. `system.utils` now re-reads `navigator` on every call, which is also more
correct in the extension itself. If you find yourself reaching for `vi.resetModules()`, fix the module instead.

Both decisions are verifiable: run `pnpm exec vitest run --sequence.shuffle` a few times. Order-dependent leakage between
files shows up as failures that only appear under some seeds.

`setup.ts` defines `self` at module scope (it is the global scope in both a service worker and a page). Some
bundled dependencies — `europa`, reached transitively from the markdown service — read it when they are _imported_,
so a `beforeEach` would run too late.

The `node` project is not DOM-free by accident — the few modules there that touch DOM globals stub only what they
use (`vi.stubGlobal('document', ...)`), which keeps that dependency explicit and visible in the test.

## Conventions

- Tests are **colocated** with the code they cover and named `<name>.test.ts` (or `<name>.test.tsx` where the
  test contains JSX) — e.g. `src/lib/common/url.utils.ts` is covered by `src/lib/common/url.utils.test.ts`.
- Import `describe`/`it`/`expect`/`vi` explicitly from `vitest`; globals are deliberately disabled.
- Import the code under test via the `extension/*` alias, exactly as production code does.
- Prefer substituting collaborators through the seams the code already has — constructor injection (`inversify`),
  factory arguments, or an interface such as `DataStorage` — over mocking modules with `vi.mock`.
- Mocks and globals are reset between tests automatically (`clearMocks`, `restoreMocks`, `unstubGlobals`,
  `unstubEnvs`), so tests never need to clean up after themselves.
- **`ExtensionVersion` is a closed union** generated into `src/lib/common/extension-version.ts` from
  `src/changelog.json`, so an invented version such as `'1.3.0'` is a compile error. A scoped `vitest` run will not
  catch it — rolldown only strips types — so it surfaces later in `type:check`. Use `legacyMigrationVersion` /
  `nonMigrationVersion` from `extension/test/migration.fake` rather than version literals.

### Shared test helpers

Helpers live in `src/lib/test/` and are importable as `extension/test/*`:

| Helper                                            | Purpose                                                                                                 |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `extension/test/setup`                            | Vitest setup file; installs a fresh browser API fake before every test.                                 |
| `extension/test/browser-api.mock`                 | Fake of the WebExtensions API. Call `getBrowserApiMock()` in a test to configure it or assert on calls. |
| `extension/test/logger.mock`                      | `createLoggerMock()`/`createLoggingServiceMock()` return a `Logger`/`LoggingService` of spies.          |
| `extension/test/data-storage.fake`                | `FakeDataStorage` is an in-memory `DataStorage` implementation.                                         |
| `extension/test/storage-area.fake`                | `FakeBrowserStorageArea`/`FakeDomStorage` back the two real `DataStorage` implementations.              |
| `extension/test/fetch.mock`                       | `installFetchMock()` plus response builders and request-inspection helpers for HTTP-calling code.       |
| `extension/test/intl.mock`                        | `createIntlServiceMock()` returns an `IntlService` that echoes the message key.                         |
| `extension/test/messaging.fake`                   | `installRuntimeMessagingFake()` records `runtime.onMessage` listeners and can `dispatch()` to them.     |
| `extension/test/template-context-manager.factory` | `createTestTemplateContextManager()` builds a real `TemplateContextManager` over fakes.                 |
| `extension/test/data-service.fake`                | `FakeDataService` backs each storage area with its own `FakeDataStorage`.                               |
| `extension/test/tab.fake`                         | `createTab()`/`createTabContext()` builders for tab and tab-context fixtures.                           |
| `extension/test/migration.fake`                   | `createMigrationContext()` builds a `DataMigrationContext` over in-memory storage.                      |
| `extension/test/setup-ui`                         | Setup file for the `ui` project; registers jest-dom matchers and RTL `cleanup()`.                       |
| `extension/test/ui`                               | `renderUi()` renders a component inside the app's context providers (see below).                        |

The browser API fake only implements the members that current tests actually need. Extend it as coverage grows
rather than reaching for a heavier third-party fake before it's warranted.

## Current scope

The first phase of testing deliberately targets pure, deterministic logic that carries real risk of silent
breakage:

- **`src/lib/common/`** — `array.utils`, `object.utils`, `enum.utils`, `url.utils`,
  `extension-version.utils`, `codec/base64.utils`, `error/field-error.utils`, `intl/i18n.utils`,
  `validation/validation.utils` and `data/migration/data-migration-step-builder`.
- **`src/lib/common/data/`** — `data-storage` (all three `DataStorage` implementations, via a shared contract suite),
  `data.repository` and `migration/data-migration-step-builder`.
- **`src/lib/template/`** — `template.service`, `tmplat-mustache` rendering behavior,
  `context/template-context.utils`, and structural invariants of the context entry registry
  (`context/entry/index`).
- **`src/lib/url-shortener/`** — all three providers (`da-gd`, `spoo-me`, `yourls`), driven through a faked
  `fetch`.
- **`src/lib/common/` services** — `settings`, `message` (service, config, listener, id generator), `appearance`,
  `geolocation` (both the navigator- and offscreen-backed services), `changelog`, `clipboard` and `markdown`.
- **`src/lib/template/context/entry/`** — the entry `render` implementations, grouped by family rather than one
  file per entry: URL decomposition, string operations, tab/page metadata, async collaborators (cookies,
  geolocation, shortening, markdown), date/time and system, data/options, and deprecated aliases.
- **`src/lib/common/` infrastructure** — `logging` (service, named-logger caching, `ConsoleLogger` level gating),
  `validation` (`ValidationService`/`SchemaValidator` over real zod schemas), `version`, `intl`, `system`, `state`,
  `action`, `offscreen` (ref-counted document lifecycle) and `url-shortener.service` provider selection.
- **`src/lib/tab/`** — `TabService` over the `tabs`/`scripting` fakes with the real `ValidationService`, the tab
  content/context message schemas and listeners, and the context-menu/shortcut event listeners (including the
  auto-paste caret-splice path).
- **`src/lib/context-menu/`** — `onClicked` routing, click-URL precedence and menu building for every action mode.
- **`src/lib/worker/`** — `BackgroundWorker`: listener registration, ordering relative to the extension manager
  (listeners must be attached before any `await`, since the worker can be woken by a message), and failure
  propagation.
- **`src/lib/content/`** — `AnyContent` injection-marker idempotency (Chrome can inject the same content script
  twice, which would otherwise double-register every listener) and version/extension scoping of that marker;
  `HomepageContent` install-button rewriting on tmplat.com.

`vitest.config.mts` restricts test discovery to these trees. When testing expands into another area (see below),
widen the `include` patterns accordingly.

**DI configuration modules (`*.config.ts`) now have one test each** — see "Notable coverage" below. The earlier
attempt was abandoned because the container reads the `browser` global while the module is being _imported_, before
the per-test browser API fake is installed. `setup.ts` therefore installs the fake at module scope as well as per
test, which is early enough for an import-time read and lets these specs import statically — see "Why test modules
import statically" below. **Still deliberately not unit tested:** the entry points (`index.ts`) and the
token/interface modules (`worker.ts`, `content.ts`).

### Notable coverage

- **Every template context entry is behaviourally covered by a contract, not by a file-per-entry suite.**
  `src/lib/template/context/entry/contract.test.ts` enumerates the registry at runtime and applies a per-category
  contract to all ~181 entries: a `Standard` entry must render a value bare, an `Operation` entry must consume its
  section body, an array `Collection` must iterate with `{.}`, an object `Collection` must resolve as a section —
  and, above all, **no entry may ever render its renderer's JavaScript source** into the user's output. A
  file-for-file suite would be the wrong shape here, because 171 of the 183 files in that directory contain zero
  branches: they are declarative definition objects, and asserting on them is asserting that a literal equals
  itself. What the family suites (`url`, `tab-metadata`, `string-operation`, ...) could not give is a guarantee for
  entries nobody thought to pick — before this contract existed, five deprecated option entries
  (`bitlyAccount`, `menuOptions`, `menuPaste`, `yourlsAuthentication`, `yourlsSignature`) had **never had their
  renderer executed at all**, and a new entry would have inherited the same silence. Keep value assertions in the
  family suites; the contract only asserts the shape implied by the declared category. Two blocks in it are
  whole-category regression guards rather than per-entry expectations — no operation may leak its renderer source
  when referenced bare (MIGRATION-GAPS §8), which is asserted for every registered
  operation so that a new one is covered the moment it is registered, and the six `select`/`xpath` operations that
  consume their section body are pinned under MIGRATION-GAPS §8.
- **The migrate page is a state machine, and its tests are the regression guard for a release blocker.** The page
  used to `await migrate()` _before_ `root.render()`, so the whole migration — including the steps that delete the
  legacy key once they have read it — had already run by the time the user saw anything, and a reload rendered a
  permanently blank tab (`migrate()` rejects with `MIG409000` once complete, and an `ErrorBoundary` only catches
  errors thrown _during_ render). `app.test.tsx` pins all three properties: nothing is migrated until the user
  clicks, `MIG409000` is a normal screen rather than a failure, and retry goes through `retryMigration()` rather
  than `migrate()` — mutation-verified by reintroducing each of the three original behaviours in turn. The subtlest
  guard lives in `migration-results.test.tsx`: `DataMigrationOutcome.Completed` means only that the migrator _ran_,
  so failure must be derived from the **step** outcomes too, otherwise a migration in which every step failed is
  indistinguishable from a clean one. When testing this tree, remember `ExtensionError.from()` localizes through
  the browser API, so fixtures that build one must be lazy factories rather than module-level constants, and the
  page uses `useAppearanceResolvedMode`, which needs an `appearanceService` stub with `getResolvedMode` and
  `addResolvedModeChangeListener`.
- **`allFulfilled` reducers must preserve error identity.** `src/lib/common/error/reason.utils.ts` exports
  `firstError(logger, message)`, the reducer to use at any `allFulfilled` site whose rejection is _reported_ rather
  than merely logged. `allFulfilled`'s default `aggregate()` reducer wraps every reason in an `AggregateError`, and
  three separate mechanisms in this codebase then destroy the original: `ExtensionError.fallback(cause, code)` only
  passes a cause through untouched when it is already an `ExtensionError`, so a specific code like `DAT404000` is
  replaced by the generic fallback; `useErrorDetail` renders `error.message` only for an `ExtensionError`, so the
  user gets a generic string; and `MessageService` serialises via `ExtensionError.toJSON()`, which emits no
  `errors` field at all, so the grouped reasons are destroyed outright crossing a message boundary. On top of that,
  `AggregateError`'s default message is `''`, so `logger.error('…', e)` logs a blank. `firstError` wraps
  `any()` — **not `first()`**, which returns `reasons[0]` raw and can therefore throw a non-`Error` that masks a
  real `ExtensionError` from a sibling — and logs the discarded reasons when there is more than one, so nothing is
  lost. Note `reasons` follows `Promise.allSettled`'s _input_ order, so this is deterministic-by-position: a third
  behaviour, not a restoration of `Promise.all`'s temporally-first semantics. The log-only sites (context menus,
  data installers) deliberately keep `aggregate()`, but with an explicit message rather than the blank default.
- **DI container resolution** — every one of the nine `*.config.ts` modules has a sibling `*.config.test.ts` that
  does exactly what the matching `index.ts` does in production: resolve the single entry token (`container.get(
UiToken)` / `WorkerToken` / `ContentToken` / `OffscreenToken`). Resolving the root builds the whole transitive
  constructor-injection graph, so a missing binding _anywhere_ fails the test. `inversify` exposes no
  binding-enumeration API — the container's state is entirely private — so enumeration is impossible, and would
  anyway assert on bindings nothing uses. Assert `toBeInstanceOf(<concrete class>)` rather than `toBeDefined()`, so
  a token bound to the _wrong_ implementation is caught too; both failure modes are mutation-verified. The
  container is a module-level singleton built at import time, so the browser API fake has to exist before the
  module is imported at all — which `setup.ts` guarantees. These tests do not catch tokens that are bound but never
  injected, or wiring that is semantically wrong yet still resolvable. The first run found a release blocker:
  `migrate.html` could not resolve its container at all, so the migration never ran (now fixed;
  MIGRATION-GAPS.md §8).
- **A tree that is in neither Vitest project is silently skipped.** `src/lib/offscreen/` was in neither `nodeTrees`
  nor `domTrees` in `vitest.config.mts`, so a `.test.ts` placed there was never collected — no error, no warning —
  and the tree was excluded from coverage entirely, so it never even showed up as 0%. When adding tests in a new
  directory, check it is listed in one of those two arrays first.

- `src/lib/template/tmplat-mustache.test.ts` is a **characterization test** for the templating engine. Because
  `tmplat-mustache` is a fork of mustache.js with different syntax (single braces, values unescaped by default,
  `{{name}}`/`{&name}` for escaping) and because stock Mustache syntax fails _silently_ rather than erroring, this
  file pins the behavior that the user-facing guide documents. Verify any new template snippet against these tests
  before documenting it.
- `src/lib/common/data/data-storage.test.ts` is a **contract suite**: the same assertions run against
  `BrowserDataStorage`, `DomDataStorage` _and_ `FakeDataStorage`. The two production implementations are used
  interchangeably through DI, so divergence between them is the real risk — and including the fake means a test
  written against it cannot pass on behavior the real implementations do not have. It has already caught the fake
  storing values by reference where both real implementations store by copy.
- The URL shortener provider tests assert not just the happy path but the defensive behavior that matters in
  production: that a success response with a missing/malformed/foreign-host short URL is rejected (`SHO422100`)
  rather than surfaced to the user, and that YOURLS sends a time-limited SHA-256 signature rather than the raw
  token.
- `src/lib/template/context/entry/index.test.ts` asserts structural invariants across the ~250 independently
  authored context entry definitions — unique lower-cased keys, camel case names, and that every alias resolves to a
  real, non-alias entry that lists it back. None of this is expressible in the type system.

- `src/lib/test/template-context-manager.factory.ts` builds a **real** `TemplateContextManager` over lightweight
  fakes rather than a hand-written mock, so entry tests genuinely exercise caching (`computeCacheIfAbsent`), the URL
  stack, and `buildOptions`/`buildTemplate`. Only the nine injected collaborators are faked. Constructing the
  manager at all smoke-tests the outer `render` of every entry definition, since the constructor calls them all.
- `src/lib/template/context/entry/object-collection.test.ts` is a `describe.each` **contract** over the three
  plural entries (`searchParams`, `hashSearchParams`, `cookies`), asserting named access works and that a bare
  reference never leaks the renderer's JavaScript source. Two of the three were broken before it existed.
- Entry tests drive entries **through the template engine** (`TmplatMustache.render(source, manager.context)`)
  rather than calling `render()` directly, so they exercise the same path production does — including section
  lambdas, which is how the object-collection entry defect was found.
- `src/lib/common/extension-manager.test.ts` covers the `chrome.runtime.onInstalled` lifecycle — fresh install,
  update, migration and the same-version "manual reload during development" case — by invoking the listener the
  manager actually registered, rather than calling `onInstall` directly. It uses the **real** `ExtensionInfo` and a
  `findAllTabs` fake that genuinely applies the criteria it is given, so the `isInjectableUrl`/`isHomepageUrl`
  predicates the manager passes in are evaluated rather than assumed. Two bugs previously found by hand
  (`allFulfilled` clobbering sequential mutations, and `new URL('migrate.html')` throwing) both lived on this path.
- `src/lib/ui/options/component/template-data-grid/template-data-grid.test.tsx` demonstrates that **MUI X
  `DataGrid` renders fine under jsdom** — rows, cells, selection checkboxes and both menus are all reachable by
  role, with no `ResizeObserver` polyfill. Phase 6 had skipped the component on the assumption that it could not
  be driven headlessly; that assumption was wrong. Useful specifics: the first `gridcell` of a row is the
  selection checkbox (read a named column with `row.querySelector('[data-field="title"]')` instead); the header
  is `getAllByRole('row')[0]`; a header "select all" produces an **exclude**-type `GridRowSelectionModel` that
  the component has to invert; disabled `MenuItem`s expose `aria-disabled`, not `disabled`; and the footer's
  rows-per-page select and the column menu icon are both effectively hidden under jsdom (MUI hides them by CSS
  until a wider viewport / hover), so pagination is better driven via the **next page** button.
- `src/lib/template/template-engine.test.ts` covers the production render path, which was previously the blind
  spot between two well-covered areas: the ~290 template tests drive `TmplatMustache` directly, and the only
  test that reached the engine stubbed it out entirely. Covering the seam immediately surfaced two linked
  notification defects, both since fixed (§8 of [MIGRATION-GAPS.md](MIGRATION-GAPS.md)). A reminder that high
  aggregate coverage can still leave the _joins_ between components untested.
- `src/lib/ui/common/components/guide/guide.test.tsx` renders the user-facing template guide, which is generated
  from the ~250 context entry definitions. Because it renders them all, it transitively exercises a large number
  of entry branches — it alone accounts for much of the repo-wide branch coverage.

## Coverage

`pnpm test:unit:coverage` writes an HTML and text report to `dist/coverage`. `pnpm test:unit` deliberately does
**not** collect coverage, so the everyday local run stays fast.

`vitest.config.mts` sets a **non-regression floor**, not a target:

| Metric     | Floor |
| ---------- | ----- |
| Statements | 94%   |
| Branches   | 92%   |
| Functions  | 90%   |
| Lines      | 94%   |

Each is a little under the figure at the time it was set, so ordinary churn does not fail CI but deleting a suite
or landing a materially untested feature does. Raise the floor when the real numbers move up and settle; **never
lower it to make a build pass** — if coverage genuinely has to drop, say why in the commit.

Thresholds are only checked when coverage is collected, so CI runs `pnpm test:unit:coverage` rather than
`pnpm test:unit`, and uploads the report as the `vitest-coverage` artifact.

Two caveats when reading the numbers:

- `.scss` files sit inside the `coverage.include` globs and always report 0%, so the headline is slightly
  pessimistic.
- Entry points (`index.ts`) and DI token/interface modules are counted honestly rather than excluded, which is why
  a few directories cannot reach 100%.

## Not yet covered

Nothing is currently tracked here. The remaining uncovered code is the entry points (`index.ts`) and the
token/interface modules, which are deliberately not unit tested — see [Current scope](#current-scope).

## Component testing

React components are tested with **React Testing Library** under Vitest's `jsdom` environment, in the `dom`
project (see [Projects](#projects)). `@testing-library/jest-dom` matchers and RTL's `cleanup()` are registered
globally by `src/lib/test/setup-ui.ts`, so tests never wire those up themselves.

Render through **`renderUi`** (`extension/test/ui`) rather than RTL's bare `render`. It wraps the component in the
same context providers the real entry points install (`LoggingContext`, `IntlContext`, `TabsContext`,
`AppearanceContext`, `SettingsContext`, `TemplatesContext`, `MessagesContext`,
`DataMigrationsContext`, `ErrorDetailContext`), so a component calling `useIntl()`/`useSettings()` works without
every test rebuilding that ten-deep provider tree:

```tsx
renderUi(<LoggingSettings onChange={onChange} settings={{ enabled: false }} />, {
  contexts: { settingsService: { ... } },
});
```

Every context is optional and takes a **partial** stub, so a test supplies only the members the component
actually calls. The default `intl` **echoes the message key** (`getMessage('settings_logging_title')` returns
`'settings_logging_title'`), which keeps assertions readable and independent of `_locales` copy — wording
changes don't break tests.

Guidelines:

- Assert on accessible roles and text, not MUI class names, internal state or prop identity. Don't add
  `data-testid` attributes to production components to make them testable.
- **MUI's `Switch` exposes `role="switch"`, not `role="checkbox"`.**
- A disabled MUI control gets `pointer-events: none`, and `user-event` refuses to click it. To assert a disabled
  control does nothing, use `userEvent.setup({ pointerEventsCheck: 0 })` so the click is genuinely attempted
  rather than rejected up front — otherwise the assertion proves nothing.
- Use `findBy...`/`waitFor` for anything asynchronous; never an arbitrary timeout.

## End-to-end testing

Unit tests cannot tell us whether the packaged extension actually works in a browser: manifest correctness, service
worker registration, content script injection, permissions and clipboard access are only exercised at runtime. That
gap is covered by **[Playwright](https://playwright.dev)**, configured in `playwright.config.ts` with specs in `e2e/`.

Playwright is preferred over Puppeteer here because it has a built-in test runner, assertions, tracing and retries,
and better-documented extension support; Puppeteer supports the same launch flags but leaves the surrounding test
infrastructure to you.

### How it works

- `e2e/global-setup.ts` runs `pnpm build:dev` before the suite, so the tests always run against a **current
  build**. Set `E2E_SKIP_BUILD=true` to skip it while iterating locally.
- `e2e/fixtures.ts` extends Playwright's `test` with extension-aware fixtures. The extension is loaded into a
  **persistent** context (`chromium.launchPersistentContext`), which is the only kind that can load one, pointed at
  `dist/temp` — the actual build output, not the source.
- A static server hosts `e2e/fixture-pages/` on `http://localhost:4321`, giving the tests a real, injectable page.
- The suite runs with a single worker and `fullyParallel: false`, because the tests share one browser profile and one
  system clipboard.

| Fixture             | Purpose                                                                             |
| ------------------- | ----------------------------------------------------------------------------------- |
| `context`           | Persistent context with the unpacked extension loaded                               |
| `serviceWorker`     | The MV3 background worker, for `evaluate()`-ing real `chrome.*` calls               |
| `extensionId`       | The runtime-assigned extension ID, resolved from the worker URL                     |
| `openExtensionPage` | Opens `chrome-extension://<id>/<path>` (e.g. `options.html`)                        |
| `fixturePage`       | The local test page, opened once default data is seeded, with clipboard permissions |

`readClipboard(page)` reads the system clipboard back.

### Gotchas

- **Use the full Chromium build, not the headless shell.** `channel: 'chromium'` is set for this reason; the headless
  shell cannot load extensions at all.
- **Default data is seeded asynchronously** after the worker registers. Reading `chrome.storage` immediately after
  load returns nothing, so assertions poll (`expect.poll`) and **both** `openExtensionPage` and `fixturePage` wait
  for seeding (via the shared `waitForSeededData`) before navigating. This is not optional: when only `fixturePage`
  waited, the options and popup specs intermittently rendered an empty grid and failed roughly one run in three.
- **A closed dialog does not mean the data is persisted.** Saving in the options page updates React state before the
  write reaches `chrome.storage`, so a test that reloads straight after `expect(dialog).toBeHidden()` races the
  write and loses the record. Poll storage for the value before reloading.
- **The extension ID is assigned at load time**, so it must be discovered from the service worker URL rather than
  hard-coded.
- **Template execution cannot be driven from the popup.** Playwright cannot click the browser's action button, so
  `popup.html` has to be opened as an ordinary tab — and Chrome then sets `sender.tab` to the popup's _own_ tab.
  `ExecuteTemplateMessageListener` prefers `sender.tab` over the explicit `tabId` in the message, so a template run
  this way targets the popup and is rejected as a restricted tab. Copy flows are therefore driven through the
  **keyboard shortcut** on a real page instead (`e2e/copy.spec.ts`), which is closer to real usage anyway.
- Opening a new page steals tab focus, so the popup specs call `bringToFront()` on the fixture page and then reload
  the popup, otherwise the popup resolves itself as the current tab.

### Current coverage

| Spec                | Covers                                                                                                                                                                              |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `extension.spec.ts` | The extension loads, the service worker registers, the built version is injected into the manifest, and default data is seeded into the real `chrome.storage`                       |
| `options.spec.ts`   | Predefined templates render; creating one persists to `chrome.storage` and survives a reload; validation disables saving                                                            |
| `popup.spec.ts`     | The popup lists only popup-enabled templates with their shortcuts, and can open the options page                                                                                    |
| `copy.spec.ts`      | The full copy pipeline — keystroke on a real page, content script, message to the worker, template rendering against the live DOM, and the system clipboard                         |
| `migrate.spec.ts`   | The 1.x upgrade path — real legacy data seeded into the extension origin's `localStorage`, preview, migration, template ordering, legacy key removal and the retryable failure path |

`copy.spec.ts` is the highest-value spec in the repository: it is the only test that exercises `content/` and
`worker/` together, and the only one that exercises the real cross-context message passing between them.

`migrate.spec.ts` is the only test that reads legacy data from where 1.x actually wrote it. `LegacyDataService`
is backed by `DomDataStorage('localStorage')`, so legacy keys are plain, JSON-encoded `localStorage` entries on the
**extension's own origin** — not `chrome.storage`. Unit tests substitute that storage, so only a real browser can
prove the page reads the right place. Seeding therefore has to happen from a page already loaded from
`chrome-extension://<id>/...`, which is why the spec opens `options.html` first and only then navigates to
`migrate.html?version=1.2.5`. The version in the query string is the version the user is upgrading _from_, and is
deliberately earlier than the migration's own `1.2.9` key, which names the legacy data _format_.

### Worth adding next

- Template import/export round-trips.
- URL shortening against a stubbed provider endpoint.
- Context menu entries.

Keep the set small and focused on flows that unit tests genuinely cannot cover — these are slower and more
maintenance-heavy than unit tests.
