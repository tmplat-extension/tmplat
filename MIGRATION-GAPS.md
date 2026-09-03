# Migration Gaps: the v2 release checklist

The definitive list of work items that must be resolved — or consciously accepted — before `tmplat` 2.0.0 can
ship. It began as a snapshot of the functional differences between the legacy `src/lib/*.coffee` implementation
and the new TypeScript implementation under `src/lib/**`, and is now the go/no-go list for the release.

**How to use this document**

- §1 is the release-blocking set. Nothing in §1 may be open when 2.0.0 ships.
- §2–§5 are open work items that are **not** release-blocking but are tracked so they are not lost.
- §6 is a reference inventory of the legacy options page, kept so no user-facing preference disappears silently.
- §7 is the go/no-go summary.
- §8 is the migration log: resolved items are **moved** there rather than deleted.

Every claim below is backed by a `file:line` reference that was re-verified on the date in the section header.
Line references drift quickly — treat a mismatch as a signal to re-verify the claim, not just the number.

_Last fully verified: 2026-09-14 (every claim in §1–§6 re-checked against the working tree)._

---

## 1. Release blockers

Open items that make 2.0.0 unshippable. Each one is either user-visible data loss, a feature the UI advertises
but does not deliver, or a migration path that cannot complete.

### 1.1 `migrate.html` renders nothing and discards every migration result

`MigrateUi.init()` (`src/lib/ui/migrate/migrate-ui.tsx:50-72`) runs the entire migration on page load and then
renders an **empty** error boundary — the body is literally `{/* TODO: Render App */}` (`:71`).

```ts
const { results: _results, version } = await this.dataMigrationManager.migrate();
const _phase = await this.dataMigrationService.getMigrationPhase(version);
```

Both results are bound to discard names and never used. Consequences:

- The user upgrading from 1.x sees a **blank tab**, with no indication that anything is happening, happened, or
  failed.
- The entire step-outcome model (`DataMigrationStepOutcome.Passed | Failed | Skipped`, the `reasons` tuple, the
  structured `ExtensionError` payloads) is computed and thrown away. A namespace reports
  `DataMigrationOutcome.Completed` when it merely _ran_, so a migration in which every step failed is
  indistinguishable from a clean one — from the UI, from the user, and from any support request.
- There is no retry affordance, even though the migration is deliberately designed to be retryable (a schema
  failure keeps the legacy key rather than deleting it).
- Migration runs on the page's main thread before first paint. The file's own TODOs call for moving it to the
  background worker with progress over message passing, and for honouring the `version` query parameter and
  offering a legacy-data export before starting.

This single gap nullifies the whole of the migration error-reporting work. **Fix before anything else in §2.**

### 1.2 Context-menu auto-paste is configurable but has no runtime effect

The setting round-trips fully — it is stored (`TemplateContextMenu.autoPasteEnabled`,
`src/lib/template/data/template-data.schema.ts:27`), migrated, surfaced on `TemplateContextMenuInfo`, exposed to
templates, and **presented as a working toggle in the settings dialog** (`general-settings.tsx`). But
`ContextMenuService.onClicked()` (`src/lib/context-menu/context-menu.service.ts:80-110`) only calls
`templateEngine.execute()` (`:104`); it never asks the tab to paste.

There is no `MessageType.Paste` (`src/lib/common/message/message-type.enum.ts` has only `ConvertMarkdown`,
`Copy`, `ExecuteTemplate`, `Geolocation`, `TabContent`, `TabContext`) and no content-side paste listener, so the
background has no way to request it. Only the keyboard-shortcut path implements auto-paste
(`src/lib/tab/event/shortcut-event-listener.ts:60-61,71-72,112`).

Shipping a toggle that silently does nothing is worse than not shipping it. Either implement the paste message
or hide the control.

### 1.3 Bare `{dateTime}`, `{lastModified}` and `{shorten}` render JavaScript source

All three worked without a section body in 1.x, all three still declare a `Standard` category, and the guide
therefore still advertises the bare form. They now render the renderer's **JavaScript source** into the user's
clipboard.

- Legacy's engine (mustache.js 0.7.2, `8f3c5e3:src/vendor/mustache.js:294-297`) _invoked_ a nested function
  found by a name tag; `tmplat-mustache` 2.5.0 stringifies it (`decoratedValue`, `:574-597`).
- Legacy's `rendered` helper (`8f3c5e3:src/lib/background.coffee:651-655`) handled the zero-argument call via
  `if arguments.length ... else do callback`; the factories in
  `src/lib/template/context/template-context.utils.ts:114-115,203-204` have no equivalent guard.
- The mappers already contain the `content ? ... : <default>` fallbacks intended for bare use
  (`entry/date-time.ts`, `entry/last-modified.ts`, `entry/shorten.ts`) — they are simply unreachable.
- The same leak affects **all 43 `Operation` entries** when referenced bare, not just these three.
- Predefined templates are unaffected (1.x shipped `{#shorten}{url}{/shorten}`); user templates carried over
  from 1.x are not.

Full analysis and the verified two-part fix are in
[TEMPLATE-OPERATION-LEAK.md](TEMPLATE-OPERATION-LEAK.md). **Blocked on a `tmplat-mustache` release** — do not
work around it in individual entry files. Status there: _open, not started_.

### 1.4 Analytics posts to a decommissioned endpoint

`AnalyticsService` posts to `https://www.google-analytics.com/collect` (`src/lib/analytics/analytics.service.ts:66`)
with a Universal Analytics property (`ACCOUNT_ID = 'UA-28812528-1'`, `:17`). Google shut UA down; every request
now fails. The options page presents a working analytics opt-in, so this is another control that does nothing.

It is also **unwired for the background**: `AnalyticsServiceToken` is not bound in
`src/lib/worker/background/background-worker.config.ts`, and the service is injected only by the three UI entry
points (`options-ui.tsx:30`, `popup-ui.tsx:27`, `migrate-ui.tsx:30`). Legacy tracked `Templates/Used`,
`Shorteners/Used` and `Requests/Processed` from the background. Existing TODOs:
`src/lib/url-shortener/url-shortener.service.ts:62`, `src/lib/oauth/oauth.service.ts:13`.

Decide before release: migrate to GA4 Measurement Protocol and wire it into the worker, or remove analytics and
its opt-in entirely. Either is acceptable; leaving a dead toggle is not.

### 1.5 Only users on exactly 1.2.9 are migrated

`DataMigrationService` gates on `migrationVersions = new Set(['1.2.9'])`
(`src/lib/common/data/migration/data-migration.service.ts:23`). Anyone updating directly from an earlier 1.x
release — which Chrome does routinely for users whose browser sat idle — gets **no migration at all**, silently.

Note the migrators themselves already tolerate older shapes (the logging migrator handles the pre-1.2.3
`{Enabled, Level}` casing, and `z.object` strips unknown keys), so widening the gate is likely cheap. Confirm
which 1.x releases can reach 2.0.0 directly and admit all of them.

---

## 2. Data and migration

_Not release-blocking on their own, but §2.1 is a permanent data loss and should be strongly considered._

### 2.1 Template ordering is lost during migration

Legacy templates carry an `index`; the migrator does not use it. Explicit marker:
`// TODO: Sort templates based on legacyTemplates ordering`
(`src/lib/template/data/template-data-migrator.ts:220`). Order in 2.0 is simply the order of
`TemplateData.templates`, which `TemplateService.moveTemplate()` rewrites. A 1.x user with a carefully ordered
list gets an arbitrary one, and the legacy key is deleted afterwards, so it is **unrecoverable**.

### 2.2 `image`, `usage` and `menuId` are dropped with no replacement

None exist in `src/lib/template/data/template-data.schema.ts`. Consequences:

- `image` (the per-template icon) has nowhere to live — the last legacy template capability with no home in the
  new model. Decide explicitly: reinstate, or document as removed in the changelog.
- `usage` is why per-template statistics and the `popular` context entry cannot be restored as-is (`popular`
  now exists as a hard-coded empty object, see §8).
- `menuId` was an implementation detail of the legacy context menu and is genuinely obsolete.

### 2.3 A skipped predefined template logs a misleading "Migrated" line

In the predefined branch of `template-data-migrator.ts`, the
`debug('Migrated legacy predefined template', { legacy: ... })` call sits **outside** the `else`, so the skip
path emits a warning immediately followed by a "Migrated" debug line whose payload is `undefined`. Cosmetic, but
actively misleading when reading a user's log.

### 2.4 Legacy import/export format differences (accept and document)

The transfer format (`src/lib/template/template-transfer.schema.ts`) is a **new**, base64-wrapped shape:
`TemplateService.exportTemplates()` (`template.service.ts:359`) serialises a `TemplateTransfer` and
base64-encodes it; `parseTemplates()` (`:399`) reverses that and validates before anything is written. Because
template content is arbitrary Unicode, `encodeBase64Utf8()`/`decodeBase64Utf8()`
(`src/lib/common/codec/base64.utils.ts:11,28`) are used rather than the Latin-1-only
`encodeBase64`/`decodeBase64` (`:1,3`), which now serve only the `encode-base64`/`decode-base64` context
entries.

Once §1.2 is fixed, legacy v1.2.x exports will be _tolerated_ rather than _supported_: `title`, `content`,
`shortcut` and `enabled` survive; `key`, `image`, `index`, `usage` and `readOnly` are silently stripped by
`z.object`; and every entry — predefined or not — becomes a **new user-defined** template, because the transfer
format carries no `id` or `predefined` flag. Nothing is ever overwritten. Worth a changelog entry.

### 2.5 Convention: legacy schemas must model what 1.x actually persisted

Recorded so it cannot be reintroduced. Four separate defects have come from applying a _modern_ constraint to a
_legacy_ schema; all four were silent, permanent migration failures, because the step validates before mutating
and so re-reads identical data on every retry.

| Instance                        | 1.x reality                                             | Wrong constraint              |
| ------------------------------- | ------------------------------------------------------- | ----------------------------- |
| `yourls.{authentication,url,…}` | `''` for every unset field, and for "None" auth         | `nonempty()` / `httpUrl()`    |
| `logger.level`                  | the **string** `'20'` (jQuery `.val()` on a `<select>`) | `z.enum(LogLevel)` (numeric)  |
| legacy template `content`       | `''` (1.x only ever required a _title_)                 | `nonempty()`                  |
| transfer `shortcut`             | `''`, and lower-case / multi-character values           | `min(1)`, then `/^[A-Z0-9]$/` |

Two further traps found alongside them:

- **`z.httpUrl()` is not "a URL with an http(s) protocol."** It is `z.url()` plus a hostname regex requiring a
  dot-separated domain, so it rejects `localhost`, LAN IPs and single-label intranet hosts. That is fatal for
  self-hosted software such as YOURLS. Use `z.url({ protocol: /^https?$/ })`.
- **Two paths that read the same legacy data must agree on it.** Import and migration both consume 1.x
  templates, but one rejected a value the other silently degraded, so the outcome depended on how the data
  arrived. Share a single normalizer (`normalizeTemplateShortcut()`) rather than duplicating the constraint, and
  prefer _normalize, then degrade_ over _reject_ for legacy input — a whole-document rejection for one bad entry
  is almost never the right failure mode.
- **The UI and the persistence layer can validate differently.** The options page validates the YOURLS URL with
  `isHttpUrl` (`src/lib/common/url.utils.ts:59-69`, a WHATWG `new URL()` parse), not with the schema, so the two
  silently disagreed until they were aligned. A three-way consistency test now guards this in
  `url-shortener-data-migrator.test.ts`; add one whenever a schema constraint has a UI counterpart.

**Rule: when writing or changing a `legacy-*.schema.ts`, read the legacy writer in `background.coffee` /
`options.coffee` first and model what it wrote, coercing sentinels rather than rejecting them.**

---

## 3. Background, worker and content script

### 3.1 Correctness defects

- **`sender.tab` outranks an explicit `tabId`.**
  `src/lib/template/message/execute-template-message-listener.ts:36-38` only consults `input.tabId` when the
  sender is _not_ a tab:

  ```ts
  if (!(tab || isUndefined(input.tabId))) {
    tab = await this.tabService.getTab(input.tabId);
  }
  ```

  Chrome populates `sender.tab` for **any** extension page loaded in a tab, so any such page sending
  `execute_template` with an explicit `tabId` silently targets itself. Latent today (the real popup is a
  browser-action popup with no `sender.tab`), but it already blocks driving copy flows from `popup.html` in e2e
  and is a trap for any future full-page UI. An explicit `tabId` should take precedence.

- **`isInjectableUrl` wrongly reports the extension stores as injectable.** The `pathname`-scoped entries in
  `restrictedInjectionUrls` (`src/lib/common/url.utils.ts`) have no leading slash, but `URL.pathname` always
  does, so `'/webstore/detail/x'.startsWith('webstore')` is `false`. `chrome.google.com/webstore` and
  `microsoftedge.microsoft.com/addons` therefore pass the check. One-line fix: give the entries leading slashes.
  Current behaviour is pinned by a commented test in `url.utils.test.ts`.

- **Shortcut cache race.** `ShortcutEventListener.listen()` registers the `keydown` handler
  (`src/lib/tab/event/shortcut-event-listener.ts:35`) before populating `this.cache` asynchronously (`:37-45`),
  so shortcuts pressed immediately after injection are ignored, silently. Related: on a cold profile a page
  loading before default-data seeding completes logs `ExtensionError(DAT404000)`; it recovers, but it is a real
  install-time race.

- **Action click failures are invisible to the user.** If the configured default template is missing or
  disabled, `ActionService.onClicked()` throws (`src/lib/common/action/action.service.ts:57`) and the rejection
  is only logged (`:31-32`). Legacy raised a desktop notification. Note `createTemplateActionInfo()` maps a
  _disabled_ template to `undefined` (`src/lib/template/template.service.ts:116`), so a disabled template
  produces the misleading `Template could not be found` message.

- **Action state may not survive a browser restart.** `ActionService.update()` (which calls
  `chrome.action.setPopup`) is invoked only from `ExtensionManager.install()`/`update()`/`reload()`
  (`src/lib/common/extension-manager.ts:65,94,148`), i.e. on `chrome.runtime.onInstalled`. There is **no**
  `chrome.runtime.onStartup` listener anywhere in `src/lib`. Because `setPopup` is session state rather than
  manifest state, `default_popup: "popup.html"` (`src/manifest.json:21`) is likely restored on restart, silently
  reverting users from `TemplateActionMode.Template` to the popup. Confirm against a real profile; if
  reproduced, call `actionService.update()` from `ExtensionManager.run()` and/or an `onStartup` handler.

- **`event.keyCode` is deprecated and layout-dependent.**
  `String.fromCharCode(event.keyCode).toUpperCase()` (`shortcut-event-listener.ts:96`). Legacy had the same
  flaw; `event.key`/`event.code` should be used.

- **Relative URLs are not resolved to absolute** when extracting links/images from a selection. Legacy forced
  resolution via `href.href = href.href`. Marker: `// TODO: Confirm URLs are absolute (especially when
extracted from selection)` (`src/lib/tab/message/tab-context-message-listener.ts:127`).

### 3.2 Capability gaps

- **No `commands` section** in `src/manifest.json`. Shortcuts remain page-level `keydown` handlers in the
  content script, so they still do not work on `chrome://` pages, the Web Store, PDFs, or when no tab has focus,
  and cannot be remapped via `chrome://extensions/shortcuts`. Legacy had the same limitation, so this is an
  improvement opportunity rather than a regression — but MV3 makes `chrome.commands` the obvious answer.
- **No progress / "please wait" state.** Legacy `updateProgress()` drove the popup's progress bar.
- **No per-template usage statistics** (see §2.2).
- **Context menu contexts are unrestricted**: `contexts: [...ContextType.ALL]`
  (`src/lib/context-menu/context-menu.service.ts:120`, with a `// TODO: Should this be a limited set?` at
  `:119`). Legacy was more selective.
- **Legacy extension-compatibility shims are gone** (the IE Tab / Gecko Tab `SUPPORT` map in
  `background.coffee`). Almost certainly intentional, but it is an unlisted behaviour drop.

---

## 4. URL shortener and OAuth

- **Hardcoded Bitly credentials.** `client_id` **and `client_secret`** are embedded in
  `src/lib/oauth/provider/bitly-oauth.provider.ts:31-32`. Pre-existing in legacy too, but a published client
  secret in a distributed extension is worth revisiting before a major release.
- **No token refresh or expiry handling** in `src/lib/oauth/provider/oauth.provider.ts` (TODOs at `:108`,
  `:115`, `:129`, `:135`). The practical consequence is now mitigated:
  `BitlyUrlShortenerProvider` catches HTTP 401, calls `oauthService.revokeAuthentication()` and throws
  `SHO401000` (`src/lib/url-shortener/provider/bitly-url-shortener.provider.ts:53-60`), forcing a reconnect
  rather than looping on failure. Remaining gap: nothing refreshes proactively.
- **Errors are not localised.** Seven `TODO: Localise error message…` markers remain, confined to
  `src/lib/oauth/provider/oauth.provider.ts` (`:108,115,129,135`), `src/lib/oauth/oauth.service.ts` and
  `src/lib/template/message/execute-template-message-listener.ts`. Legacy raised localised `AppError`s that
  surfaced in notifications. Note the broader UI is also still hard-coded English with `TODO: i18n` markers —
  the guide entry descriptions are the exception, resolving through `IntlService`.
- **YOURLS parity is good.** Both `Advanced` (signature) and `Basic` (username/password) modes are preserved
  (`yourls-authentication-mode.enum.ts`; `yourls-url-shortener.provider.ts:28-31` validates, `:79-90` applies).

---

## 5. Accepted behavioural changes from 1.x

Not defects — deliberate changes that will be visible to existing users. They need a changelog entry, not a fix.

- **`capitalize` changed meaning.** Legacy `utils.capitalize` title-cased **every** word; the new entry uses
  es-toolkit's `capitalize` (first letter only). `startCase` is the closer equivalent. `capitalise` is a
  deprecated alias of `capitalize`, so it changes behaviour rather than preserving it.
- **Date format tokens changed.** `dateTime` / `lastModified` moved from date-ext tokens to Luxon `toFormat`
  tokens (`src/lib/template/context/entry/date-time.ts`). Format strings in existing templates will not carry
  over.
- **URL parsing moved from purl.js (`$.url`) to native `URL`/`URLSearchParams`**
  (`src/lib/template/context/template-context-manager.ts:95-105`), with different edge-case behaviour.
- **`encode`/`decode` are now aliases** of `encodeUriComponent`/`decodeUriComponent`; base64 variants are new.
- **Clipboard copy no longer depends on an injected content script.** The worker copies via `ClipboardService`
  (`src/lib/common/clipboard/clipboard.service.ts:27-30`), which delegates to
  `OffscreenService.sendMessageAwaitResponse(MessageType.Copy, …)`; the offscreen document's lifecycle is owned
  by `OffscreenService`. Copying therefore works on tabs where injection failed — an improvement over 1.x.

---

## 6. Legacy options page inventory (reference)

Exception to the "no UI" rule: the authoritative checklist of everything configurable on the legacy options page
(`src/options.legacy.html`, wired up by `src/lib/options.coffee`), mapped to its new storage model and UI status.

**Every legacy settings category is implemented.** The settings dialog
(`src/lib/ui/options/component/settings-dialog/settings-dialog.tsx`) renders a page per navigation entry, loads
on open, tracks dirty state and offers `Reset`/`Apply`/`Save`. It is backed by `SettingsService`
(`src/lib/common/settings/settings.service.ts`), which aggregates the five namespaces that own settings
(analytics, logging, notification, template, URL shortener), normalises string fields via `normalize()`
(`:150`, a `value?.trim() || null`), and is exposed to React through `SettingsContext`. The options page has **no
outstanding legacy capability gaps**; what remains are the data-model gaps in §2 (notably `image` and migration
ordering) and the dead controls in §1.2/§1.4.

### 6.1 General

| Legacy control (id)                                   | Legacy key              | New storage (`src/lib/template/data/template-data.schema.ts` unless stated) | New UI                                                    |
| ----------------------------------------------------- | ----------------------- | --------------------------------------------------------------------------- | --------------------------------------------------------- |
| Desktop notifications (`#notifications`)              | `notifications.enabled` | `src/lib/common/notification/data/notification-data.schema.ts`              | `notification-settings/notification-settings.tsx`         |
| Toolbar behaviour popup vs template (`#toolbarPopup`) | `toolbar.popup`         | `TemplateAction.mode` `:17` (`TemplateActionMode`)                          | `general-settings/general-settings.tsx`                   |
| Default toolbar template (`#toolbarKey`)              | `toolbar.key`           | `TemplateAction.templateId` `:19`                                           | `general-settings/general-settings.tsx`                   |
| Close popup after use (`#toolbarClose`)               | `toolbar.close`         | `TemplateActionPopup.autoCloseEnabled` `:8`                                 | `general-settings/general-settings.tsx`                   |
| Options link in popup (`#toolbarOptions`)             | `toolbar.options`       | `TemplateActionPopup.optionLinkEnabled` `:9`                                | `general-settings/general-settings.tsx`                   |
| Context menu enabled (`#menuEnabled`)                 | `menu.enabled`          | `TemplateContextMenu` `:25-32` (`TemplateContextMenuMode`)                  | `general-settings/general-settings.tsx`                   |
| Options item in context menu (`#menuOptions`)         | `menu.options`          | `TemplateContextMenu.optionLinkEnabled` `:30`                               | `general-settings/general-settings.tsx`                   |
| Context-menu auto-paste (`#menuPaste`)                | `menu.paste`            | `TemplateContextMenu.autoPasteEnabled` `:27`                                | **no runtime effect — see §1.2**                          |
| Shortcuts enabled (`#shortcutsEnabled`)               | `shortcuts.enabled`     | `TemplateShortcut` `:53-58`                                                 | `general-settings/general-settings.tsx`                   |
| Shortcut auto-paste (`#shortcutsPaste`)               | `shortcuts.paste`       | `TemplateShortcut.autoPasteEnabled` `:55`                                   | `general-settings/general-settings.tsx`                   |
| Link `title` attribute (`#linksTitle`)                | `links.title`           | `TemplateLink.title` `:39`                                                  | `general-settings/general-settings.tsx`                   |
| Link `target` attribute (`#linksTarget`)              | `links.target`          | `TemplateLink.target` `:38`                                                 | `general-settings/general-settings.tsx`                   |
| Inline Markdown links (`#markdownInline`)             | `markdown.inline`       | `TemplateMarkdown.inline` `:47`                                             | `general-settings/general-settings.tsx`                   |
| Analytics opt-in (`#analytics`)                       | `analytics`             | `src/lib/analytics/data/analytics-data.schema.ts` + migrator                | `analytics-settings/analytics-settings.tsx`; **see §1.4** |

All component paths are relative to `src/lib/ui/options/component/`. Two settings with no legacy equivalent are
also surfaced: the context menu mode (`TemplateContextMenuMode.Menu` vs `Template`) and the change log scope
(§6.5).

### 6.2 Templates

Implemented by `src/lib/ui/options/component/template-data-grid/template-data-grid.tsx`, which owns a toolbar
(`Add` `:331` / `Import` `:334` / `Export` `:400`, plus `Enable`/`Disable`/`Delete` for the current selection,
gated by `canDeleteSelection`/`canEnableSelection`/`canDisableSelection` `:205-207`) and delegates to
`TemplateEditorDialog`, `TemplateImportDialog`, `TemplateExportDialog` and the shared `ConfirmDialog`.

| Legacy capability                                                                    | Status in new grid                                                                                                                                      |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| List templates, toggle enabled, edit, delete                                         | implemented; row action toggles via `setTemplatesEnabled()`, delete really deletes (behind a confirmation)                                              |
| Add template (`#add_btn`) / template wizard                                          | implemented — `template-editor-dialog.tsx`, also opened by double-clicking a row                                                                        |
| Wizard fields: title (max 32), icon/image, shortcut key + modifier, enabled, content | title/description/shortcut/enabled/content implemented, with a shortcut column; `image` is dropped from the model (§2.2)                                |
| Predefined templates read-only (title/content disabled, delete blocked)              | implemented — see §6.2.1                                                                                                                                |
| Filter select + search (`#template_filter`, `#template_query`)                       | search implemented — the app bar input is lifted into `App` and filters on title, description, content and shortcut                                     |
| Drag-to-reorder (`index`)                                                            | replaced by `Move up`/`Move down` row actions `:229-230` backed by `TemplateService.moveTemplate()`; **ordering is still lost during migration (§2.1)** |
| Bulk enable / disable / delete                                                       | implemented, including inversion of the grid's "select all" (exclude) selection model                                                                   |
| Import wizard (paste JSON or file, select subset)                                    | implemented — `template-import-dialog.tsx`; parse-then-select, base64 in. **Legacy files fail — §1.2**                                                  |
| Export wizard (copy to clipboard or save `templates.json`)                           | implemented — `template-export-dialog.tsx`; base64 out, copy or download                                                                                |
| Pagination                                                                           | present (DataGrid, `pageSizeOptions={[10, 20, 50]}` `:349`)                                                                                             |

Behavioural notes: see §2.4 for the transfer format. Shortcuts are kept unique — `createTemplates()` discards
any shortcut already in use, and the editor validates against the rest of the collection before saving.

#### 6.2.1 Template field mutability (legacy behaviour to reproduce)

The legacy wizard (`#template_wizard`, driven by `openWizard()`/`resetWizard()`/`deriveTemplate()` in
`src/lib/options.coffee`) exposed exactly five inputs — `#template_title`, `#template_content`,
`#template_shortcut`, `#template_image`, `#template_enabled`. Everything else on the legacy template object
(`key`, `index`, `usage`, `readOnly`, `menuId`) was assigned by the code and never user-editable.

| Field       | Create (user)         | Edit (user) | Edit (predefined)                                         |
| ----------- | --------------------- | ----------- | --------------------------------------------------------- |
| `title`     | editable (max 32)     | editable    | **immutable** — input `disabled`, original value retained |
| `content`   | editable              | editable    | **immutable** — input `disabled`, original value retained |
| `shortcut`  | editable (1 char)     | editable    | editable                                                  |
| `image`     | editable              | editable    | editable                                                  |
| `enabled`   | editable (default on) | editable    | editable                                                  |
| `key`       | auto (`keyGen()`)     | locked      | locked                                                    |
| `index`     | auto (`length`)       | locked      | locked                                                    |
| `usage`     | auto (`0`)            | preserved   | preserved                                                 |
| `readOnly`  | auto (`false`)        | locked      | locked                                                    |
| _deletable_ | n/a                   | yes         | **no**                                                    |

Legacy enforced this in `resetWizard()` via
`$('#template_content, #template_title').prop 'disabled', !!activeTemplate.readOnly`, and outside the wizard in
`deleteTemplates()`, `refreshSelectButtons()` and `updateImportedTemplate()`. Net effect: a predefined template
could be re-keyed, re-iconed or disabled, but never renamed, rewritten or removed.

The new model enforces it **structurally and more strongly**. A stored `TemplatePredefined`
(`template-data.schema.ts:94-96`) holds only a `readonly id` (`TemplateBaseDefinition:69-75`, `id` at `:72`) and
a `readonly predefined` literal — it does not carry `content`, `titleKey` or `descriptionKey` at all. Those are
resolved from the predefined-template dictionary at read time
(`TemplateService.getPredefinedTemplate()`, `template.service.ts:474-488`), so they are not merely immutable but
not stored. `TemplateEditorDialog` disables title, description and content for a predefined template (explaining
why via an inline `Alert`) and only ever sends `{ enabled, shortcut }` to `updateTemplate()`;
`TemplateService.removeTemplates()` refuses to remove one (`template.service.ts:248-250`), the row delete action
is disabled, and the toolbar delete button is disabled with a tooltip when the selection contains one.

Differences to watch:

- Predefined titles/descriptions are `IntlMessageKey`s rather than strings, so the editor renders them via
  `getTemplateTitle()`/`getTemplateDescription()` and offers no text field.
- `description` is **new** for user-defined templates (nullable), with no legacy counterpart; it has its own
  field in the editor and its own grid column.
- `image` no longer exists (§2.2), so there is no icon picker. `usage` no longer exists, so there is no
  usage-based sorting.
- `index` no longer exists; order is the order of `TemplateData.templates`, rewritten by `moveTemplate()`.
  Migration still does not preserve the legacy `index` (§2.1).

### 6.3 URL Shorteners

Implemented by `src/lib/ui/options/component/url-shortener-settings/url-shortener-settings.tsx`:

- Active shortener radio (Bitly / YOURLS) — selecting one disables the other, since
  `UrlShortenerService.shorten()` picks the first enabled provider. goo.gl intentionally dropped (§6.6).
- Bitly account connect/disconnect, driven by `OAuthService` via `OAuthContext`
  (`src/lib/oauth/oauth.context.ts`); the connected `principal` is displayed. Unlike legacy, nothing is
  persisted mid-flow: `OAuthService.requestAuthentication()` runs the authorisation flow **without** storing
  anything, the token is held in the dialog's settings state, and disconnecting clears it — both are written
  only on `Apply`/`Save`, like every other field.
- YOURLS URL, authentication mode (None/Basic/Advanced), signature, username and password, with inline
  validation (`getUrlShortenerSettingsErrors()`, `url-shortener-settings.tsx:21`) mirroring
  `YourlsUrlShortenerProvider.isDataValid()` and the **zod** schemas. `Save` is blocked while invalid, so schema
  violations cannot reach storage. (Legacy used Joi; the new codebase does not — the only `Joi` reference left
  is legacy `src/lib/utils.coffee`.) See §2.5 for the UI/schema consistency guard that keeps these aligned.

### 6.4 Guide

The legacy page shipped five documentation panes (Introduction, Standard, Lists & Objects, Options, Operations)
as hand-maintained HTML tables. Implemented by
`src/lib/ui/options/component/guide-dialog/guide-dialog.tsx`, which reuses the settings dialog layout. Unlike
legacy, the content is **generated from `templateContextEntriesDefinitions`** rather than declared statically,
so it cannot drift from the entries actually registered with `TemplateContextManager`:

- `src/lib/ui/common/components/guide/guide.utils.ts` projects each definition into a `GuideEntry` per category
  it belongs to; an entry in several categories is listed on each relevant page.
- Alias definitions (those with `aliasOf`) are listed against the entry they alias rather than as rows,
  mirroring the legacy guide (e.g. "fragment/anchor").
- `deprecated` renders a chip; `links` renders the category's external references.
- Types are rendered from category metadata: `String` for Standard, `Array<String>` / `Object<String>` for
  Collection, and `(String) → String` signatures for Operation.
- Descriptions come from `descriptionKey` via `IntlService`, so this page is already localised.

Only the Introduction pane is static (`guide-introduction.tsx`); per-category examples are hard-coded
(`guide-examples.ts`) since they illustrate shared syntax.

Both document the **`tmplat-mustache` fork's syntax, not stock mustache.js**: tags use single curly braces
(`{name}`, `{#name}...{/name}`, `{^name}`, `{.}`, `{!...}`), values are **unescaped by default**, and it is
`{{name}}`/`{&name}` that HTML-escapes — the inverse of standard Mustache. Lookups are case-insensitive, and a
list or object referenced without a section renders comma-separated. This matters because stock syntax fails
_silently_. Every documented example output has been verified against the engine.

The Options pane is generated from `template-context-options-documentation.ts`, a recursive `properties` tree
that the guide flattens into dot-notation paths (`options.templates.links.target`) — **22 options across 15
groups** (recounted 2026-09-14; the previously documented "12 groups" had drifted). The descriptor's type is
derived from `TemplateContextOptions` itself, so an option added to `buildOptions()` but left undocumented — or
documented with the wrong type, or documented but non-existent — fails `type:check`. Enum-backed options list
their permitted values.

Two caveats:

- The guide still advertises the bare form of `dateTime`, `lastModified` and `shorten`, which is broken — §1.3.
- Object collections other than `options` have no per-property documentation, though `properties` is generic so
  they can adopt it whenever descriptions are written.

### 6.5 Logging (legacy "Tools" modal)

| Legacy control   | Legacy key       | New storage                                              | New UI                                      |
| ---------------- | ---------------- | -------------------------------------------------------- | ------------------------------------------- |
| `#loggerEnabled` | `logger.enabled` | `src/lib/common/logging/data/logging-data.schema.ts:5-8` | `developer-settings/developer-settings.tsx` |
| `#loggerLevel`   | `logger.level`   | same; remapped by `logging-data-migrator.ts` (~`:46`)    | `developer-settings/developer-settings.tsx` |

The legacy "Tools" modal is now a "Logging" entry in the settings dialog navigation. The notification page also
exposes the new change log settings (`NotificationDataChangeLog.enabled`/`scope`), which have no legacy
equivalent.

### 6.6 Not carried over by design

- PayPal donation form in the footer.
- goo.gl shortener — the service is dead. Deprecated `googl` / `googlAccount` / `googlOAuth` context entries
  remain as stubs (`src/lib/template/context/entry/deprecated/googl*.ts`) and the migrators discard the old
  data.

---

## 7. Release checklist

### Must be closed before 2.0.0

| #    | Item                                                 | Type                | Effort                       |
| ---- | ---------------------------------------------------- | ------------------- | ---------------------------- |
| §1.1 | `migrate.html` renders nothing; results discarded    | data loss invisible | large                        |
| §1.2 | Context-menu auto-paste toggle has no runtime effect | dead control        | medium                       |
| §1.3 | Bare Operation entries leak JS source                | user-visible bug    | blocked on `tmplat-mustache` |
| §1.4 | Analytics posts to a decommissioned endpoint         | dead control        | medium                       |
| §1.5 | Only 1.2.9 is migrated                               | silent no-op        | small                        |
| §2.1 | Template ordering lost during migration              | unrecoverable loss  | small                        |

§2.1 is listed here as a **strong recommendation** rather than a hard blocker: the data is destroyed once the
migration completes, so unlike the rest of §2 it cannot be fixed in a patch release.

### Decide explicitly (do not let these ship by accident)

- §2.2 — reinstate the template `image` field, or document its removal in the changelog.
- §2.4 — changelog entry for the new transfer format and what a legacy import drops.
- §3.1 — confirm the `chrome.action.setPopup` restart behaviour against a real profile.
- §5 — changelog entries for `capitalize`, date tokens and URL parsing.

### Safe to defer to a patch release

§2.3, the remainder of §3.1 (`sender.tab`, `isInjectableUrl`, shortcut race, silent action failures,
`event.keyCode`, relative URLs), all of §3.2, and all of §4.

---

## 8. Resolved

Items are **moved** here rather than deleted, so this document doubles as a migration log.

### A failed notification broke template execution — **fixed** (verified 2026-09-14)

Two linked defects in `src/lib/template/template-engine.ts`:

1. The success notification was awaited **inside** the render/copy `try`. If it rejected after the clipboard had
   already been written, control fell into the `catch`, the user was shown a _failure_ notification, and
   `execute()` rejected — for a template that had copied fine.
2. The failure notification was awaited **before** `throw e`, so its own rejection replaced the original
   render/validation error.

These compounded. `NotificationService.createNotification()` awaits both a storage read and
`browser.notifications.create`, so a single broken dependency (revoked `notifications` permission, failing
storage read) broke _both_ calls: defect 1 routed into defect 2 and a successful copy surfaced to the user as a
notification/storage error. All three callers (`action.service.ts:64`, `context-menu.service.ts:105`,
`execute-template-message-listener.ts:64`) await the result, so this was user-visible on every execution path.

Fixed by applying the underlying principle once rather than patching both call sites: **a notification reports
the outcome and must never change it.** The success notification moved _outside_ the `try` (so a success can no
longer fall into the failure path structurally, not merely by the `catch` staying exhaustive), and both
notifications now route through a private `notify()` helper that owns the `suppressNotifications` check and
swallows-and-logs any notification failure. `TemplateEngine` gained an injected `LoggingService` for this; no
container change was needed, as `background-worker.config.ts:117` auto-wires it and already binds
`LoggingServiceToken`.

Accepted consequence: a user whose notifications are broken now gets a _silent_ success. That is correct (the
text did reach the clipboard) and is logged, and it is the same class as the still-open "action click failures
are invisible to the user" item in §3.1.

The two characterization tests in `template-engine.test.ts` became regression guards, both verified to fail
against the pre-fix source. Branch coverage of the file rose to 100% as a side effect.

### Template grid errors could not be dismissed — **fixed** (verified 2026-09-14)

`template-data-grid.tsx` passed `action={loadFailed && <Button .../>}` alongside
`onClose={() => setError(undefined)}`. MUI renders its built-in close button only when `action == null`
(`@mui/material/Alert/Alert.js:240`), so for an _action_ error (`loadFailed === false`) the prop was `false` —
not `== null` — and MUI rendered an empty action container **and** suppressed the close button. `onClose` was
therefore unreachable in both branches, leaving a failed bulk/row action's alert on screen until the next action
succeeded or the page was reloaded.

Fixed by making the prop genuinely absent in the non-load branch: `action={loadFailed ? <Button .../> : undefined}`.
A load error still replaces the close button with retry, which is deliberate.

Covered by a regression guard in `template-data-grid.test.tsx` ("can dismiss an action error"), verified to fail
against the pre-fix source, plus a sibling asserting the load branch offers retry instead. A sweep for
`action={<condition> && ...}` across `src/lib` found no other instance.

**General trap:** in JSX, `cond && <X/>` yields `false`, not `undefined`, when `cond` is falsy. Any prop whose
consumer distinguishes "absent" from "supplied" with `== null` (as MUI's `Alert` does) will treat that `false` as
_supplied_. Use a ternary with an explicit `undefined` for such props.

Note: entries dated before 2026-09-14 cite the section numbering in use at the time. Where an old reference
points at a section that still exists it has been remapped; references to sections that have since been
resolved and removed (notably the old §1 "Blockers" and §2 "Missing template context entries") are left as
written, since their subject matter is recorded in the sweep table immediately below.

### Verification sweep — 2026-09-14

Every claim in the document was re-checked against the working tree. The following were found **already fixed**
and have been removed from the open sections:

| Former item                                                                                                        | Evidence it is closed                                                                                                                                  |
| ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `PREDEFINED.00007` references a non-existent entry                                                                 | `selectionMarkdown` is registered (`entry/selection-markdown.ts:8`, imported `entry/index.ts:149`); template at `predefined-templates.ts:59`           |
| `GetTabContent` is dead code                                                                                       | renamed `MessageType.TabContent`; sent from `tab.service.ts:104` and consumed by the `select`/`xpath` families via `select-xpath.utils.ts:12,22,34,44` |
| Missing selection/link/list context entries (whole table)                                                          | every listed entry now exists and is registered in `entry/index.ts`                                                                                    |
| No HTML→Markdown converter                                                                                         | `src/lib/common/markdown/markdown.service.ts` (`EuropaMarkdownService` + `OffscreenMarkdownService`), `MessageType.ConvertMarkdown`                    |
| `plugins`, `coords`, `locale`, `offline`, `os`, `screen*`, `tabs`, `template`, `originalSource`, `popular` missing | all now exist as entries; `popular` is a hard-coded empty object, `originalSource` a deprecated alias of `url`                                         |
| 21 flat deprecated option variables dropped without aliases                                                        | all present under `entry/deprecated/` and registered (`entry/index.ts:52-83`)                                                                          |
| Bitly hardcoded fallback access token                                                                              | removed — `bitly-url-shortener.provider.ts:35`: "There is deliberately no fallback token"                                                              |
| `tmpl.at` custom Bitly domain retained                                                                             | removed — `bitly-url-shortener.provider.ts:69`: no `domain` is specified, so the account default is used                                               |
| Revoked/expired Bitly token loops on failure                                                                       | `bitly-url-shortener.provider.ts:53-60` catches 401, revokes and throws `SHO401000`                                                                    |
| "~20 localisation TODOs across four directories"                                                                   | actual count is **7**, in two areas — corrected in §4                                                                                                  |
| `TemplateExecutionFailGeneralDescription` fallback                                                                 | symbol no longer exists anywhere in `src/lib`                                                                                                          |
| YOURLS credentials base64-encoded at rest                                                                          | **never true any more** — `SettingsService.normalize()` (`:150`) just trims; no base64 in `src/lib/url-shortener/**`                                   |
| `TODO: LOG` markers causing silent migration skips                                                                 | zero remain in `template-data-migrator.ts`                                                                                                             |
| "Log level mapping is acknowledged as confusing"                                                                   | replaced by the documented `remappedLogLevelsFromV1` map                                                                                               |
| `ClipboardService` creates/closes the offscreen document                                                           | that moved to `OffscreenService` (`clipboard.service.ts:27-30`)                                                                                        |

Files cited throughout the document that **no longer exist** were also purged; every reference was remapped:

- `src/lib/template/data/template-data.model.ts` → `template-data.schema.ts` (symbols renamed, dropping the
  `Data` infix; `autoCloseEnabled`/`optionLinkEnabled` moved into a new nested `TemplateActionPopup`)
- `src/lib/template/template-transfer.model.ts` → `template-transfer.schema.ts`
- `notification-data.model.ts`, `analytics-data.model.ts`, `logging-data.model.ts` → `*.schema.ts`
- `src/lib/tab/message/get-tab-context-message-listener.ts` → `tab-context-message-listener.ts`
- `DomDataStorage.forLocal()` → `new DomDataStorage(name, logging)` in `LegacyDataService`
- `migrate-ui.ts` → `migrate-ui.tsx`
- `guide.utils.ts` lives under `src/lib/ui/common/components/guide/`, not `src/lib/ui/options/`
- the settings components live in per-component subfolders under `src/lib/ui/options/component/`

Two counts were corrected: the guide documents **22 options across 15 groups** (was "22 plus 12"), and §4 lists
**7** localisation TODOs (was "~20").

### Legacy 1.2.x export files could not be imported — **fixed** (verified 2026-09-14)

A 1.x export was the raw `templates` array from storage, in which `background.coffee` normalised every unset
`shortcut` and `content` to `''`. `TemplateTransfer` rejected both (`shortcut: z.string().min(1)`,
and `content` fed a `nonempty()` template model), and because `templates` is parsed as a single
`z.array(...)` **one** such entry rejected the entire document — which practically every 1.x export contains.

Fixed by modelling the legacy sentinels instead of rejecting them, exactly as §2.5 prescribes:

- `shortcut: z.union([z.literal(''), TemplateShortcutStringSchema]).transform((v) => v || null).nullable().optional()`
- `content: z.string().transform((v) => v || ' ')` — mirroring the substitution the template migrator already
  performs, since `TemplateUserDefined.content` is `nonempty()`

Verified by probe and pinned by a `legacy 1.2.x export files` block in `template.service.test.ts` (65 → 73
tests), whose five behavioural guards were each confirmed to fail against the pre-fix schema. The schemas were
also renamed in the same change (`TemplateTransferTemplate` → `TemplateTransfer`, `TemplateTransfer` →
`TemplateTransferData`); a dangling `TemplateTransferTemplate` import left in
`template-import-dialog.tsx:18` was fixed at the same time.

A follow-up closed the residual. The schema requires `/^[A-Z0-9]$/`, but 1.x validated with
`R_VALID_SHORTCUT = /[A-Z0-9]/i` (`src/lib/options.coffee:13`) — **unanchored and case-insensitive**. Its wizard
was safe (`maxlength="1"` at `src/options.legacy.html:343` plus `utils.trimToUpper` at `options.coffee:1445`),
but its _import_ path assigned `shortcut` verbatim whenever that loose test passed (`options.coffee:1041-1043`,
`:1244`), so `'u'` and `'ab'` are reachable in 1.x storage.

Import and migration had also drifted apart: the migrator _degraded_ such a value to "no shortcut" while import
_rejected the whole document_. Both now share `normalizeTemplateShortcut()`
(`src/lib/template/data/template-data.schema.ts:62-84`), which trims, upper-cases and falls back to `null` when
the result still fails the strict schema — so `'u'` is now **preserved** as `'U'` on both paths instead of being
discarded on one and fatal on the other. The collision check runs against the normalized value, so `'u'` also
correctly loses to an existing `'U'`.

Pinned by `template-data.schema.test.ts` (a new 11-test contract for the normalizer, including the invariant
that it only ever returns a value the strict schema accepts) plus matching per-path tests in
`template.service.test.ts` and `template-data-migrator.test.ts`. All three files are at 100/100.

### Migration correctness defects — **fixed** (verified 2026-09-14)

Nine defects found by the migration test suite, all fixed and now covered by regression tests that were each
verified to fail against the pre-fix code:

- **Every user-defined template was silently discarded.** The migrator built a template without `description`,
  which `TemplateDataTemplateUserDefinedSchema` requires (nullable, not optional), so schema validation rejected
  all of them while the step still reported `Passed`. Fixed by setting `description: null`.
- **Concurrent steps clobbered each other.** All six template steps mutated the same repository through a
  read-modify-write with an `await` between read and write, so it was last-write-wins: five of six setting groups
  were lost, and each step deleted its legacy key afterwards, making the loss unrecoverable. `AbstractDataMigrator`
  now drives steps through async generators, strictly sequentially.
- **The migration tab never opened.** `new URL('migrate.html')` — a relative URL with no base — always throws.
  Now built with `URLSearchParams` and resolved through `TabService.createExtensionTab()`.
- **A skipped template logged `warn('')`**, an empty string, so it produced no diagnostic at all.
- **Legacy schemas rejected real 1.x data** in three places (`yourls.*` blanks, the string `logger.level`,
  content-less templates) and `z.httpUrl()` rejected self-hosted YOURLS hosts (`localhost`, LAN IPs,
  single-label hostnames). See §2.5 for the convention that came out of this. A suspected fourth instance in
  `oauth2_bitly` was **disproved** — the deleted vendored `src/vendor/oauth2.js` truthy-guarded every write, so
  blank values were never persistable.
- **The ID-collision guard was inert**: `idGenerator.generate()` received the set of _legacy_ keys rather than
  existing template IDs, and generated IDs were never added back.
- **One content-less legacy template took every other template down with it**, because the step is
  all-or-nothing. Content is now substituted with `' '`.
- **`seenShortcuts` was not updated in the predefined branch**, so a shortcut could be claimed twice.

### Remaining legacy context entries and offscreen consolidation — **implemented**

Closed the last of the legacy (`background.coffee`) context attributes and fixed a latent runtime blocker in
Markdown conversion.

- **New entries**: `template` (the currently-executing template, exposed as an object collection via
  `TemplateContextManager.getTemplate()`), `popular` (hard-coded empty object — usage statistics are no longer
  tracked), `notificationDuration` (always `0`), `toolbarStyle` (always `false`) and `toolbarFeature` (the
  inverse of `toolbarPopup`).
- **New deprecated aliases**: `originalSource` → `url`, `selectionLinks` → `selectedLinks`,
  `toolbarFeatureName` → `toolbarKey`, `toolbarFeatureDetails` → `toolbarStyle`. `selectionLinks` was missing
  from every previous audit of this file.
- **Markdown conversion was broken at runtime**: `europa` requires `document`/`Node`, neither of which exist in
  the MV3 service worker, so every Markdown entry would have thrown once executed. `MarkdownService` is now an
  abstraction with an `EuropaMarkdownService` (offscreen document) and an `OffscreenMarkdownService` (service
  worker proxy) implementation.
- **`coords` no longer comes from the page**: it is read via the extension's own `geolocation` permission in
  the offscreen document (`NavigatorGeolocationService`), instead of from the content script, so it is neither
  subject to a prompt against the page's origin nor blocked by the page's permissions policy. `coords` and
  `TabContextCoords` were removed from `TabContext` and its schema accordingly.
- **Single offscreen document**: only one offscreen document may exist per extension, so `ClipboardService`'s
  private document lifecycle was replaced by a shared `OffscreenService` that reference counts in-flight
  requests, creating the document for the first and closing it after the last. The offscreen bundle moved from
  `src/lib/offscreen/clipboard/` to `src/lib/offscreen/main/` and now hosts the clipboard, Markdown and
  geolocation listeners.

### Missing template context entries — **implemented** (verified 2026-09-04)

Closed nearly all of §2, except `popular` (see below) and `template`/`originalSource` (deferred — would need
deep template-engine internals access). All new entries ship as part of `ExtensionVersion.V2_0_0` (still
unreleased at the time of writing).

- **Page/selection data** (§2.1): added `links`, `scripts`, `styleSheets`, `referrer`, `selection`,
  `selectionHtml`, `selectedLinks`, `selectedImages`, `text` (new `TabContext.text` field, populated from
  `document.body?.textContent`), `meta`/`localStorage`/`sessionStorage` (operation-style entries reading
  `TabContext.meta`/`storage.local`/`storage.session` by name, following the `cookie.ts` pattern).
- **`linkHtml`/`linkText`/`linkMarkdown`**: wired up the previously-inert `ContextMenuTargetHolder` by
  injecting it into `TabContextMessageListener` and adding a `linkTarget: {html, text} | undefined` field to
  `TabContext`, computed as the nearest `a[href]` ancestor of the last right-clicked element.
- **Markdown conversion** (§2.2): added the `europa` npm package and a small wrapper exposing
  `TemplateContextManager.convertToMarkdown()`, honouring the existing `options.templates.markdown.inline`
  option. This unblocks `markdown`, `selectionMarkdown` (**also fixes §1.1**, the `PREDEFINED.00007` blocker),
  `linkMarkdown` and the `select*Markdown`/`xpath*Markdown` variants.
- **CSS selector / XPath entries**: wired up the previously dead `GetTabContent` message/schema/listener with
  12 new entries (`select`, `selectAll`, `selectHtml`, `selectAllHtml`, `selectMarkdown`, `selectAllMarkdown`,
  and the `xpath*` equivalents), backed by a new `TabService.getTabContent()` /
  `TemplateContextManager.getTabContent()` (cached) and a shared `entry/select-xpath.utils.ts` with 4 renderer
  factories.
- **Browser/device/env info** (§2.3): added `os`, `offline`, `plugins`, `screenWidth`, `screenHeight`,
  `coords` (geolocation, via `navigator.geolocation.getCurrentPosition` with graceful fallback to `undefined`
  on denial/failure) and `locale`. Extended `TabContext`/its Joi schema/content-script listener accordingly.
  Also fixed a **pre-existing bug** found along the way: `cookiesEnabled`/`javaEnabled` existed on `TabContext`
  but were missing from `getTabContextMessageReplyContextSchema`, which — since the Joi schema rejects unknown
  keys by default — meant **every** `GetTabContext` reply was failing validation before this fix.
- **URL parts**: added `authority`, `user`, `password`, `userInfo`, `source` following the existing
  `url.ts`/`host.ts`/`origin.ts` pattern.
- **Tabs listing**: added `tabs`, using the existing `TabService.findAllTabs()`.
- **Flat deprecated option aliases** (§2.4): added `markdownInline`, `shortcuts`, `shortcutsPaste`,
  `menuOptions`, `menuPaste`, and the full `yourls`/`yourlsUrl`/`yourlsUsername`/`yourlsPassword`/
  `yourlsSignature`/`yourlsAuthentication` family, all aliasing directly onto `options.*`.
  - `notifications` also got a deprecated alias — this required adding a new `notifications: { enabled }`
    branch to `TemplateContextOptions`/`buildOptions()`/`optionsDocumentation`, since no `options.*`
    equivalent existed yet (`NotificationData` was already available via `TemplateContextData`, just not
    surfaced through `buildOptions()`).
  - `toolbarClose`, `toolbarKey`, `toolbarOptions`, `toolbarPopup` also got deprecated aliases, mapping onto
    `options.templates.action.popup.autoCloseEnabled`/`.templateId`/`.popup.optionLinkEnabled`/`.mode`
    respectively (`toolbarPopup`'s legacy boolean maps to `mode === TemplateActionMode.Popup`).
  - **`notificationDuration` has no new-codebase equivalent and was not carried over.** `NotificationData`
    (`src/lib/common/notification/data/notification-data.model.ts`) only models `enabled`/`changeLog` — there
    is no manual notification-duration setting anywhere in the new settings UI; browser notifications are
    left to the platform's own auto-dismiss behaviour. Treated as intentionally dropped, like `popular`.
  - **`toolbarStyle`, `toolbarFeature`, `toolbarFeatureName`, `toolbarFeatureDetails` were already
    superseded within the legacy codebase itself** before this migration started: `background.coffee:1632-1634`
    shows legacy's own settings-migration step replacing them with `toolbar.popup`/`toolbar.style` and then
    deleting the old keys. There is nothing left to migrate from — also treated as intentionally dropped.

The entries listed here as "not implemented" (`popular`, `template`, `originalSource`,
`notificationDuration`, `toolbarStyle`, `toolbarFeature`, `toolbarFeatureName`, `toolbarFeatureDetails`) have
since been added — see "Remaining legacy context entries and offscreen consolidation" above.

### Options UI template management — **implemented** (verified 2026-09-03)

The Templates tab (§6.2) is no longer a stub. `TemplateDataGrid` gained a toolbar, a shortcut column, a
`Predefined` chip, free-text search and multi-select bulk actions, and four components were added beside it:

- `template-editor-dialog.tsx` — create/modify a template (title, description, shortcut, enabled, content) with
  inline validation (title required and capped at `TEMPLATE_TITLE_MAX_LENGTH`, content required, shortcut a
  single character that is not already assigned), dirty tracking via `es-toolkit`'s `isEqual` and a disabled `Save`
  until it is both dirty and valid. Predefined templates open read-only apart from `shortcut`/`enabled`,
  matching §6.2.1.
- `template-import-dialog.tsx` — paste or load a base64 document, parse it into a preview list, then import the
  selected subset.
- `template-export-dialog.tsx` — pick templates, review the base64 document, then copy it to the clipboard or
  save it as `templates.json`.
- `confirm-dialog.tsx` — shared destructive-action prompt, used before any delete.

Supporting changes:

- `TemplateService` gained `createTemplates()`, `removeTemplates()`, `setTemplatesEnabled()`, `moveTemplate()`,
  `exportTemplates()`, `parseTemplates()` and `importTemplates()`. `createTemplate()`/`removeTemplate()` are now
  thin wrappers over their bulk equivalents, every bulk operation is a single `repository.mutate()` (so a
  partial failure cannot half-apply), and `generateId()` takes the id set rather than rebuilding it per
  template.
- `getTemplateDescription()` was missing its general overload, so it could not actually be called with a
  `Template`; the overload has been added.
- `encodeBase64Utf8()`/`decodeBase64Utf8()` were added to `src/lib/common/codec/base64.utils.ts` because
  `btoa`/`atob` alone cannot round-trip the Unicode that template content may contain.
- The app bar search input is now wired: `query` is lifted into `App` and passed to both `OptionsAppBar` and
  `TemplateDataGrid`.
- `getErrorMessage()` moved out of `settings-dialog.tsx` into shared `use-error-message.ts` hook.
- Fixed the live bug where the grid's `deleteTemplate()` called `toggleTemplateEnabled()`.

Known limitations, tracked above: no icon picker (`image` is not in the model, §2.2), reordering is via
`Move up`/`Move down` rather than drag-and-drop (`@mui/x-data-grid` row reordering is a Pro feature), and all
strings are hard-coded English pending the i18n sweep.

### Options UI guide — **implemented** (verified 2026-09-03)

The legacy Guide tab (§6.4) is restored as `GuideDialog`
(`src/lib/ui/options/component/guide-dialog/guide-dialog.tsx`), reusing the settings dialog layout and opened
from the app bar's "Guide" button. Its content is generated from `templateContextEntriesDefinitions` instead of
being declared statically, so it stays in step with the entries actually registered:

- `guide.utils.ts` projects each definition into a `GuideEntry` per category (`getStandardGuideEntries()`,
  `getCollectionGuideEntries()`, `getOperationGuideEntries()`), skipping alias definitions and listing them
  against the entry they alias instead. `matchesGuideQuery()` backs the app bar search across names and aliases.
- Type/signature labels are derived from the category metadata, and `deprecated`, `added` and `links` are all
  surfaced. Descriptions resolve through `IntlService` from `descriptionKey`.
- `guide-introduction.tsx` (Mustache syntax primer) and `guide-examples.ts` (per-category examples) are the
  only hard-coded content, as neither describes an individual entry.

### Options UI settings — **implemented** (verified 2026-09-03)

Every legacy settings category except Templates is now editable again (§6):

- `SettingsService` (`src/lib/common/settings/settings.service.ts`) + `Settings`
  (`settings.model.ts`) aggregate the analytics, logging, notification, OAuth, template and URL shortener
  namespaces behind `getSettings()`/`saveSettings()`, preserving unrelated fields (e.g. `clientId`,
  `templates`) via `mutate()`, normalising empty strings to `null` for the Joi schemas, and
  base64-decoding/encoding the YOURLS credentials so the UI only ever handles plain text.
- `OAuthProvider.requestAuthentication()`/`OAuthService.requestAuthentication()` were added so the Bitly
  authorisation flow can be run without persisting its result, letting the account be applied on save rather
  than on change.
- `SettingsContext` (`settings.context.ts`) and `OAuthContext` (`src/lib/oauth/oauth.context.ts`) expose the
  services to React; both are provided by `OptionsUi` and bound in `options-ui.config.ts` (which also gained
  the notification, OAuth and URL shortener repositories plus `BitlyOAuthProvider`).
- `SettingsDialog` now loads settings on open, tracks dirty state with `es-toolkit`'s `isEqual`, blocks `Apply`/`Save`
  while invalid, offers `Reset` to revert every page back to the currently persisted values, reports failures
  via an inline `Alert`, and routes between the pages: `GeneralSettings`, `NotificationSettings`,
  `AnalyticsSettings`, `UrlShortenerSettings` and `LoggingSettings` (with the shared `SettingsSection` layout).

### Toolbar/browser action "default template" mode — **implemented** (verified 2026-09-02)

Previously listed as a blocker. Now covered by a dedicated `ActionService`
(`src/lib/common/action/action.service.ts`):

- `chrome.action.onClicked` listener executes the configured template when
  `mode === TemplateActionMode.Template` (`action.service.ts:28-32,47-67`).
- `chrome.action.setPopup({ popup: '' })` disables the popup in template mode and restores `popup.html` in
  popup mode (`action.service.ts:69-73`).
- Reacts to settings changes via `templateService.addChangeListener` (`action.service.ts:34-38`), mirroring
  `ContextMenuService`.
- Backed by new `TemplateService.createTemplateActionInfo()` / `getTemplateActionInfo()` and the
  `TemplateActionInfo` discriminated union (`src/lib/template/template.service.ts:50-60,135-139,253-262`).
- Registered in DI (`src/lib/worker/background/background-worker.config.ts:67`) and driven by
  `ExtensionManager` — `listen()` from `run()`, `update()` from `install()`/`update()`/`reload()`
  (`src/lib/common/extension-manager.ts:36,65,96,99,133`).

Residual follow-ups are tracked in §3.1 (startup re-application, user-facing failure feedback).

### Related fixes landed at the same time

- `ExtensionManager` now awaits content-script injection and uses `allFulfilled`, so injection/install
  failures are no longer swallowed (`src/lib/common/extension-manager.ts:62,146-158`).
- `src/lib/template/context/entry/index.ts:118-138` replaces the vague `TODO: Complete` with an explicit
  inventory of the missing legacy context entries.
- `package.json` gained `type:check`, `check` and `dev` scripts; `pnpm check`
  (`tsc` + `oxlint` + `oxfmt --check`) passes cleanly on the current tree.
