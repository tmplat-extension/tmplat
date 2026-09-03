# Testing

Unit tests run on [Vitest](https://vitest.dev) (`vitest.config.mts`), end-to-end tests on
[Playwright](https://playwright.dev) (`playwright.config.ts`). Coverage is `@vitest/coverage-v8`; component tests use
React Testing Library under `jsdom`.

## Commands

```sh
pnpm test               # unit tests (alias for test:unit)
pnpm test:unit:watch    # unit tests in watch mode
pnpm test:unit:coverage # unit tests + coverage report in dist/coverage
pnpm test:e2e           # build, then run the Playwright suite
pnpm test:e2e:ui        # the same suite in Playwright's UI mode
pnpm test:e2e:report    # open the HTML report from the last run
pnpm check              # type:check + type:check:e2e + lint:check + format:check (no tests)
```

E2E needs a browser installed once: `pnpm exec playwright install chromium` (and `msedge` to run
`pnpm test:e2e --project=msedge`). Set `E2E_SKIP_BUILD=true` to reuse an existing `dist/temp` while iterating.

CI (`.github/workflows/ci.yml`) runs type checks, lint, format and `test:unit:coverage` in one job; e2e is a separate,
slower job, as a `fail-fast: false` matrix over both browser channels. A third job runs `pnpm build`, asserts the
working tree is still clean, records bundle sizes and uploads the packaged extension. Artifacts: `vitest-report`
(JUnit, uploaded even on failure), `vitest-coverage`, `playwright-report` (on failure) and `tmplat-extension` (pushes
to `main` only).

## Unit tests

Tests are colocated with the code as `<name>.test.ts` (`.test.tsx` when the test contains JSX) and import through the
`extension/*` alias, exactly as production code does.

`vitest.config.mts` defines two projects, and **test discovery is limited to the trees listed there** — a test placed
anywhere else is silently never collected:

| Project | Environment | Trees                                                                               |
| ------- | ----------- | ----------------------------------------------------------------------------------- |
| `node`  | `node`      | `common`, `context-menu`, `offscreen`, `tab`, `template`, `url-shortener`, `worker` |
| `dom`   | `jsdom`     | `content`, `ui`                                                                     |

Run one with `pnpm exec vitest run --project dom`. A file in a `node` tree that genuinely needs a DOM is listed in
`domOverrides` in `vitest.config.mts`, which moves it to the `dom` project.

The projects trade isolation for speed in different ways: `dom` uses `pool: 'vmThreads'` (one jsdom per worker instead
of one per file), `node` uses `isolate: false` (shared module registry per worker), and `fsModuleCache` persists
transformed modules under `node_modules/.vite` between runs. `src/lib/test/setup.ts` installs the browser API fake and
`self` at module scope, before any module under test is imported.

### Shared helpers

Helpers live in `src/lib/test/` and import as `extension/test/*`:

| Helper                                    | Purpose                                                             |
| ----------------------------------------- | ------------------------------------------------------------------- |
| `browser-api.mock`                        | Fake WebExtensions API; `getBrowserApiMock()` configures or asserts |
| `logger.mock`                             | `createLoggerMock()` / `createLoggingServiceMock()`                 |
| `data-storage.fake` / `storage-area.fake` | In-memory `DataStorage`, and the areas backing the real ones        |
| `data-service.fake`                       | `FakeDataService`, one `FakeDataStorage` per storage area           |
| `fetch.mock`                              | `installFetchMock()`, response builders, request inspection         |
| `intl.mock`                               | `IntlService` that echoes the message key                           |
| `messaging.fake`                          | Records `runtime.onMessage` listeners and can `dispatch()` to them  |
| `template-context-manager.factory`        | Builds a **real** `TemplateContextManager` over fakes               |
| `tab.fake` / `migration.fake`             | `createTab()`/`createTabContext()`, and `createMigrationContext()`  |
| `ui` / `setup-ui`                         | `renderUi()`, plus jest-dom matchers and RTL `cleanup()`            |

The browser API fake implements only what current tests need; extend it rather than reaching for a heavier library.

### Component tests

Render with `renderUi()` (`extension/test/ui`) rather than RTL's bare `render` — it installs the same provider tree
the real entry points do, and every context takes an optional partial stub:

```tsx
renderUi(<LoggingSettings onChange={onChange} settings={{ enabled: false }} />, {
  contexts: { settingsService: { ... } },
});
```

The default `intl` echoes the message key, so assertions don't depend on `_locales` copy.

## What is covered

Broadly: everything under the seven `node` trees and the two `dom` trees, including all template context entries, both
production `DataStorage` implementations, all three URL shorteners, the tab/content/worker messaging paths, the
context menu, the DI containers and the React UI. Deliberately untested: entry points (`index.ts`) and token/interface
modules.

A few suites are worth knowing about before writing a new one, because they already cover whole families:

- **`template/context/entry/contract.test.ts`** enumerates the entry registry at runtime and applies a per-category
  contract to every entry — including the guarantee that no entry renders its renderer's JavaScript source. Put value
  assertions in the family suites (`url`, `tab-metadata`, `string-operation`, ...) instead of adding per-entry files.
- **`template/tmplat-mustache.test.ts`** characterizes the template engine. Stock Mustache syntax fails silently, so
  verify any snippet you plan to document against this file.
- **`common/data/data-storage.test.ts`** is a contract suite run against both production implementations and the fake,
  which is what keeps the fake honest.
- **`*.config.test.ts`** (one per DI config module) resolves each container's root token, so a missing or wrongly
  bound dependency anywhere in the graph fails.
- **`ui/common/components/guide/guide.test.tsx`** renders the whole generated guide and so transitively exercises a
  large share of entry branches.

### Coverage

`pnpm test:unit:coverage` writes HTML and text reports to `dist/coverage`; thresholds are only checked when coverage is
collected, which is why CI runs that script. The floors in `vitest.config.mts` (statements 94%, branches 92%,
functions 90%, lines 94%) are a **non-regression floor, not a target** — each sits just under the real figure.

Two caveats when reading the numbers: `.scss` files are inside the include globs and always report 0%, and entry
points and token modules are counted rather than excluded, so a few directories cannot reach 100%.

## End-to-end tests

Unit tests cannot prove the packaged extension works: manifest correctness, service worker registration, content
script injection, permissions and the system clipboard only exist at runtime. Specs live in `e2e/`.

- `e2e/global-setup.ts` runs `pnpm build:dev` first, so specs always run against a current build.
- `e2e/fixtures.ts` loads `dist/temp` into a **persistent** context (the only kind that can load an extension) and
  exposes fixtures: `context`, `serviceWorker`, `extensionId`, `openExtensionPage` and `fixturePage`, plus
  `readClipboard(page)`.
- A static server hosts `e2e/fixture-pages/` on `http://localhost:4321` as a real, injectable page.
- The suite runs single-worker and `fullyParallel: false` — it shares one browser profile and one system clipboard.
- The `chromium` and `msedge` projects load the **same** build. Edge is a channel, not a build target; the only place
  the browsers genuinely differ is brand detection in `system.utils.ts`, which unit tests cover.

| Spec                | Covers                                                                                |
| ------------------- | ------------------------------------------------------------------------------------- |
| `extension.spec.ts` | Extension loads, worker registers, version reaches the manifest, data is seeded       |
| `options.spec.ts`   | Predefined templates render; creating one survives a reload; validation blocks saving |
| `copy.spec.ts`      | Full copy pipeline: keystroke → content script → worker → render → clipboard          |
| `popup.spec.ts`     | Popup lists only popup-enabled templates with shortcuts, and opens the options page   |
| `migrate.spec.ts`   | 1.x upgrade path: legacy data, preview, migration, key removal, retryable failure     |

`copy.spec.ts` is the highest-value spec here — the only one exercising `content/` and `worker/` together over real
cross-context messaging. `migrate.spec.ts` is the only one that reads legacy data from where 1.x actually wrote it
(plain `localStorage` on the extension's own origin), which is why it opens `options.html` before navigating to
`migrate.html?version=1.2.5`.

### Gotchas

- **Use the full browser, not the headless shell** — the shell cannot load extensions, hence `channel: 'chromium'`.
- **Default data is seeded asynchronously** after the worker registers, so fixtures wait via `waitForSeededData` and
  assertions poll with `expect.poll`. Skipping the wait made the options and popup specs fail about one run in three.
- **A closed dialog does not mean the data is persisted.** Poll storage for the value before reloading, or the reload
  races the write.
- **The extension ID is assigned at load time**, so discover it from the service worker URL.
- **Template execution cannot be driven from the popup.** Playwright cannot click the action button, and a popup
  opened as a tab makes `sender.tab` the popup itself, so the run is rejected as a restricted tab. Drive copy flows
  through the keyboard shortcut on a real page instead.
- Opening a page steals tab focus, so popup specs `bringToFront()` the fixture page and reload the popup.
