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

### 1.1 `migrate.html` renders nothing and discards every migration result — **FIXED**; see §8.

### 1.2 Context-menu auto-paste had no runtime effect — **IMPLEMENTED**; see §8.

### 1.3 Bare `{dateTime}`, `{lastModified}` and `{shorten}` rendered JavaScript source — **FIXED**; see §8.

### 1.4 Analytics posted to a decommissioned endpoint — **REMOVED**; see §8.

### 1.5 Only users on exactly 1.2.9 are migrated — **FIXED**; see §8.

### 1.6 Reloading `migrate.html` showed an empty preview — **FIXED**; see §8.

### 1.7 Every template shared one 8 KB `storage.sync` item — **FIXED**; see §8.

---

## 2. Data and migration

_Only §2.4 is open, and it is a changelog entry. §2.1, §2.2 and §2.3 are closed (see §8), and §2.5 is a standing
rule rather than a task._

### 2.1 Template ordering is lost during migration — **FIXED**; see §8.

### 2.2 `image`, `usage` and `menuId` are dropped with no replacement — **CLOSED (accepted)**; see §8.

### 2.3 A skipped predefined template logged a misleading "Migrated" line — **FIXED**; see §8.

### 2.4 Legacy import/export format differences (accept and document)

The transfer format (`src/lib/template/template-transfer.schema.ts`) is a **new**, base64-wrapped shape:
`TemplateService.exportTemplates()` (`template.service.ts:359`) serialises a `TemplateTransfer` and
base64-encodes it; `parseTemplates()` (`:399`) reverses that and validates before anything is written. Because
template content is arbitrary Unicode, `encodeBase64Utf8()`/`decodeBase64Utf8()`
(`src/lib/common/codec/base64.utils.ts:11,28`) are used rather than the Latin-1-only
`encodeBase64`/`decodeBase64` (`:1,3`), which now serve only the `encode-base64`/`decode-base64` context
entries.

Now that legacy exports parse (see §8), they are _tolerated_ rather than _supported_: `title`, `content`,
`shortcut` and `enabled` survive; `key`, `image`, `index`, `usage` and `readOnly` are silently stripped by
`z.object`; and every entry — predefined or not — becomes a **new user-defined** template, because the transfer
format carries no `id` or `predefined` flag. Nothing is ever overwritten. Worth a changelog entry.

### 2.5 Convention: legacy schemas must model what 1.x actually persisted — **RULE, NOT A TASK**

**Nothing here is open work.** All four defects below are fixed; this section exists so the _mistake_ cannot be
reintroduced, and should be read before writing or changing any `legacy-*.schema.ts`. It is deliberately kept in
§2 rather than moved to §8, because burying a live rule in the migration log is how it gets forgotten.

Each defect came from applying a _modern_ constraint to a _legacy_ schema; all four were silent, permanent
migration failures, because the step validates before mutating and so re-reads identical data on every retry.

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

### 3.2 Capability gaps

- **No `commands` section** in `src/manifest.json`. Shortcuts remain page-level `keydown` handlers in the
  content script, so they do not work on `chrome://` pages, the Web Store, PDFs, or when no tab has focus, and
  cannot be remapped via `chrome://extensions/shortcuts`. Legacy had the same limitation, so this is an
  improvement opportunity rather than a regression.

  **`chrome.commands` cannot replace this, and an earlier version of this document was wrong to call it "the
  obvious answer".** Commands are _static manifest declarations_: "Each command an extension accepts must be
  declared as properties of the `"commands"` object in the extension's manifest." The whole API surface is
  `getAll()` and `onCommand` — there is **no** method to add, remove or rebind a command at runtime, and an
  extension cannot set a key combination at all, since remapping happens only in `chrome://extensions/shortcuts`.
  tmplat's shortcuts are user-created data (any template, any `[A-Z0-9]`, added and removed at will), so a 1:1
  mapping onto commands is impossible by construction.

  The only shape that works is a **fixed pool of generic slots** — declare `run-template-1…N` in the manifest and
  let the options UI map each slot to a template. The costs are real and should not be taken on lightly:

  - `N` is frozen at build time; a user with more shortcut-bound templates than slots simply cannot bind them.
  - At most **four** commands may carry a `suggested_key`; the rest start unbound, so the feature silently does
    nothing until the user visits Chrome's shortcut page.
  - Binding is split across two UIs — the key is chosen in Chrome, the template in tmplat — which is a markedly
    worse flow than today's single dialog.
  - Command shortcuts must include `Ctrl` or `Alt`. Today's Shift+Alt/Ctrl+Alt modifiers satisfy this, so the
    existing bindings could carry over, but the constraint limits future choices.

  So this is a **supplement**, not a migration: a small pool of global commands could cover the cases page-level
  `keydown` fundamentally cannot reach (`chrome://`, PDFs, no focused tab) while the existing system keeps serving
  arbitrary per-template shortcuts. Verified against the Commands API reference on 2026-09-17.

- **No progress / "please wait" state.** Legacy `updateProgress()` drove the popup's progress bar.
- **No per-template usage statistics** (see §2.2).
- **Context menu contexts are unrestricted**: `contexts: [...ContextType.ALL]`
  (`src/lib/context-menu/context-menu.service.ts:120`, with a `// TODO: Should this be a limited set?` at
  `:119`). Legacy was more selective.
- **Legacy extension-compatibility shims are gone** (the IE Tab / Gecko Tab `SUPPORT` map in
  `background.coffee`). Almost certainly intentional, but it is an unlisted behaviour drop.

---

## 4. URL shortener

- **OAuth no longer exists in this codebase.** Bitly was the only OAuth provider, so dropping Bitly in 2.0.0
  removed the mechanism altogether (see §8). The three items previously tracked here — the hardcoded Bitly
  `client_id`/`client_secret`, the absence of token refresh/expiry handling, and the seven unlocalised OAuth
  error messages — are therefore **moot rather than fixed**: the code they described has been deleted.
- **Errors are not localised** remains open. The count previously recorded here ("seven, confined to the OAuth
  provider/service") was stale even before this change: measured 2026-09-17 there are **15** `TODO: Localise`
  markers, in `src/lib/template/template.service.ts` (11) and
  `src/lib/template/message/execute-template-message-listener.ts` (4). None were in the deleted OAuth tree.
  Legacy raised localised `AppError`s that surfaced in notifications. Note the broader UI is also still hard-coded English with `TODO: i18n` markers —
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
- **Templates no longer sync across devices** (§1.7). Moving templates to `storage.local` is what removes the
  8 KB-per-item ceiling, but it means template content, titles, descriptions **and per-template `shortcut`
  values** become device-local. A shortcut assigned on device A will not apply on device B. Settings still sync.
  Accepted deliberately: 1.x stored everything in `localStorage` and so never synced either, and the
  export/import flow covers moving templates between devices. Worth a changelog entry.

---

## 6. Legacy options page inventory (reference)

Exception to the "no UI" rule: the authoritative checklist of everything configurable on the legacy options page,
mapped to its new storage model and UI status. The legacy sources it was derived from (`src/options.legacy.html`
and `src/lib/options.coffee`) have since been deleted — see §8 — so this table, and git history, are now the only
record of them. Element ids and legacy keys are kept below precisely because of that.

**Every legacy settings category is implemented.** The settings dialog
(`src/lib/ui/options/component/settings-dialog/settings-dialog.tsx`) renders a page per navigation entry, loads
on open, tracks dirty state and offers `Reset`/`Apply`/`Save`. It is backed by `SettingsService`
(`src/lib/common/settings/settings.service.ts`), which aggregates the namespaces that own settings
(appearance, logging, notification, OAuth, template, URL shortener), normalises string fields via `normalize()`
(`:150`, a `value?.trim() || null`), and is exposed to React through `SettingsContext`. The options page has **no
outstanding legacy capability gaps**; what remains are the data-model gaps in §2 (notably `image` and migration
ordering). There are no dead controls left: context-menu auto-paste, the last of them, is implemented (§8).

### 6.1 General

| Legacy control (id)                                   | Legacy key              | New storage (`src/lib/template/data/template-data.schema.ts` unless stated) | New UI                                            |
| ----------------------------------------------------- | ----------------------- | --------------------------------------------------------------------------- | ------------------------------------------------- |
| Desktop notifications (`#notifications`)              | `notifications.enabled` | `src/lib/common/notification/data/notification-data.schema.ts`              | `notification-settings/notification-settings.tsx` |
| Toolbar behaviour popup vs template (`#toolbarPopup`) | `toolbar.popup`         | `TemplateAction.mode` `:17` (`TemplateActionMode`)                          | `general-settings/general-settings.tsx`           |
| Default toolbar template (`#toolbarKey`)              | `toolbar.key`           | `TemplateAction.templateId` `:19`                                           | `general-settings/general-settings.tsx`           |
| Close popup after use (`#toolbarClose`)               | `toolbar.close`         | `TemplateActionPopup.autoCloseEnabled` `:8`                                 | `general-settings/general-settings.tsx`           |
| Options link in popup (`#toolbarOptions`)             | `toolbar.options`       | `TemplateActionPopup.optionLinkEnabled` `:9`                                | `general-settings/general-settings.tsx`           |
| Context menu enabled (`#menuEnabled`)                 | `menu.enabled`          | `TemplateContextMenu` `:25-32` (`TemplateContextMenuMode`)                  | `general-settings/general-settings.tsx`           |
| Options item in context menu (`#menuOptions`)         | `menu.options`          | `TemplateContextMenu.optionLinkEnabled` `:30`                               | `general-settings/general-settings.tsx`           |
| Context-menu auto-paste (`#menuPaste`)                | `menu.paste`            | `TemplateContextMenu.autoPasteEnabled` `:27`                                | `general-settings/general-settings.tsx`           |
| Shortcuts enabled (`#shortcutsEnabled`)               | `shortcuts.enabled`     | `TemplateShortcut` `:53-58`                                                 | `general-settings/general-settings.tsx`           |
| Shortcut auto-paste (`#shortcutsPaste`)               | `shortcuts.paste`       | `TemplateShortcut.autoPasteEnabled` `:55`                                   | `general-settings/general-settings.tsx`           |
| Link `title` attribute (`#linksTitle`)                | `links.title`           | `TemplateLink.title` `:39`                                                  | `general-settings/general-settings.tsx`           |
| Link `target` attribute (`#linksTarget`)              | `links.target`          | `TemplateLink.target` `:38`                                                 | `general-settings/general-settings.tsx`           |
| Inline Markdown links (`#markdownInline`)             | `markdown.inline`       | `TemplateMarkdown.inline` `:47`                                             | `general-settings/general-settings.tsx`           |
| Analytics opt-in (`#analytics`)                       | `analytics`             | **dropped in 2.0** — see §8                                                 | none                                              |

All component paths are relative to `src/lib/ui/options/component/`. Two settings with no legacy equivalent are
also surfaced: the context menu mode (`TemplateContextMenuMode.Menu` vs `Template`) and the change log scope
(§6.5).

### 6.2 Templates

Implemented by `src/lib/ui/options/component/template-data-grid/template-data-grid.tsx`, which owns a toolbar
(`Add` `:331` / `Import` `:334` / `Export` `:400`, plus `Enable`/`Disable`/`Delete` for the current selection,
gated by `canDeleteSelection`/`canEnableSelection`/`canDisableSelection` `:205-207`) and delegates to
`TemplateEditorDialog`, `TemplateImportDialog`, `TemplateExportDialog` and the shared `ConfirmDialog`.

| Legacy capability                                                                    | Status in new grid                                                                                                                                     |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| List templates, toggle enabled, edit, delete                                         | implemented; row action toggles via `setTemplatesEnabled()`, delete really deletes (behind a confirmation)                                             |
| Add template (`#add_btn`) / template wizard                                          | implemented — `template-editor-dialog.tsx`, also opened by double-clicking a row                                                                       |
| Wizard fields: title (max 32), icon/image, shortcut key + modifier, enabled, content | title/description/shortcut/enabled/content implemented, with a shortcut column; `image` is dropped from the model (§2.2)                               |
| Predefined templates read-only (title/content disabled, delete blocked)              | implemented — see §6.2.1                                                                                                                               |
| Filter select + search (`#template_filter`, `#template_query`)                       | search implemented — the app bar input is lifted into `App` and filters on title, description, content and shortcut                                    |
| Drag-to-reorder (`index`)                                                            | replaced by `Move up`/`Move down` row actions `:229-230` backed by `TemplateService.moveTemplate()`; legacy ordering is restored during migration (§8) |
| Bulk enable / disable / delete                                                       | implemented, including inversion of the grid's "select all" (exclude) selection model                                                                  |
| Import wizard (paste JSON or file, select subset)                                    | implemented — `template-import-dialog.tsx`; parse-then-select, base64 in. Legacy 1.2.x files parse — see §8                                            |
| Export wizard (copy to clipboard or save `templates.json`)                           | implemented — `template-export-dialog.tsx`; base64 out, copy or download                                                                               |
| Pagination                                                                           | present (DataGrid, `pageSizeOptions={[10, 20, 50]}` `:349`)                                                                                            |

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
  Migration sorts that array by the legacy `index`, so the order the user had in 1.x is preserved (see §8).

### 6.3 URL Shorteners

Implemented by `src/lib/ui/options/component/url-shortener-settings/url-shortener-settings.tsx`:

- Active shortener radio (spoo.me / da.gd / YOURLS) — selecting one disables the others, since
  `UrlShortenerService.shorten()` picks the first enabled provider. goo.gl and Bitly intentionally dropped
  (§6.6).
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

- The guide advertises the bare form of `dateTime`, `lastModified` and `shorten`, which works again as of §1.3.
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
- Bitly shortener — dropped in 2.0.0 (see §8). `bitly` / `bitlyAccount` remain as stubs rendering `false`,
  exactly as `googl` does, so a 1.x template referencing them still renders.

---

## 7. Release checklist

### Must be closed before 2.0.0

Nothing. §1.7, the last blocker, is closed — see §8.

### Decide explicitly (do not let these ship by accident)

**The 2.0.0 entry in `src/changelog.json` is an empty placeholder** (`{"version": "2.0.0", "unreleased": true}`),
so the whole v2 rewrite currently ships with no release note — not just the items below. `CHANGELOG.md` and the
in-extension changelog UI are both generated from that file, so this is user-visible on first run after update.

- §2.4 — the new transfer format, and what a legacy import silently drops.
- §5 — `capitalize`, date format tokens and URL parsing, each of which changes existing templates' output.
- §5/§8 — templates (and their shortcuts) no longer sync across devices.

### Safe to defer to a patch release

All of §3.2 and all of §4. (§2.3 is closed — see §8.)

---

## 8. Resolved

### Dot notation resolves through lazy context entries (2026-09-17)

`TemplateContextManager` registers _every_ context entry as a lazy function, because entries such as `cookies`,
`options`, `selection` and `shorten` read from storage, from the active tab via a content-script round trip, or
from the network — building them eagerly would make every render pay for every entry, and a function is the only
shape that can return a `Promise`.

Mustache, though, only invoked a function at the **end** of a name lookup, never part-way through one, so
`{options.templates.links.target}` read `target` off a _function object_, found nothing, and rendered an empty
string. It failed _silently_: no error, just no output. The only working form was to enter the collection with a
section first (`{#options}{templates.links.target}{/options}`), after which the frame is a plain object.

This was stock mustache.js behaviour the fork had preserved faithfully, rather than a fork bug — but it was also
the last place the fork's async support was incomplete, since a `Promise` was awaited at the end of a lookup and
never mid-path.

Fixed upstream in **`tmplat-mustache` 5.1.0**, which resolves functions and thenables during the descent via a
shared `resolveLazyValue` helper called at the top of each iteration of `Context.prototype.lookup`. The change
was small because `lookup` was _already_ `async` and every caller already awaited it, so there was no signature
change and no new async plumbing. The value at the _end_ of a path is still deliberately left unresolved by the
loop, so a function there keeps its higher-order-section behaviour.

Adopted here by bumping to `tmplat-mustache@^5.1.0` and reverting the workarounds:

- The six guide examples and four descriptions that had been rewritten into the section form now teach the
  full-path form again, which is the form users actually reach for.
- The `00003` anchor and `00006` Markdown predefined templates dropped their whole-template `{#options}` wrapper
  in favour of `{#options.templates.links.title}`. That also removes a latent trap: inside `{#options}` a bare
  `{title}` or `{url}` resolved against the options frame first and only reached the page context by falling
  through.

Verified with `check`, a clean `build`, and 2059 unit tests — unchanged in count, because `guide-examples.test.ts`
renders all 19 examples and asserts their documented output in both forms. Measured rather than assumed: a lazy
value is re-invoked per distinct path (`{a.b}{a.c}` calls `a` twice, where `{#a}{b}{c}{/a}` calls it once) because
`Context`'s cache is keyed on the whole lowercased name — but `TemplateContextManager` memoises every expensive
source behind `computeCacheIfAbsent`, so `{cookies.a}{cookies.b}` still issues exactly one `cookies.getAll`.

Upstream (`janl/mustache.js`) has no async support at all, so this cannot be contributed back as-is.

### Templates moved out of the shared `storage.sync` item (2026-09-17)

`TemplateDataRepository` binds to `dataService.sync` (`src/lib/template/data/template-data.repository.ts:36`) and
`OptionalDataRepository` stores a whole namespace under a single key (`data.repository.ts:59,104`). So all of
`TemplateData` — five settings objects plus the **unbounded** `templates` array, each user template carrying an
unbounded `content` string (`template-data.schema.ts:116,133`) — is one `storage.sync` item.

`chrome.storage.sync` enforces **`QUOTA_BYTES_PER_ITEM` = 8,192 bytes**, counted as key length plus the
JSON-serialised value. This binds long before the 102,400-byte area total, and the remaining ~94 KB is
unreachable by this namespace.

Measured against the current schema and the seven predefined templates:

| Item                                                                              | Bytes  |
| --------------------------------------------------------------------------------- | ------ |
| Baseline `template` item (settings + 7 predefined stubs, no user templates)       | 788    |
| Fixed overhead per user template (UUID `id`, `title`, `description`, field names) | 251    |
| User templates with ~150 B of content before the 8 KB cap is hit                  | **21** |

A single template with a few KB of content breaches it on its own, and JSON escaping doubles every `"` and
newline in a Mustache body. 21 templates is well inside what a real user will create — 1.x had no such limit,
because it stored everything in `localStorage`.

**Nothing handles the failure.** There is no reference to `QUOTA_BYTES` anywhere in `src/`;
`BrowserDataStorage.set` (`data-storage.ts:139`) returns the raw rejection, `OptionalDataRepository.set` does not
catch it, and no `ExtensionError` code or i18n message describes it. The user writes a long template and gets a
generic failure with no indication that shortening it or deleting another template would help.

Three further defects follow from the single-item design:

- **Read-modify-write clobbering.** `mutate()` (`data.repository.ts:85`) is get-then-set with no compare-and-swap,
  and `TemplateDataRepository` is bound in the popup, options page, content scripts and worker. Two concurrent
  mutations to _different_ fields lose one entirely. Sync conflict resolution is per item, so editing template A
  on one device and B on another discards one whole set.
- **Write amplification.** Toggling `markdown.inline` rewrites every template. `MAX_WRITE_OPERATIONS_PER_MINUTE`
  is 120, and `SettingsService.import` (`settings.service.ts:94-116`) fans out five repository writes at once.
- **Whole-namespace validation.** `set()` validates all of `TemplateData` against one schema, so a single corrupt
  template fails the namespace and takes every setting with it.

**Decision (2026-09-17): move templates to `storage.local`, split per template, and rebalance every namespace.**
Accepted trade-off — see §5 for the user-visible consequence.

- Templates move to `storage.local` (10 MB). At ~200 B of content that is ~23,000 templates, and ~4,500 at 2 KB,
  so **`unlimitedStorage` is deliberately _not_ requested**: no human reaches those numbers, the only realistic
  ways to hit 10 MB are a pathological paste or a buggy import loop, and in both cases failing is more correct
  than silently filling the user's disk. It also avoids Web Store "Use of permissions" scrutiny. The permission
  carries no install-time warning, so it can be added later without disabling the extension pending consent.
- Each template becomes its own `template:item:<id>` key; order is tracked by a separate `template:index` key
  holding a `string[]`. The item prefix is distinct from the index key because template `id` is
  `z.string().nonempty()` (`template-data.schema.ts:87`), so `"index"` is a legal id and a
  `template:<id>` scheme could collide with it.
- Order needs explicit tracking because array position is already load-bearing — `TemplateService.move`/`moveAll`
  (`template.service.ts:292-347`) drive popup and context-menu order, "replacing the legacy `index` field". The
  index is a separate item from the settings so that reordering does not rewrite settings, listeners can be
  targeted, and the order never becomes part of the user-facing export/import surface.- The index is authoritative for **order**; a `getKeys()` prefix scan is authoritative for **existence**. On load,
  scan, order by the index, append orphans, drop dangling index entries and log the discrepancy, so a
  partially-failed write self-heals instead of losing a template silently.
- Namespace rebalance:

  | Namespace                            | Before | After                 | Reason                                         |
  | ------------------------------------ | ------ | --------------------- | ---------------------------------------------- |
  | `template` (settings only)           | sync   | **sync**              | ~350 B of genuine cross-device preferences     |
  | `template:index` + `template:item:*` | sync   | **local**             | size                                           |
  | `migration`                          | sync   | **local**             | correctness — see below                        |
  | `logging`                            | sync   | **sync (unchanged)**  | read by content scripts — see below            |
  | `notification`                       | sync   | **sync**              | ~80 B, a real preference                       |
  | `appearance`                         | local  | **local**             | already correct; grid state is device-local UI |
  | `url_shortener`                      | local  | **local (must stay)** | holds credentials — see below                  |

  `migration` moving is a **correctness fix, not an optimisation**: it records what has happened to _this
  profile's_ data, so syncing it lets device B read "the 2.1 migration completed" for a migration that never ran
  against device B's local data — which is precisely where templates now live. Its `versions` array
  (`migration-data.schema.ts:15`) is also unbounded inside an 8 KB item, i.e. the same defect in slow motion.

  `url_shortener` **must** stay local: `UrlShortenerYourlsProviderConfig` holds `password` and `signature` in
  plaintext (`url-shortener-data.schema.ts:13-21`). This is deliberate, not an inconsistency to be tidied away.

  `logging` was going to move to local as a per-device diagnostic toggle, but it is read from content scripts and
  `ExtensionManager.restrictLocalStorageAccess()` restricts `storage.local` to `TRUSTED_CONTEXTS` precisely because
  that area holds the credentials above. Moving it would have left every content script unable to read its own log
  configuration, for a saving of a few dozen bytes. It stays in sync.

- `action.templateId` stays in synced settings even though it points at a now-local template. Predefined ids
  (`00001`–`00007`) are stable across devices, and `TemplateDataRepository.update()`
  (`template-data.repository.ts:110`) already repairs an unknown id by falling back to the first enabled
  template, so it self-heals rather than dangling.

Resulting sync usage is **under 500 bytes of 102,400**, with no item near 8 KB.

**Architecture.** `DataStorage` needs only an additive `getBytesInUse()`; everything else is expressible on the
existing interface. `DataRepository` cannot express a collection — it is hard-wired to one namespace = one key,
including the exact-match listener filter (`data.repository.ts:48`). Rather than bypass or widen it, extract the
shared plumbing into a common base and add a sibling `CollectionDataRepository` that owns the item keying and the
index, and translates raw `DataStorageChanges` into added/updated/removed/reordered events. Per-item validation
then contains a corrupt template to that template.

Two call sites need attention when this lands:

- `TemplateContextManager.getData()` (`template-context-manager.ts:139`) merges `local.all()` with `sync.all()`,
  which would pull every template body into memory on every render just to serve `{templateCount}` and
  `{templateCustomCount}`. Narrow it to explicit namespaces and serve those counts from the index length.
- `SettingsService` (`settings.service.ts:108`) mutates repositories uniformly and needs a collection-aware branch.

**Decisions taken while implementing (2026-09-17).**

- **Content scripts can no longer read templates at all.** `storage.local` is restricted to trusted contexts, so
  `ShortcutEventListener` cannot keep reading the collection directly. It now asks the service worker over a new
  `template_shortcut_info` request/response message, and `TemplateShortcutBroadcaster` broadcasts
  `template_shortcut_info_changed` to every tab when templates or template settings change — a content script cannot
  observe `storage.onChanged` for an area it has no access to. `TemplateService`, `TemplateDataRepository` and
  `TemplateCollectionRepository` are no longer bound in the content DI container.
- **`SettingsService` needed no collection-aware branch after all.** It only ever aggregated the _settings_
  namespaces; templates were already excluded from `Settings`, so dropping `templates` from `TemplateSettings` left
  it correct as written.
- **No 2.x → 2.x relocation migration was written.** 2.0.0 is unreleased (the newest tag is `v1.2.9`), so no
  installed profile holds templates in the synced `template` namespace and such a migrator would be dead code on
  day one. The 1.x path is covered instead by `TemplateMigrationRepository`, an adapter that presents settings plus
  collection as the single `{ ...settings, templates: [...] }` object the legacy migration steps were written
  against, and translates one whole-list mutation into per-item writes.
- **`TemplateService.addChangeListener` now passes nothing.** Settings and templates are separate storage areas, so
  a change to one carries no consistent snapshot of the other; every listener re-reads. `ActionService`,
  `ContextMenuService` and `ShortcutEventListener` were updated accordingly, the last of which also gained a
  generation counter so an in-flight load started before a change cannot overwrite a fresher result.
- **`setTemplatesEnabled` resolves every id before writing any.** With one item per template, writing as ids are
  visited would leave an unknown id part way through the list having already flipped the ones before it —
  `removeTemplates` already validated up front, and this now matches.

### Bitly and OAuth removed entirely (2026-09-17)

Bitly's API became unreliable and the user decided not to continue supporting it. Because **Bitly was the only
OAuth provider**, dropping it removed the OAuth mechanism altogether rather than just one shortener.

**Deleted:** `src/lib/oauth/` in full (service, context, provider base class, `BitlyOAuthProvider`, data schema,
repository and migrator, all tests), `src/lib/url-shortener/provider/bitly-url-shortener.provider.ts` and its
test, and `src/lib/test/oauth.mock.ts` — 17 files. Plus `DataNamespace.OAuth`, `Settings.oauth`/`SettingsOAuth`
and their `SettingsService` wiring, `UrlShortenerProviderName.Bitly`, the Bitly connect/disconnect UI block in
`url-shortener-settings.tsx`, the DI bindings in all four containers, the `OAuthContext` providers, 18 i18n keys
and the `SHO401000` error code (which was Bitly-only).

**Two decisions, both taken deliberately rather than by default:**

1. **`{bitly}` and `{bitlyAccount}` are kept as deprecated stubs rendering `false`**, not deleted. This is the
   treatment `googl` already gets for a service that no longer exists (§6.6), and it means a 1.x template
   referencing them still renders instead of failing. Guarded by a test, and the mutant that makes either render
   a value again is killed.
2. **The legacy `oauth2_bitly` migration step became a _removal_, not a transfer.** It previously carried the
   stored credential into the new OAuth namespace; there is now no such namespace. Deleting the key is what stops
   an access token the extension can no longer use from sitting in local storage indefinitely — if the step were
   simply deleted, nothing would ever read or remove the key again. `oauth2_adapterReverse` and `oauth2_google`
   go with it, as `data_namespace_url_shortener_migration_step_4`.

**`identity` removed from `src/manifest.json`.** It was requested solely for `launchWebAuthFlow`/`getRedirectURL`
in the deleted OAuth provider. The remaining permissions were re-audited individually and all are still reached:
`clipboardWrite` and `geolocation` via DOM APIs (`document.execCommand`, `navigator.geolocation`) rather than a
`browser.*` namespace, which is why a naive namespace grep under-reports them.

**Pre-existing bug found and fixed en route:** `data_namespace_url_shortener_migration_step_1` is a _removal_
step, but its description read "Transferring Bitly URL shortener options". The builder uses that argument
verbatim as the user-facing description, so the migrate page told users their Bitly options were being carried
over while the step deleted them. Corrected to match what the step does.

**Verified:** `check` clean; 1990 tests / 117 files; coverage 94.35 / 93 / 90.92 / 94.37, over the CI floor;
`build` green with `intl-message-key.ts` and `extension-error-code.ts` reproducing the hand-edits
**byte-identically** after the 18-key prune; 18/18 e2e. Both new guards mutation-verified.

### §3.1 correctness defects

All six closed. Each is a regression guard in the suite, and the reasoning that is not obvious from the diff is
recorded as a comment at the change itself rather than only here.

**`sender.tab` outranked an explicit `tabId`** (`execute-template-message-listener.ts`). Chrome populates
`sender.tab` for _any_ extension page loaded in a tab, not just content scripts, so such a page asking to run a
template against a specific tab silently targeted itself. The condition now consults `input.tabId` first and only
falls back to the sender, so an explicit target always wins; the existing `Skipped / Tab could not be found` path
still covers an id that resolves to nothing.

**Shortcut cache race** (`shortcut-event-listener.ts`). `listen()` registered the `keydown` handler before
populating the cache, so a keystroke arriving first was silently dropped. `onKeyDown` now awaits the load whenever
the cache is not yet primed.

The constraint that shapes this is `preventDefault()`: it only takes effect synchronously within event dispatch,
so a handler that has awaited cannot suppress the key. The listener therefore keeps the synchronous path whenever
the cache is primed - which is every keystroke but the first - and accepts losing _only the suppression_ on a
keystroke that arrives during the initial load. Losing the suppression is strictly better than the old behaviour
of losing the copy entirely.

A failed load is **retriable**, which took a second pass to get right. The first version held the load in a
single `ready` promise assigned once in `listen()`; because that promise settles exactly once, every later
keystroke awaited an already-settled promise, found an empty cache and did nothing. A page loaded during a
transient storage failure - precisely the cold-profile `DAT404000` window this was meant to cover - would have had
dead shortcuts for its entire lifetime, recoverable only by the user changing their settings. The load is now held
in a `loading` field that is cleared once it settles, so a later keystroke re-attempts it, and reused while still
in flight so a burst of keystrokes shares one request rather than stampeding the storage layer. The failure is
logged and swallowed rather than rejecting, both so callers cannot hang and so the retry path is reached.

**Action click failures were invisible** (`action.service.ts`). `TemplateEngine.execute()` already notifies on
failure, so only the two failures thrown _before_ the engine is reached were silent: a disabled template and an
unusable tab. Both now raise a notification through the same swallow-and-log helper pattern the engine uses, under
two new error codes, `ACT409000` and `ACT404100`.

The misleading message was fixed at source rather than papered over. `createTemplateActionInfo()` mapped a
_disabled_ template to `undefined`, which left the caller unable to tell "disabled" from "missing" and reporting
the latter for both. Since the function already returns `Popup` mode when the template cannot be found, the
template in the `Template` branch is always resolved - the `| undefined` existed _solely_ for that lossy enabled
mapping. `TemplateActionInfo.template` is therefore now non-optional and `ActionService` checks `enabled` itself.
`ActionService` is the only consumer of the type, so this narrowed rather than widened the contract.

**Action state did not survive a browser restart** (`extension-manager.ts`). `setPopup` is session state, so
Chrome restores the manifest's `default_popup` on restart, silently reverting a user from `Template` mode to the
popup. `run()` now reapplies the action state on every service worker start.

That alone is not sufficient, which is the non-obvious part: an MV3 worker only runs when an event it subscribes
to fires, so without a `chrome.runtime.onStartup` listener the worker may not start when the browser does, and the
refresh would not happen until the user had already clicked the action - by which point they would have hit the
restored popup. The listener exists to _wake the worker_; the refresh in `run()` then covers every other wake. A
failure to refresh is logged and does not prevent startup. `runtime.onStartup` was added to the browser API fake.

**`event.keyCode` replaced with `event.code`** (`shortcut-event-listener.ts`). `code` was chosen over `key` on
evidence, not preference: the shortcut modifier is Shift+Alt on macOS and Ctrl+Alt elsewhere, and both rewrite
`key`. Measured in real Chromium, Shift+Alt+1 reports `key: '!'` with `code: 'Digit1'`, so `key` would have broken
every digit shortcut on macOS. `code` also reproduces exactly what `String.fromCharCode(event.keyCode)` yielded
for these keys (85 -> `U`, 49 -> `1`), so no shortcut that worked before changes behaviour.

The trade-off, accepted: `code` names the physical key by US layout, so a shortcut is bound to a position rather
than to the engraved character on a non-US layout. This is the same behaviour `keyCode` had, and unlike `key` it
is at least consistent.

**Relative URLs in serialized HTML** (`tab-context-message-listener.ts`). The recorded framing of this item was
wrong, and the `// TODO` marker was on the wrong line. `mapItemProperty` reads DOM _properties_ (`.href`/`.src`),
whose getters resolve against the document's base URL - verified in real Chromium, including for the detached
selection clone - so `selection.links` and `selection.images` were already absolute. The comment now records that.

The real defect was in the serialized HTML. 1.x wrote the resolved URLs back into the _attributes_
(`content.coffee:246-247`) and only then captured `selectionHTML`; v2 captured `container.innerHTML` directly, so
the HTML still carried relative URLs that break the moment the output is pasted anywhere else. A shared
`absolutizeUrls()` helper now rewrites `href`/`src` attributes before serialization, reading the resolved value
from each element's reflected property rather than matching element types - so it covers anything that reflects
one and skips anything that does not.

This extends to `linkTarget`, which serializes `anchor.outerHTML`, and there the ordering matters: that anchor is
a **live node in the user's page**, so it is cloned before being rewritten. Rewriting in place would silently edit
the page the user is looking at. The selection container is already a detached clone, so mutating it is safe. Both
halves are asserted.

Those URL assertions are claims about how the DOM resolves an attribute against a base URL, which duck-typed
literals cannot answer - a stub would only restate the assumption. They therefore live in a new
`tab-context-message-listener.urls.test.ts` running in the `dom` project against real elements and a real
selection, while the sibling spec keeps covering context assembly in `node`.

Verified with `check`, 2049 unit tests across 122 files, coverage 94.51 / 92.72 / 91.13 / 94.55, a clean `build`
and 18/18 e2e. The e2e run is worth noting here: `copy.spec.ts` drives real keyboard shortcuts through a real
Chromium, so it exercises the `event.code` change end to end rather than only against a synthetic event.

### §1.2 Context-menu auto-paste implemented — **done** (2026-09-16)

`contextMenu.autoPasteEnabled` round-tripped fully — stored, migrated, surfaced on `TemplateContextMenuInfo`,
exposed to templates and presented as a working toggle — but nothing consumed it. `ContextMenuService.onClicked()`
called `templateEngine.execute()` and stopped there; only the keyboard-shortcut path pasted. There was no
`MessageType.Paste` and no content-side listener, so the worker had no way to ask for one.

**The capture half already existed.** 1.x recorded `e.target` on `contextmenu` and backed it up per request id;
v2's `ContextMenuEventListener` already does the equivalent into `ContextMenuTargetHolder`, which
`TabContextMessageListener` reads during a menu-driven render to resolve `linkHTML`/`linkText`. That existing,
working consumer is also the evidence the holder survives from the `contextmenu` event to the menu click — the
listener clears on `blur`/`click`, and if opening the native menu tripped either, link context entries would
already be broken. So only the paste half had to be built.

Added: `MessageType.Paste` (keeping 1.x's `'paste'` wire name), `PasteMessageInputSchema` + a **void**
`PasteMessageConfig`, `PasteMessageListener` in the content script, and a `paste()` call in
`ContextMenuService.onClicked` gated on `autoPasteEnabled && info.editable`. The caret-preserving splice and
target resolution were extracted from `ShortcutEventListener`'s private statics into `src/lib/tab/paste.utils.ts`,
so both paths now share one implementation rather than the context menu growing a second copy of it.

**Two decisions worth recording:**

- **A paste failure is logged and swallowed, never rethrown.** By the time it runs, the copy has succeeded: the
  output is on the clipboard and the user has been notified. Rethrowing would report a completed copy as a failed
  click — the same trap the template engine's notifications used to fall into (§8), so it is resolved the same way.
- **`info.editable` gates _asking_; the content script gates _pasting_.** Chrome reports `contenteditable`
  elements as editable contexts, but they have no `value`/`selectionStart` to splice around, so the element itself
  is the only reliable authority. `getPasteTarget` therefore re-checks, and an ignored paste is a `debug` log
  rather than an error.

Tests: `paste.utils.test.ts` (16) and `paste-message-listener.test.ts` (8) — both routed into the `dom` Vitest
project via `domOverrides`, because guards about a null `selectionStart` on a non-text input and a
`contenteditable` having no value are only meaningful against elements that really behave that way; a duck-typed
stub would assert the assumption back at itself. Plus a 6-test `auto-paste` block in
`context-menu.service.test.ts` and `Paste` schema/config cases in `tab-message.test.ts`.

**Mutation-verified 6/6:** the `info.editable` gate dropped (1 failure), the `autoPasteEnabled` gate dropped (1),
the paste failure rethrown (1), the splice replaced by a whole-value assignment (3), the editable guard removed
(6 — three of them in the _shortcut_ suite, confirming the extraction left that path's guards load-bearing), and
the listener writing into any recorded element (1).

Not covered by e2e: Playwright cannot drive a native context menu. The shortcut auto-paste path, which shares the
same `paste.utils`, is exercised end-to-end by `copy.spec.ts`.

### §1.4 Analytics removed entirely — **done** (2026-09-16)

`AnalyticsService` posted to `https://www.google-analytics.com/collect` with a Universal Analytics property
(`UA-28812528-1`). Google shut UA down, so every request failed; the options page nevertheless presented a working
opt-in, and `AnalyticsServiceToken` was never even bound in the background container, so the three events legacy
tracked from the background (`Templates/Used`, `Shorteners/Used`, `Requests/Processed`) could not have been sent
even if the endpoint were live.

The user's decision was to **remove analytics entirely rather than migrate to GA4**. Removed: `src/lib/analytics/`
(service, model, repository, schema, data migrator and all tests), the `analytics-settings` options page and its
nav entry, `Settings.analytics`/`SettingsAnalytics`, `DataNamespace.Analytics`, the analytics entry in the template
context data model, every DI binding across the four containers, the `trackEvent` calls and the two
`// TODO: Re-evaluate analytics` markers in the UI entry points, the three stale `// TODO: Track analytics` markers
in `OAuthService`/`UrlShortenerService`, 8 i18n keys and the `ANA500000` error code.

**The one decision that needed care was the legacy key.** 1.x stored a bare boolean in the extension origin's
`localStorage` under `analytics`; 2.0 stored its own copy in `chrome.storage.sync`. Different storages, so deleting
the v2 data is self-contained — but deleting the analytics _migrator_ outright would have orphaned the legacy key
in the user's storage forever, since nothing would ever read or remove it again. `'analytics'` was therefore added
to `LegacyDataMigrator`'s removal list, alongside the other 1.x keys with no v2 equivalent (`options_active_tab`,
`options_limit`, `stats`, `updates`). That migrator exists precisely for this case.

Verified: 1999 tests / 119 files green (down 26 tests / 5 files, all analytics-specific), coverage 94.4% statements
/ 92.48% branch — still over the CI floor, `check` clean, `build` green, 18/18 e2e green. The build regenerates
`intl-message-key.ts` and `extension-error-code.ts` identically to the hand-edits, confirming the generator agrees.
**Mutation-verified:** removing `'analytics'` from `LegacyDataMigrator`'s keys fails 3 tests.

**Nothing was left behind.** An earlier draft of this entry deferred three `opt_analytics_*` i18n keys and the
analytics markup in `src/options.legacy.html` to "a separate, larger cleanup". That cleanup had in fact already
happened — the legacy pages, their CoffeeScript and `src/vendor/` were all deleted in `6cf317e`, taking the three
keys with them. Re-verified 2026-09-16: `analytics` now appears nowhere in `src/` except `LegacyDataMigrator`'s
removal list and its tests, which is exactly where it should.

### `isInjectableUrl` wrongly reported the extension stores as injectable — **fixed** (verified 2026-09-16)

The `pathname`-scoped entries in `restrictedInjectionUrls` (`src/lib/common/url.utils.ts`) have no leading slash,
but `URL.pathname` always does, so `'/webstore/detail/x'.startsWith('webstore')` was `false` and
`chrome.google.com/webstore` and `microsoftedge.microsoft.com/addons` passed the injectable check.

Fixed at the comparison site rather than in the data, so the entries stay free of an easily-forgotten leading
slash: `url.pathname.startsWith(\`/${restrictedUrl.pathname}\`)` (`:76`).

The characterization test in `url.utils.test.ts` has flipped into a regression guard — both URLs are now asserted
to return `false` alongside the hostname-only restrictions. **Mutation-verified:** dropping the interpolated
leading slash fails exactly those two cases.

### §1.3 Bare Operation entries rendered JavaScript source — **fixed** (verified 2026-09-16)

Every `Operation` entry is exposed to templates as a function, so referencing one bare (`{camelCase}` rather than
`{#camelCase}...{/camelCase}`) stringified the function and pasted its own source into the user's clipboard. It also
broke `{dateTime}`, `{lastModified}` and `{shorten}`/`{short}`, which declare a `Standard` category, are documented
to work bare, and did so in 1.x. Diagnosed 2026-09-10 while fixing the `cookies`/`hashSearchParams` object-collection
bug, which was the same defect class reached by a different route.

1.x defended against this twice: its engine (mustache.js 0.7.2, `8f3c5e3:src/vendor/mustache.js:294-297`) _invoked_ a
nested function found by a name tag rather than stringifying it, and its `rendered` helper
(`8f3c5e3:src/lib/background.coffee:651-655`) handled the resulting zero-argument call via `if arguments.length`. The
fix restores both halves.

**Engine.** `tmplat-mustache` 5.0.0 — rebuilt from mustache.js 4.2.0 rather than patching the 2.x fork — resolves a
name token through a new `Writer.resolveValue`, which invokes a function instead of stringifying it and returns
`undefined` if the result is still a function. Only one level is unwrapped deliberately, so a self-returning function
renders nothing rather than spinning. Sections are untouched.

**This repository.** `TemplateContextManager.render`/`renderTrim`/`renderTrimStart`/`renderTrimEnd` and
`TemplateContextEntryNestedRenderer` now accept no arguments and resolve to `''`, which is the modern equivalent of
legacy's `if arguments.length` guard (`8f3c5e3:src/lib/background.coffee:651-655`). Every mapper therefore receives
`''` for a bare reference.

That alone would have made `{dateTime}` and friends render empty, because the content renderer factories short-circuit
empty content without calling the mapper — which is what makes `{camelCase}` render `''` rather than throwing. The
three entries that carry a documented bare fallback opt out via a new `allowEmptyContent` option on
`createContentRenderer`/`createTrimmedContentRenderer`, so their existing `content ? ... : <default>` branches are
finally reachable. No other entry file changed.

Guards: `contract.test.ts` asserts, for every registered operation, that a bare reference leaks neither renderer
source nor `[object Object]`, and that the four dual-category entries resolve a value of their own — the whole-category
assertion that pins the class rather than a handful of examples. Plus explicit bare-form expectations for
`{dateTime}`, `{lastModified}` and `{shorten}`, a no-argument case for each `render*` helper, and short-circuit /
`allowEmptyContent` cases for both renderer factories.

`TemplateEngine.compile` still throws `TEE400000` when the whole rendered output is empty, so a template consisting
solely of `{camelCase}` fails with a user-facing error rather than silently copying nothing. That is intended.

Three alternatives were rejected. Suppressing the stringification in the engine and rendering `''` fixes the leak but
leaves the three documented bare forms permanently dead. Attaching a benign `toString` to each lambda works without a
dependency release — verified — but `toString` is synchronous, so it can never produce those three values, and it
leans on an engine implementation detail that any future hand-rolled entry would silently miss. Warning about bare
references when a template is saved is complementary, not a substitute, since it does not change what renders.

### §1.6 Reloading `migrate.html` showed an empty preview — **fixed** (verified 2026-09-16)

Found by `e2e/migrate.spec.ts`, the only test that drives a full migration and then reloads the page.

`DataMigrationService.advanceMigrationPhase()` keys the stored phase on the **user's** version, so a completed run
writes `{ versions: [{ phase: 3, version: '1.2.5' }] }` — verified by probing a real profile. But
`getRequiredMigrationVersions()` looked the phase up by the **migration** version (`'1.2.9'`), found nothing,
defaulted to `Pending` and kept reporting the version as required. `getRequiredMigrations()` therefore never threw
`MIG409000`, and the `namespaces.length > 0` filter reduced to an empty array — so an upgraded user who reloaded was
shown the "Upgrade tmplat" preview with no version heading, no namespaces, no steps, and a **Start migration**
button.

Not a dead end even before the fix: `migrate()` rejected `MIG409000` via `isMigrationRequired()`, which consulted
`getMigrationPhase(version)` with the user's version, so pressing the pointless button landed on the right screen.

**Fixed in two places.** `getRequiredMigrationVersions()` now checks `getMigrationPhase(version)` once, for the
user's version, instead of filtering per candidate. The per-candidate filter was never meaningful: `migrate()`
advances the phase a single time, after every applicable migration version has run, so a completed phase already
means every candidate is done — and a candidate names a data _format_, so it can never equal a version anybody
upgraded from. Keying the _write_ side on the migration version instead would have been wrong, since
`MigrationPhase.Initiated` is written by `initiateMigration()` before any candidate is resolved.

`isMigrationRequired()` was simplified to delegate, rather than repeating the completed-phase check, so the two
cannot drift apart and disagree again.

Separately, `DataMigrationManager.getRequiredMigrations()` now throws `MIG409000` when the `namespaces.length > 0`
filter leaves nothing, making an empty preview unreachable by _any_ route — including a user whose legacy keys were
already cleared by hand. It is thrown **outside** the `try` so the catch cannot report "nothing to migrate" as a
failure to determine what is required.

Guards: two `data-migration.service.test.ts` cases seeding the phase under an _earlier_ 1.x version (the existing
case seeded and queried the same version, which is precisely why no unit test caught this), one
`isMigrationRequired` case, and three `data-migration-manager.test.ts` cases covering namespace omission, the
`MIG409000` rejection and the absence of an error log. The e2e pin became "reports that there is nothing left to
migrate after a reload". **Mutation-verified 3/3:** per-candidate lookup restored (2 failures), the empty-preview
guard removed (2), and the guard moved inside the `try` (1).

Items are **moved** here rather than deleted, so this document doubles as a migration log.

### §2.1 Template ordering was lost during migration — **FIXED** (2026-09-15)

Legacy templates carry an explicit `index` and 1.x sorted by it on load (`background.coffee:2061`,
`_.sortBy store.get('templates'), 'index'`), maintaining it on move by swapping the `index` values rather than
reordering the array (`options.coffee:980-981`). The field was already required and validated
(`legacy-template-data.schema.ts:54`) but simply unused, so a 1.x user with a carefully ordered list got
"everything bundled, then everything custom" - and since the legacy key is deleted immediately afterwards, the
loss was **unrecoverable**.

The templates step now records which new id each legacy entry maps to and sorts `data.templates` by the legacy
`index` before returning. Note array position in the legacy data is _not_ authoritative, which is why the sort
uses `index` rather than the position the entries are processed in.

Decisions taken:

- **Templates with no legacy counterpart sort last**, keeping their bundled order relative to each other. They are
  new in 2.0 and cannot be placed within an order they were never part of, so appending avoids displacing the
  arrangement the user actually had.
- **Ties keep their current relative order.** 1.x could produce duplicate indexes (`options.coffee:622` assigns
  `ext.templates.length` on add), and `Array#sort` is stable, so no explicit tiebreak is needed.
- **An already-migrated template still contributes its ordering.** Otherwise re-running the step after a partial
  migration would push everything migrated on the earlier pass to the end. This required widening the `migratedIds`
  set to a `migratedTemplates` map so the skip branch can resolve the stored template.

Sorting runs unconditionally, which is safe because the step is atomic: a non-`Passed` result calls `cancel()`
(`data-migration-step-builder.ts:121-123`), discarding the whole mutation and retaining the legacy key, so an
ordering change can only ever persist on the success path.

Guards: a new `describe('ordering')` block in `template-data-migrator.test.ts` (5 tests) whose fixtures give
`index` an order that deliberately disagrees with the legacy array order. Five mutants all caught: sort removed
(7 failures), comparator reversed (3), templates with no legacy counterpart placed first (5), sorting by legacy
array position instead of `index` (3), and the already-migrated ordering record dropped (1).

Existing assertions that indexed into `templates[n]` were switched to look up by id, since they are about the
template rather than its position.

### Interrupted migration was an unrecoverable dead end — **FIXED** (2026-09-15)

A migration that never finished leaves its phase on `Started`. Every later attempt then hits the
`Started` -> `Unknown` guard (`data-migration.service.ts`, pinned at `data-migration-manager.test.ts:364`), so
nothing runs and `MigrationResults` renders its "already under way" notice. That branch returned an `Alert` and
**nothing else** — confirmed empirically as zero buttons — so the user had no way forward at all. `retryMigration()`
existed and resets the phase, but the only screens that could reach it were the failure ones.

The `Unknown` branch now offers a retry. It is deliberately a **secondary** (`color="warning"`) action rather than
the primary one, because the other cause of `Unknown` is a migration genuinely running in a second tab, and
retrying resets the phase so both runs could then proceed concurrently — which the sequential-step fix for BUG B
does **not** protect against, since those are separate contexts. `migrate_results_unknown_message` was reworded to
name both causes and to ask the user to close other migration tabs first.

Note the accidental-refresh guard is untouched: only a deliberate retry resets the phase.

Guards: `migration-results.test.tsx` (the click reaches `onRetry`; the result actions stay absent) and
`app.test.tsx` (the whole chain reaches `retryMigration` with the right version). Both verified to fail against
the pre-fix component.

### §2.2 `image`, `usage` and `menuId` dropped — **accepted** (decided 2026-09-15)

Closed as a deliberate product decision rather than a code change.

- **`image`** (the per-template icon) and **`usage`** (the per-template invocation count behind 1.x statistics and
  the `popular` context entry) are no longer applicable to v2 and will not be reinstated.
- **`menuId` is structurally obsolete**, and the evidence is unambiguous. In 1.x it held the id Chrome _generated_
  when the context-menu item was created (`background.coffee:2027-2032`), purely so a click could be mapped back to
  a template (`getTemplateWithMenuId`, `:332-335`, via `deriveMessageTempate`, `:1202`). It was runtime state, not
  user data — legacy itself stripped it before persisting an export (`options.coffee:1408`,
  `delete template.menuId for template in data.templates`). v2 does not need a stored mapping at all: it
  **derives** the menu item id from the template id (`context-menu.service.ts:125,144`, prefix +
  `template.id`) and parses it back on click (`:88-94`). There is nothing to migrate.

### §2.3 A skipped predefined template logged a misleading "Migrated" line — **fixed** (verified 2026-09-15)

The `debug('Migrated legacy predefined template', ...)` call sat _outside_ the `else`, so skipping a predefined
template that is no longer bundled emitted a warning immediately followed by a "Migrated" debug line whose payload
was `undefined`. Cosmetic, but actively misleading when reading a user's log.

It now sits inside the `else` (`template-data-migrator.ts:167-170`), fixed alongside BUG D. Note the regression
guard at `template-data-migrator.test.ts:682` only asserts the **warning**; nothing currently fails if the `debug`
call drifts back outside the `else`.

### §1.1 `migrate.html` rendered nothing and discarded every migration result — **fixed** (verified 2026-09-15)

The page ran the entire migration on load and then rendered an empty error boundary whose body was literally
`{/* TODO: Render App */}`. Both halves of the result — the step outcomes and the migration phase — were bound to
discard names and thrown away. The user upgrading from 1.x saw a blank tab, and a reload gave a **permanently**
blank tab, because `migrate()` rejects with `MIG409000` once a migration is complete and the rejection happened
_before_ `root.render()`, where no `ErrorBoundary` can reach it.

**The page now renders first and migrates only when asked.** `MigrateUi.init()` performs no `await` before
`root.render()`; `src/lib/ui/migrate/app/app.tsx` drives a small state machine over `loading` → `preview` →
`migrating` → `results`, with dedicated screens for "already migrated" (`MIG409000`), "opened without a version"
(`MIG404000`) and any other failure. `MIG409000` is now treated as the ordinary state of a reloaded tab rather
than as an error.

Four things came with it:

1. **A preview before anything is touched.** `MigrationPreview` renders `getRequiredMigrations()` — versions →
   namespaces → steps — behind an explicit "Start migration" button, alongside a backup of the raw legacy data via
   the new `DataMigrationManager.exportLegacyData()`. Several steps delete the legacy key once they have read it,
   so migrating before the user had even seen the page left no way back.
2. **Failure is derived from the step outcomes, not the namespace outcome.** `DataMigrationOutcome.Completed` only
   means the migrator _ran_. `MigrationResults` therefore reports failure when any namespace failed **or** any step
   failed, which is what stopped "every step failed" from being indistinguishable from a clean migration.
3. **Retry was unreachable, and is now a first-class action.** `migrate()` advances the phase to `Completed`
   whatever happened to the steps and then refuses to run again, so `removeLegacyData`'s documented "inspect the
   data, discard it, retry" workflow could never actually be completed. The new
   `DataMigrationService.resetMigrationPhase()` and `DataMigrationManager.retryMigration()` provide an **explicit**
   retry. The `Started` guard that protects a _refreshed_ tab from re-running destructive steps is untouched —
   only a deliberate click gets past it — and re-running is safe because every step re-checks `isRequired()`, so a
   step that already succeeded reports `Skipped`.
4. **The legacy data behind a failed step is shown**, with a "discard data and retry" action wired to
   `removeLegacyData()`.

`src/migrate.html` also still loaded `css/bootstrap.min.css` and had no `#root` element, so `createRoot` was being
handed `null`. The now-empty `src/scss/migrate.scss` was deleted.

Covered by `app.test.tsx`, `migration-preview.test.tsx`, `migration-results.test.tsx`,
`migration-step-list.test.tsx` and `migration-notice.test.tsx`, plus new `resetMigrationPhase`/`exportLegacyData`/
`retryMigration` suites in the data layer.

**Background-worker migration: closed, will not be done** (decided 2026-09-15). The migration deliberately runs in
the migrate page. An MV3 service worker is terminated aggressively when idle, so a tab the user is actively
watching is the _more_ durable host, not the less; progress reporting needs message passing either way; and the
only thing the worker would buy is surviving an accidental tab close, which the retry on `MigrationResults`
already covers. The rationale now lives as a comment at the old TODO site in `migrate-ui.tsx`.

**Still open, deliberately:** listing _all_ incomplete migrations with drilldown when the page is opened without a
`version` parameter. Not required for correctness; see §2.

### §1.5 Only users on exactly 1.2.9 were migrated — **fixed** (verified 2026-09-15)

`DataMigrationService` treated `migrationVersions = new Set(['1.2.9'])` as _the set of previous versions we accept_,
and gated on it with an exact `has(version)` in `isMigrationRequired`, `getMigrationPhase` and
`advanceMigrationPhase`. Anyone updating directly from one of the **33 releases before 1.2.9** — which Chrome does
routinely for a browser that has sat idle — got no migration at all, silently: `extension-manager.ts:188` took the
plain `update()` path, no tab was opened, and their 1.x data was left untouched while v2 started from defaults.

**The registry never meant that.** Every step built by `DataMigrationStepBuilder` opts in with
`oldVersion === targetOldVersion`, and all 16 steps target `'1.2.9'`. So a migration version names **the last
version whose data format the migration consumes** — `'1.2.9'` means "the 1.x legacy format" — and it must never be
compared directly against a user's previous version.

Three defects followed from the confusion, and the fix had to address all of them together:

1. **The applicability filter was inverted.** `getRequiredMigrationVersions` kept candidates where
   `compareVersions(candidate, version) <= 0`, justified as "data written by a later version cannot exist yet".
   Backwards for a legacy-consuming migration: a 1.2.5 user wrote data in exactly the format the `'1.2.9'`
   migration reads. Now `>= 0`.
2. **Phases were gated on the registry.** They track the progress of _this user's_ upgrade and are keyed on the
   version they came from, which is generally not a migration version. The gates are gone;
   `isMigrationRequired` now asks whether any migration version applies and whether the phase is already
   `Completed`. `getMigrationPhase` can no longer return `undefined`, so its return type was narrowed.
3. **`migrate()` passed the user's version into the migration context**, while `getRequiredMigrations` correctly
   iterated the required migration versions. Fixing only 1 and 2 would therefore have been **worse than the bug** —
   verified with a probe: a 1.2.8 user with real legacy YOURLS data present yields **0 required steps and 3 skipped
   steps**, so the migration would have run, touched nothing, and still advanced the phase to `Completed`, meaning
   it was never retried. `migrate()` now drives the context from the migration versions, matching the preview the
   migrate UI shows.

Guards: `data-migration.service.test.ts` covers earlier-1.x admission (down to `0.0.2`), the mirror case that a
2.0.0 user is excluded, and ungated phase tracking; `data-migration-manager.test.ts` pins that the context carries
the migration version and that an earlier-1.x user migrates rather than getting `MIG409000`. Reverting the filter
fails 8 tests; reverting the context version fails 1.

Note the tests previously **encoded the inverted rule as correct**, with a comment rationalising it — the third
time a characterization test has canonised a defect here (after `OAuthService`'s synchronous throws and the
`isInjectableUrl` pathname bug). Worth re-reading the justification comment whenever a test like that is in the way
of a fix.

### §1.1a `migrate.html` could not resolve its container — **fixed** (verified 2026-09-15)

`migrate-ui.config.ts` bound `TemplateDataMigrator` as a `DataMigrator`, and that migrator injects
`TemplateIdGeneratorToken` (`src/lib/template/data/template-data-migrator.ts:38`) — but the container **never bound
it**. The options, popup, any-content and background-worker containers all did; this one alone was missed.

Because `inversify` resolves lazily, neither `tsc` nor any other unit test could see it. At runtime
`container.get(UiToken)` (`src/lib/ui/migrate/index.ts:6`) threw at module scope, so `MigrateUi` was never
constructed and `init()` was never reached — **the migration never ran at all**. The rest of §1.1 describes the
page running the migration and then rendering nothing; in reality nothing ran. Since 1.x users reach 2.0.0
exclusively through this page, the entire upgrade path was broken, not merely unreported.

Fixed by adding `container.bind(TemplateIdGeneratorToken).to(TemplateIdGenerator);`.

Found by `src/lib/ui/migrate/migrate-ui.config.test.ts` on its very first run — one of nine new DI container
resolution specs, each resolving the single entry token its `index.ts` resolves so that the whole transitive
injection graph is built. That test is now a regression guard, verified to fail when the binding is removed.

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
text did reach the clipboard) and is logged. The sibling case - an action click that fails _before_ reaching the
engine - was the "action click failures are invisible to the user" item in §3.1, now closed below.

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
- `getErrorDetail()` moved out of `settings-dialog.tsx` into shared `use-error-detail.ts` hook.
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

Residual follow-ups (startup re-application, user-facing failure feedback) were tracked in §3.1 and are now
closed - see "§3.1 correctness defects" below.

### Related fixes landed at the same time

- `ExtensionManager` now awaits content-script injection and uses `allFulfilled`, so injection/install
  failures are no longer swallowed (`src/lib/common/extension-manager.ts:62,146-158`).
- `src/lib/template/context/entry/index.ts:118-138` replaces the vague `TODO: Complete` with an explicit
  inventory of the missing legacy context entries.
- `package.json` gained `type:check`, `check` and `dev` scripts; `pnpm check`
  (`tsc` + `oxlint` + `oxfmt --check`) passes cleanly on the current tree.

### §2.6/§2.7 Six `select`/`xpath` entries were declared as collections — **fixed** (verified 2026-09-16)

`selectAll`, `selectAllHtml`, `selectAllMarkdown`, `xpathAll`, `xpathAllHtml` and `xpathAllMarkdown` all declare a
`Collection` category with `dataType: Array` (`src/lib/template/context/entry/select-all.ts` and siblings), so the
guide advertises them as iterable. They are built by `createSelectOrXpathAllRenderer`
(`src/lib/template/context/entry/select-xpath.utils.ts:29-37`), which wraps `createTrimmedContentRenderer` — a
**section lambda**, whose body is consumed as the selector expression.

**In 1.x they were operations returning a single newline-joined string, and that is what they still are.**
`getCallback` (`src/lib/background.coffee:435-441`) built a section lambda per tag that rendered and trimmed its
body into an expression, and the result was resolved through a two-pass placeholder scheme. The joining is
explicit at `src/lib/background.coffee:1237-1239`:

```coffee
result or= ''
result   = result.join '\n' if _.isArray result
result   = toMarkdown result if convertTo is 'markdown'
```

So there was never a collection, never any iteration, and the separator was a newline. The `Collection` category
is a 2.0 mis-declaration of an entry whose implementation never changed shape.

**The two forms are mutually exclusive in this engine**, so the declaration cannot simply be honoured. Verified
against `tmplat-mustache` directly:

| context value                       | `{x}`             | `{#x}[{.}]{/x}` |
| ----------------------------------- | ----------------- | --------------- |
| plain array                         | `a,b,c`           | `[a][b][c]`     |
| **value** lambda returning an array | `a,b,c`           | `[a][b][c]`     |
| **section** lambda returning array  | _renderer source_ | `a,b,c`         |
| section lambda returning a string   | _renderer source_ | `a\nb\nc`       |

An array is perfectly iterable — but only from a _value_ lambda. A section lambda's return is stringified and
never iterated, because the body has already been spent carrying the selector. An entry cannot both take a
selector from its section body and template its own results.

The mechanism is worth stating precisely, because the `{#x}[{.}]{/x}` column above is easy to misread as partial
iteration. A section lambda is handed its body **raw and unrendered** — verified: the lambda receives the literal
string `"[{dot}]"`, not `"[DOT]"` — and rendering it is the lambda's own choice, which is exactly what
`manager.renderTrim(text, render)` does. So `[{.}]` is rendered **in the surrounding context and then used as the
CSS selector**; the returned array is appended verbatim afterwards and the body never touches it. The `[...]` in
that column is therefore absent from the output by construction, not merely unapplied.

That also makes `{#selectAll}[{.}]{/selectAll}` actively harmful rather than merely useless: `{.}` at the top
level resolves to the **view object itself**, which stringifies to a comma-join of every context value — including
lambda sources. The probe produced a selector of
`[DOT,() => async (text, render) => { … }]`, i.e. the §1.3 leak spliced into a CSS selector.

Three consequences today:

1. **The advertised iteration is unreachable**, and `{#selectAll}div.item{/selectAll}` renders `one,two,three`.
2. **The separator silently changed from `\n` to `,`** between 1.x and 2.0, because nothing joins any more and
   Mustache falls back to `Array#toString`. Any 1.x template using these tags produces different output after
   migration. The Markdown variants changed twice over: 1.x joined the raw HTML and converted **once**, whereas
   `createSelectOrXpathAllMarkdownRenderer` converts each fragment separately and then comma-joins.
3. **Any template that follows the guide's own advice gets a corrupted selector**, per the `{.}` case above.

A bare `{selectAll}` also rendered `async (text, render) => mapper(await manager.renderTrim(text, render), manager)`
— the §1.3 leak. Re-declaring these six as operations brought them inside §1.3's scope, so that fix covers them
automatically; while they were declared as collections, a category-scoped fix would have missed them.

**Fix applied (2026-09-16):**

1. All six re-declared as `Operation` with `inputDataType`/`outputDataType` of `String`, and the six
   `context_*_collection_description` message keys renamed to `*_operation_description` and reworded imperatively
   to match their operation siblings ("Get the ..., separated by new lines"). Note the legacy guide already listed
   them under `opt_guide_operations_*`, which corroborates the category.
2. `createSelectOrXpathAllRenderer` and `createSelectOrXpathAllMarkdownRenderer` now join with a new
   `MULTI_RESULT_SEPARATOR` of `'\n'` rather than leaving the separator to `Array#toString`, restoring 1.x output.

**§2.7 fixed at the same time.** The Markdown variants had also diverged twice over: 1.x joined the raw HTML and
converted **once**, whereas they converted each fragment separately and then joined. That only shows up where
conversion is not context-free — most visibly with the default `inline: false`, which collects reference-style link
definitions per conversion, so N matches emitted N separate numbered blocks instead of one continuous block at the
end. `createSelectOrXpathAllMarkdownRenderer` now joins the HTML before converting, restoring 1.x parity, and
`TemplateContextManager.convertAllToMarkdown()` was deleted along with its three tests, having been left with no
production caller.

Regression guards in `src/lib/template/context/entry/contract.test.ts` under "multi-result operations" (new-line
joining, and that the section body is consumed as the expression) and in `async-collaborator.test.ts`. The
whole-category bare-reference leak assertion now covers these six automatically, which is the §1.3 scope point
above.

**Mutation-verified 5/5:** separator reverted to `','` (7 failures), the Markdown variant returning an array
again (2), `selectAll` re-declared as a `Collection` (2), per-fragment Markdown conversion restored (1), and the
Markdown variant joining with `','` before converting (3).

### `src/scss` and the last standalone stylesheet — **removed** (verified 2026-09-16)

`src/scss/popup.scss` was the only file left in `src/scss` after `migrate.scss` went (§1.1 above). It compiled to
`dist/temp/css/popup.css`, which was referenced by exactly one page — `src/popup.legacy.html` — and that page is
unreachable: `manifest.json` points `default_popup` at `popup.html`, nothing links to the `.legacy` pages, and they
only reach `dist` because `staticAssetsPlugin` copies every `src/*.html`. The stylesheet was also inapplicable on
its own terms: every selector (`#templates`, `#loading .bar`, `.divider`, `[class^='icon-']`) targets the legacy
Backbone/Bootstrap markup, it references the Bootstrap sprite at `../img/glyphicons-halflings-white.png`, and the
page loads `css/bootstrap.min.css` from the long-deleted `src/vendor/`. `popup.legacy.html` even loads the _new_
`lib/ui/popup.js` bundle into a page with no `#root`, so it was already broken end to end.

`src/scss/` was deleted along with the two `src/scss` blocks in `rolldown.config.mjs` (the `buildStart` watch loop
and step 3 of `staticAssetsPlugin`). **`scssPlugin()` stays** — it is the `transform` hook that compiles and injects
the colocated component stylesheets imported from `src/lib/ui/**/*.tsx`, which are unaffected. Removing the
`.legacy.html` pages themselves remains the separate cleanup tracked in §5.

### Legacy CoffeeScript, `.legacy.html` pages and their i18n keys — **removed** (verified 2026-09-16)

The larger cleanup deferred by the analytics entry above. Deleted:

- `src/lib/background.coffee`, `content.coffee`, `options.coffee`, `popup.coffee`, `utils.coffee`
- `src/options.legacy.html`, `src/popup.legacy.html`
- 335 legacy-only keys in `src/_locales/en/messages.json` (936 → 601): all 323 `opt_*` keys, including the three
  `opt_analytics_*` keys the analytics removal deliberately left behind, plus 12 without that prefix
  (`error_file_*`, `error_import_*`, `result_bad_*`, `shortener_config_error`, `shortener_detailed_error`) that
  were referenced only from `options.coffee`/`background.coffee`

Nothing built or loaded any of it. No `.coffee` file is a rolldown entry (`entries` lists only `.ts`), CoffeeScript
is not a dependency and there is no compiler in the toolchain, so those five files had been inert text since the
Grunt build was dropped. The two `.legacy.html` pages reached `dist` only because `staticAssetsPlugin` copies every
`src/*.html`; `manifest.json` points `default_popup`/`options_ui.page` at `popup.html`/`options.html`, and both
legacy pages still linked `css/bootstrap.min.css` from the long-deleted `src/vendor/`.

**The i18n deletion is the part with teeth, and it is machine-checked.** `locales-plugin` regenerates
`src/lib/common/intl/intl-message-key.ts` as a union of the keys actually present in `_locales`, and every
`IntlMessageKey` consumer is typed against it — so a key removed while still referenced fails `tsc`. The `opt_*`
prefix had zero references outside the deleted files (the new UI uses its own key namespaces), which is why the
whole prefix could go in one move.

Prefix alone is not a sufficient test, though — the last 12 keys had legacy-only call sites but new-looking names.
The sweep that found them resolves the three runtime-constructed key families to their concrete values before
calling anything unused, because grep cannot see those references: `data_namespace_${DataNamespace}`
(`data-migrator.ts:36`), `url_shortener_name_${UrlShortenerProviderName}` (`url-shortener.provider.ts:73`,
`url-shortener.service.ts:49`) and `xerr_${code.toLowerCase()}` (`extension-error.ts:115`). All four provider
names and all eight namespaces are live, and all 33 `ExtensionErrorCode` values are referenced from source, so
every key in those families is genuinely reachable. Note `ExtensionErrorCode` is itself generated _from_ the
`xerr_*` keys, so deleting one silently deletes a code — the useful check there is the reverse one, whether each
code is used.

**`src/_locales/en/messages.json` now has no unused entries**: 601 keys, each either referenced literally or
reachable through one of those three families.

Also dropped the now-meaningless `src/vendor/**` entry from `ignorePatterns` in `.oxlintrc.json` and `.oxfmtrc.json`.

`src/lib/declarations.d.ts` needed no change — its ambient declarations for the untyped vendored scripts had
already been removed; what remains is stylesheet modules, the `process.env` build shim and the `browser` alias.

§6 keeps the legacy options page inventory: with the markup gone, that table plus git history is the only record
of the 1.x element ids and settings keys. Verified with `check` (type check, e2e type check, lint, format),
1993 unit tests across 119 files, and a clean `build`.
