# Testing

This document describes how automated testing works in this repository, what is currently covered, and how it is
expected to grow.

## Tooling

| Concern            | Tool                                                                           |
| ------------------ | ------------------------------------------------------------------------------ |
| Unit test runner   | [Vitest](https://vitest.dev) (`vitest.config.mts`)                             |
| Assertions/mocking | Vitest's built-in `expect` and `vi` (Jest-compatible API)                      |
| Coverage           | `@vitest/coverage-v8` (reported on demand only — no threshold is enforced)     |
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

| Project | Environment | Covers                                                                                       |
| ------- | ----------- | -------------------------------------------------------------------------------------------- |
| `node`  | `node`      | `analytics`, `common`, `context-menu`, `oauth`, `tab`, `template`, `url-shortener`, `worker` |
| `dom`   | `jsdom`     | `content`, `ui`                                                                              |

The split exists so the large non-DOM suite doesn't pay the cost of constructing a DOM per file. Run one project
with `pnpm exec vitest run --project dom`; `pnpm test:unit` runs both.

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
  `docs/changelog.json`, so an invented version such as `'1.3.0'` is a compile error. A scoped `vitest` run will not
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
| `extension/test/oauth.mock`                       | `createOAuthServiceMock()` returns an `OAuthService` reporting a fixed authentication.                  |
| `extension/test/messaging.fake`                   | `installRuntimeMessagingFake()` records `runtime.onMessage` listeners and can `dispatch()` to them.     |
| `extension/test/template-context-manager.factory` | `createTestTemplateContextManager()` builds a real `TemplateContextManager` over fakes.                 |
| `extension/test/data-service.fake`                | `FakeDataService` backs each storage area with its own `FakeDataStorage`.                               |
| `extension/test/tab.fake`                         | `createTab()`/`createTabContext()` builders for tab and tab-context fixtures.                           |
| `extension/test/migration.fake`                   | `createMigrationContext()` builds a `DataMigrationContext` over in-memory legacy storage.               |
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
- **`src/lib/url-shortener/`** — all four providers (`da-gd`, `spoo-me`, `yourls`, `bitly`), driven through a faked
  `fetch`.
- **`src/lib/oauth/`** — `OAuthService` delegation and `BitlyOAuthProvider`, which also exercises the shared
  `OAuthProvider` base class (auth flow, token exchange, persistence, revocation).
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
- **`src/lib/analytics/`** — service hit dispatch, schema, repository install and the v1.2.9 data migrator.
- **`src/lib/worker/`** — `BackgroundWorker`: listener registration, ordering relative to the extension manager
  (listeners must be attached before any `await`, since the worker can be woken by a message), and failure
  propagation.
- **`src/lib/content/`** — `AnyContent` injection-marker idempotency (Chrome can inject the same content script
  twice, which would otherwise double-register every listener) and version/extension scoping of that marker;
  `HomepageContent` install-button rewriting on tmplat.com.

`vitest.config.mts` restricts test discovery to these trees. When testing expands into another area (see below),
widen the `include` patterns accordingly.

**Deliberately not unit tested:** the DI configuration modules (`*.config.ts`), the entry points (`index.ts`) and
the token/interface modules (`worker.ts`, `content.ts`). A container smoke test resolving `WorkerToken` was tried
and rejected: the container instantiates repositories eagerly, so it reads the `browser` global while the module is
being _imported_, which is before the per-test browser API fake is installed. The e2e suite covers this far better
anyway — it proves the real container resolves by actually running the extension. These files do drag the reported
per-directory coverage down; that is left honest rather than excluded.

### Notable coverage

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
  rather than surfaced to the user, that Bitly never falls back to a shared token and revokes a rejected one
  (`SHO401000`), and that YOURLS sends a time-limited SHA-256 signature rather than the raw token.
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

## Not yet covered

The following are intentionally out of scope for now, in rough order of likely value:

1. `EuropaMarkdownService.convert` — currently covered only as far as its empty-input guard. Now unblocked by the
   `ui` project's jsdom environment, but the service itself lives in the `node` project.
2. `src/lib/worker/` and `src/lib/content/` — heavily dependent on the WebExtensions API and cross-context
   messaging; largely better served by end-to-end tests than by unit tests with an ever-growing browser API fake.

## Component testing

React components are tested with **React Testing Library** under Vitest's `jsdom` environment, in the `ui`
project (see [Projects](#projects)). `@testing-library/jest-dom` matchers and RTL's `cleanup()` are registered
globally by `src/lib/test/setup-ui.ts`, so tests never wire those up themselves.

Render through **`renderUi`** (`extension/test/ui`) rather than RTL's bare `render`. It wraps the component in the
same context providers the real entry points install (`LoggingContext`, `IntlContext`, `TabsContext`,
`AppearanceContext`, `SettingsContext`, `OAuthContext`, `TemplatesContext`, `ErrorMessageContext`), so a component
calling `useIntl()`/`useSettings()` works without every test rebuilding that eight-deep provider tree:

```tsx
renderUi(<AnalyticsSettings onChange={onChange} settings={{ enabled: false }} />, {
  contexts: { settingsService: { ... } },
});
```

Every context is optional and takes a **partial** stub, so a test supplies only the members the component
actually calls. The default `intl` **echoes the message key** (`getMessage('settings_analytics_title')` returns
`'settings_analytics_title'`), which keeps assertions readable and independent of `_locales` copy — wording
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

| Spec                | Covers                                                                                                                                                        |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `extension.spec.ts` | The extension loads, the service worker registers, the built version is injected into the manifest, and default data is seeded into the real `chrome.storage` |
| `options.spec.ts`   | Predefined templates render; creating one persists to `chrome.storage` and survives a reload; validation disables saving                                      |
| `popup.spec.ts`     | The popup lists only popup-enabled templates with their shortcuts, and can open the options page                                                              |
| `copy.spec.ts`      | The full copy pipeline — keystroke on a real page, content script, message to the worker, template rendering against the live DOM, and the system clipboard   |

`copy.spec.ts` is the highest-value spec in the repository: it is the only test that exercises `content/` and
`worker/` together, neither of which has any unit coverage.

### Worth adding next

- Template import/export round-trips.
- The migration page (`migrate.html`) upgrading legacy stored data.
- URL shortening against a stubbed provider endpoint.
- Context menu entries.

Keep the set small and focused on flows that unit tests genuinely cannot cover — these are slower and more
maintenance-heavy than unit tests.
