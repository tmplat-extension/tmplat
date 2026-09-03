# Migration Gaps: legacy CoffeeScript → new TypeScript

Snapshot of the functional differences between the legacy `src/lib/*.coffee` implementation and the new
TypeScript implementation under `src/lib/**`. **UI/React concerns are deliberately excluded**, with the single
exception of §7, which inventories the legacy options page settings so that no user-facing preference is lost
silently.

All items were verified by reading both implementations; file/line references are given as evidence.
Resolved items are moved to §9 rather than deleted, so the document doubles as a migration log.

_Last verified: 2026-09-03._

---

## 1. Blockers (break core functionality today)

### 1.1 Predefined template `PREDEFINED.00007` references a non-existent context entry

- `src/lib/template/predefined-templates.ts:49` — content is `{selectionMarkdown}`.
- `selectionMarkdown` is **not** in `templateContextEntriesDefinitions`
  (`src/lib/template/context/entry/index.ts:120-201`).
- Mustache renders the unknown name as an empty string, so
  `TemplateEngine.compile()` throws `TemplateExecutionFailEmptyDescription`
  (`src/lib/template/template-engine.ts:75-80`).
- Result: the "Selection in Markdown" predefined template always fails.

### 1.2 Context-menu auto-paste (`menuPaste`) is not implemented

- `contextMenu.autoPasteEnabled` is stored, migrated, surfaced on `TemplateContextMenuInfo`
  (`src/lib/template/template.service.ts:51`) and exposed to templates
  (`src/lib/template/context/template-context.utils.ts:31`).
- `ContextMenuService.onClicked()` (`src/lib/context-menu/context-menu.service.ts:77-107`) only calls
  `templateEngine.execute()`; it never sends a paste message.
- Only the keyboard-shortcut path implements auto-paste
  (`src/lib/tab/event/shortcut-event-listener.ts:59,72-74,113-126`).
- There is also no `MessageType.Paste` (`src/lib/common/message/message-type.enum.ts`) and no content-side
  paste listener, so the background cannot ask a tab to paste.

### 1.3 `GetTabContent` (CSS selector / XPath evaluation) is dead code

- The content-side listener exists and is bound
  (`src/lib/content/any-content/any-content.config.ts:44`, `get-tab-content-message-listener.ts`).
- **No caller exists.** grep for `MessageType.GetTabContent` outside the listener returns only the enum
  declaration, and no template context entry uses it.
- Result: legacy `select`, `selectAll`, `xpath`, `xpathAll` (and their `*Html` / `*Markdown` variants) are
  unreachable.

---

## 2. Missing template context entries — **implemented** (verified 2026-09-04, see §9)

All gaps identified below have been closed except `popular` (intentionally dropped, §9) and `template`/
`originalSource` (would need deep template-engine internals access, deferred). See
§9 "Missing template context entries" for the full implementation write-up.

### 2.1 Page/selection content — data is fetched but not exposed

`TabContext` (`src/lib/tab/tab.model.ts:6-41`) already carries `links`, `scripts`, `styleSheets`, `meta`,
`referrer`, `storage`, and `selection` (`html`, `text`, `links`, `images`), yet there are **no entries** for:

| Legacy                                                | Status                                                            |
| ----------------------------------------------------- | ----------------------------------------------------------------- |
| `selection`, `selectionHTML`, `selectionMarkdown`     | missing (data available in `TabContext.selection`)                |
| `selectedLinks`, `selectedImages`                     | missing (data available)                                          |
| `links`, `scripts`, `styleSheets`                     | missing (data available) — only `images`/`keywords` have entries  |
| `text`, `markdown`                                    | missing (`html` entry exists)                                     |
| `meta` (operation)                                    | missing (data available in `TabContext.meta`)                     |
| `referrer`                                            | missing (data available)                                          |
| Web Storage objects (`localStorage`/`sessionStorage`) | missing (data available in `TabContext.storage`)                  |
| `linkHTML`, `linkText`, `linkMarkdown`                | missing; see `src/lib/tab/event/context-menu-event-listener.ts:8` |

These are the cheapest gaps to close — the plumbing is done, only entry definitions are missing.

### 2.2 Markdown conversion is entirely absent

There is no HTML→Markdown converter in the new codebase (legacy used `md.min.js` / html.md, still vendored at
`src/vendor/md.min.js`). This blocks `markdown`, `selectionMarkdown`, `linkMarkdown`, `select*Markdown`,
`xpath*Markdown` and the `markdown.inline` option, which is otherwise migrated
(`src/lib/template/context/template-context.utils.ts:38-40`).

### 2.3 Other missing variables

`plugins`, `coords` (geolocation — note `geolocation` permission is still requested in
`src/manifest.json:50`), `locale`, `offline`, `os`, `screenWidth`, `screenHeight`, `tabs`,
`popular`, `template` (the currently-executing template object), `originalSource`.

`count`/`customCount` survive as deprecated aliases of `templateCount`/`templateCustomCount`
(`src/lib/template/context/entry/index.ts:186-187`), but `popular` has no equivalent because the legacy
`stats` namespace is intentionally dropped.

### 2.4 Flat deprecated option variables were dropped in favour of `options.*`

New code exposes settings only via the `options` object
(`src/lib/template/context/entry/options.ts`, `template-context.utils.ts:15-67`). Some legacy flat names kept
deprecated aliases (`menu`, `contextMenu`, `linksTarget`, `linksTitle`, `bitly`, `googl`, …) but these did not:

`notifications`, `notificationDuration`, `menuOptions`, `menuPaste`, `shortcuts`, `shortcutsPaste`,
`toolbarClose`, `toolbarPopup`, `toolbarOptions`, `toolbarKey`, `toolbarStyle`, `toolbarFeature`,
`toolbarFeatureName`, `toolbarFeatureDetails`, `markdownInline`, `yourls`, `yourlsAuthentication`,
`yourlsUrl`, `yourlsUsername`, `yourlsPassword`, `yourlsSignature`.

Existing user templates using any of these will silently render empty. Either add deprecated aliases or
document the break.

### 2.5 Semantic changes to surviving entries

- `capitalize`: legacy `utils.capitalize` title-cased **every** word; the new entry uses `lodash.capitalize`
  (first letter only). `startCase` is the closer equivalent. The `capitalise` alias
  (`entry/index.ts:128`) therefore changes behaviour rather than preserving it.
- `dateTime` / `lastModified`: date-ext format tokens → Luxon `toFormat` tokens
  (`src/lib/template/context/entry/date-time.ts`). Format strings in existing templates will not carry over.
- URL parsing moved from purl.js (`$.url`) to native `URL`/`URLSearchParams`
  (`src/lib/template/context/template-context-manager.ts:80-92`), with different edge-case behaviour.
- `encode`/`decode` are now aliases of `encodeUriComponent`/`decodeUriComponent`, and base64 variants are new.

---

## 3. Content script gaps

- **No paste message handler.** See 1.2. Legacy content.coffee handled `{type: 'paste'}`.
- **Relative→absolute URL normalisation not performed** when extracting links/images from a selection.
  Legacy forced resolution via `href.href = href.href`; the new mapper does not, and the code says so:
  `src/lib/tab/message/get-tab-context-message-listener.ts:107` (`TODO: Confirm URLs are absolute`).
- **`event.keyCode` is deprecated** and layout-dependent:
  `src/lib/tab/event/shortcut-event-listener.ts` (`String.fromCharCode(event.keyCode)`).
  `event.key`/`event.code` should be used. (Legacy had the same flaw; worth fixing during migration.)
- **Shortcut cache race**: `ShortcutEventListener.listen()` registers `keydown` immediately but populates
  `this.cache` asynchronously, so shortcuts pressed right after injection are ignored (fails silently).
- **Legacy extension-compatibility shims are gone** (IE Tab / Gecko Tab `SUPPORT` map in background.coffee).
  Probably intentional, but it is an unlisted behaviour drop.
- Correction to a common assumption: **clipboard copy is implemented** — the service worker copies via
  `ClipboardService` (`src/lib/common/clipboard/clipboard.service.ts`), which creates an offscreen document
  (`src/offscreen.html`), sends it a `MessageType.Copy` message and closes the document once the write has been
  acknowledged (`src/lib/common/clipboard/message/copy-message-listener.ts`). Copying no longer depends on an
  injected content script, so it also works on tabs where injection failed.

---

## 4. Background / MV3 gaps

- **No `commands` section** in `src/manifest.json`. Shortcuts remain page-level `keydown` handlers in the
  content script, meaning they still don't work on `chrome://` pages, the Web Store, PDFs, or when no tab has
  focus — and they can't be user-remapped via `chrome://extensions/shortcuts`. Consider `chrome.commands`.
- **Analytics is effectively unwired for the background.** `AnalyticsService` is only injected by the three UI
  entry points (`options-ui.tsx:43`, `popup-ui.tsx:44`, `migrate-ui.ts:36`). Legacy tracked
  `Templates/Used`, `Shorteners/Used`, `Requests/Processed`, etc. `AnalyticsService` isn't even bound in
  `src/lib/worker/background/background-worker.config.ts`. Existing TODOs:
  `src/lib/url-shortener/url-shortener.service.ts:52`, `src/lib/oauth/oauth.service.ts:13`.
  Note also that the service still posts to the **legacy UA endpoint** `google-analytics.com/collect` with a
  `UA-` property (`src/lib/analytics/analytics.service.ts`), which Google has shut down — this needs GA4
  Measurement Protocol.
- **No per-template usage statistics.** Legacy maintained `stats` (`count`, `customCount`, `popular`) and a
  per-template `usage` counter; the new `TemplateData` model has no `usage` field, which is also why the
  `popular` context entry cannot be restored as-is.
- **No progress/"please wait" state.** Legacy `updateProgress()` drove the popup's progress bar.
- **Context menu contexts are unrestricted**: `contexts: ['all']`
  (`src/lib/context-menu/context-menu.service.ts:116-117`, with a TODO). Legacy was more selective.
- **Action state is not re-applied on browser startup.** `ActionService.update()` (which calls
  `chrome.action.setPopup`) is only invoked from `ExtensionManager.install()` / `update()` / `reload()`
  (`src/lib/common/extension-manager.ts:65,96,133`), i.e. on `chrome.runtime.onInstalled`. There is no
  `chrome.runtime.onStartup` listener anywhere in `src/lib` (verified by grep). Because `setPopup` state is
  session state rather than manifest state, `default_popup: "popup.html"` (`src/manifest.json:17-23`) is
  likely to be restored on browser restart, silently reverting users from
  `TemplateActionMode.Template` back to the popup. Worth confirming against a real profile and, if
  reproduced, calling `actionService.update()` from `ExtensionManager.run()` and/or an `onStartup` handler.
- **Action click failures are silent to the user.** If the configured default template is missing or disabled,
  `ActionService.onClicked()` throws (`src/lib/common/action/action.service.ts:54-56`) and the rejection is
  only written to the log (`action.service.ts:29-31`). Legacy surfaced a desktop notification. Note also that
  `createTemplateActionInfo()` deliberately maps a _disabled_ template to `undefined`
  (`src/lib/template/template.service.ts:56`), so a disabled template produces the misleading
  `Template could not be found` message.
- Correction: **the toolbar/action default-template mode is now implemented.** See §9.
- Correction: context menu wiring **is** hooked up — `ExtensionManager.run()` calls
  `contextMenuService.listen()` (`src/lib/common/extension-manager.ts:97`) and `update()` on
  install/update/reload (lines 63, 91, 126), plus a change listener
  (`context-menu.service.ts:40-44`). Listener registration happens synchronously before any `await`, so it is
  MV3-safe.

---

## 5. URL shortener / OAuth

- **`goo.gl` correctly dropped** (service is dead). Deprecated `googl` / `googlAccount` / `googlOAuth`
  context entries remain as stubs, and the migrators discard the old data — good.
- **Hardcoded credentials** (pre-existing in legacy too, but worth revisiting):
  - `src/lib/oauth/provider/bitly-oauth.provider.ts:30-31` — Bitly `client_id` **and `client_secret`**.
  - `src/lib/url-shortener/provider/bitly-url-shortener.provider.ts:55` — hardcoded fallback access token for
    anonymous use.
- **No token refresh/expiry handling** in `src/lib/oauth/provider/oauth.provider.ts`; a revoked or expired
  Bitly token will just produce repeated failures.
- **YOURLS parity is good**: both `Advanced` (signature) and `Basic` (username/password) modes are preserved
  (`yourls-authentication-mode.enum.ts`, `yourls-url-shortener.provider.ts:12-25,45-59`), and the `tmpl.at`
  custom Bitly domain is retained (`bitly-url-shortener.provider.ts:48`).
- **Errors are not localised** — ~20 `TODO: Localise error message and use ExtensionError instead` across
  `url-shortener/`, `oauth/`, `template/`, `common/data/`. Legacy raised localised `AppError`s that surfaced in
  notifications; today the user gets the generic
  `TemplateExecutionFailGeneralDescription` fallback (`template-engine.ts:61-64`).

---

## 6. Data / migration

The overall design is sound: `DataMigrationService.initiateMigration()` opens `migrate.html`
(`src/lib/common/data/migration/data-migration.service.ts:69-78`), an extension **page** which does have
`localStorage`, and `LegacyDataService` reads it there (`src/lib/common/data/legacy-data.service.ts:8`,
`DomDataStorage.forLocal()` at `data-storage.ts:343-344`). Migrators are only bound in
`src/lib/ui/migrate/migrate-ui.config.ts`, not in the service worker — correct for MV3.

Remaining gaps:

- **Template ordering is lost.** Legacy templates have an `index`; there is an explicit
  `TODO: Sort templates based on legacyTemplates ordering`
  (`src/lib/template/data/template-data-migrator.ts:183`).
- **`image` (template icon), `usage` and `menuId` fields are dropped** with no replacement in
  `src/lib/template/data/template-data.model.ts`.
- **Silent skips during migration**: several `TODO: LOG` markers
  (`template-data-migrator.ts:160,170,174,179`) mean a user can lose templates with no explanation.
- **Log level mapping is acknowledged as confusing**
  (`src/lib/common/logging/data/logging-data-migrator.ts:38,51`).
- **YOURLS credentials are now base64-encoded at rest**
  (`url-shortener-data-migrator.ts`, decoded again in `template-context.utils.ts:59-61`). This is obfuscation,
  not encryption, and it is an undocumented format change — worth a changelog entry.
- **Import/export compatibility**: a dedicated transfer model now exists
  (`src/lib/template/template-transfer.model.ts` / `.schema.ts`, §7.2), but it is a _new_ base64-wrapped format.
  Legacy v1.2.x export files (a bare array carrying `key`, `image`, `index`, `usage` and `readOnly`) are
  tolerated rather than supported: the bare-array shape is accepted and `title`/`content`/`shortcut`/`enabled`
  survive, while `image`, `index` and `usage` are silently dropped and every entry — predefined or not —
  becomes a new user-defined template. Worth a changelog entry.
- **Migration only triggers for `V1_2_9`** (`data-migration.service.ts:22`). Users on any earlier 1.x release
  who update directly will not be migrated.

---

## 7. Legacy options page settings inventory

Exception to the "no UI" rule: this section is the authoritative checklist of everything that was configurable
on the legacy options page (`src/options.legacy.html`, wired up by `src/lib/options.coffee`), mapped to its new
storage model and its new UI status.

Every legacy settings category is now implemented. The settings dialog
(`src/lib/ui/options/component/settings-dialog/settings-dialog.tsx`) renders a real page per navigation entry,
loads on open, tracks dirty state and offers `Reset`/`Apply`/`Save`. It is backed by `SettingsService`
(`src/lib/common/settings/settings.service.ts`), which aggregates the five namespaces that own settings
(analytics, logging, notification, template, URL shortener), transparently base64-decodes/encodes the YOURLS
credentials, and is exposed to React through `SettingsContext`
(`src/lib/common/settings/settings.context.ts`). The guide (§7.4) is also implemented, generated from the
template context entry definitions, and template management (§7.2) — editor, bulk actions, reordering, search
and base64 import/export — has now landed too, so **the options page has no outstanding legacy capability
gaps**; what remains are the data-model gaps tracked in §6 (notably `image` and migration ordering). All new UI
strings are still hard-coded English with `TODO: i18n` markers, matching the rest of the new UI, except the
guide entry descriptions, which resolve through `IntlService`.

### 7.1 General tab

| Legacy control (id)                                   | Legacy key              | New storage                                                                                            | New UI                                                                        |
| ----------------------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| Desktop notifications (`#notifications`)              | `notifications.enabled` | `src/lib/common/notification/data/notification-data.model.ts:3-6`                                      | `notification-settings.tsx`                                                   |
| Toolbar behaviour popup vs template (`#toolbarPopup`) | `toolbar.popup`         | `TemplateDataAction.mode` (`src/lib/template/data/template-data.model.ts:14-23`), `TemplateActionMode` | `general-settings.tsx`                                                        |
| Default toolbar template (`#toolbarKey`)              | `toolbar.key`           | `TemplateDataAction.templateId` (`template-data.model.ts:17`)                                          | `general-settings.tsx`                                                        |
| Close popup after use (`#toolbarClose`)               | `toolbar.close`         | `TemplateDataAction.autoCloseEnabled` (`template-data.model.ts:21`)                                    | `general-settings.tsx`                                                        |
| Options link in popup (`#toolbarOptions`)             | `toolbar.options`       | `TemplateDataAction.optionLinkEnabled` (`template-data.model.ts:22`)                                   | `general-settings.tsx`                                                        |
| Context menu enabled (`#menuEnabled`)                 | `menu.enabled`          | `TemplateDataContextMenu` (`template-data.model.ts:26-31`), `TemplateContextMenuMode`                  | `general-settings.tsx`                                                        |
| Options item in context menu (`#menuOptions`)         | `menu.options`          | `TemplateDataContextMenu.optionLinkEnabled` (`template-data.model.ts:30`)                              | `general-settings.tsx`                                                        |
| Context-menu auto-paste (`#menuPaste`)                | `menu.paste`            | `TemplateDataContextMenu.autoPasteEnabled` (`template-data.model.ts:27`)                               | `general-settings.tsx`; **still has no runtime effect — see 1.2**             |
| Shortcuts enabled (`#shortcutsEnabled`)               | `shortcuts.enabled`     | `TemplateDataShortcuts` (`template-data.model.ts:42-45`)                                               | `general-settings.tsx`                                                        |
| Shortcut auto-paste (`#shortcutsPaste`)               | `shortcuts.paste`       | `TemplateDataShortcuts.autoPasteEnabled` (`template-data.model.ts:43`)                                 | `general-settings.tsx`                                                        |
| Link `title` attribute (`#linksTitle`)                | `links.title`           | `TemplateDataLink.title` (`template-data.model.ts:35`)                                                 | `general-settings.tsx`                                                        |
| Link `target` attribute (`#linksTarget`)              | `links.target`          | `TemplateDataLink.target` (`template-data.model.ts:34`)                                                | `general-settings.tsx`                                                        |
| Inline Markdown links (`#markdownInline`)             | `markdown.inline`       | `TemplateDataMarkdown.inline` (`template-data.model.ts:39`)                                            | `general-settings.tsx`; Markdown conversion itself is still missing — see 2.2 |
| Analytics opt-in (`#analytics`)                       | `analytics`             | `src/lib/analytics/data/analytics-data.model.ts:1-4` + migrator                                        | `analytics-settings.tsx`; see also §4 (unwired/UA endpoint)                   |

Two settings with no legacy equivalent are also surfaced: the context menu mode (`TemplateContextMenuMode.Menu`
vs `Template`) in `general-settings.tsx`, and the change log scope (§7.5).

### 7.2 Templates tab

Implemented by `src/lib/ui/options/component/template-data-grid/template-data-grid.tsx`, which now owns a
toolbar (`Add`/`Import`/`Export` plus `Enable`/`Disable`/`Delete` for the current selection) above the grid and
delegates to four new dialogs: `TemplateEditorDialog`, `TemplateImportDialog`, `TemplateExportDialog` and the
shared `ConfirmDialog`. Legacy capability mapping:

| Legacy capability                                                                    | Status in new grid                                                                                                                             |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| List templates, toggle enabled, edit, delete                                         | implemented; the row action now toggles via `setTemplatesEnabled()` and delete really deletes (behind a confirmation)                          |
| Add template (`#add_btn`) / template wizard                                          | implemented — `template-editor-dialog.tsx`, also opened by double-clicking a row                                                               |
| Wizard fields: title (max 32), icon/image, shortcut key + modifier, enabled, content | title/description/shortcut/enabled/content implemented, with a shortcut column added to the grid; `image` is still dropped from the model (§6) |
| Predefined templates read-only (title/content disabled, delete blocked)              | implemented — see §7.2.1                                                                                                                       |
| Filter select + search (`#template_filter`, `#template_query`)                       | search implemented — the app bar input is lifted into `App` and filters on title, description, content and shortcut                            |
| Drag-to-reorder (`index`)                                                            | replaced by `Move up`/`Move down` row actions backed by `TemplateService.moveTemplate()`; ordering is still lost during migration (§6)         |
| Bulk enable / disable / delete                                                       | implemented, including inversion of the grid's "select all" (exclude) selection model                                                          |
| Import wizard (paste JSON or file, select subset)                                    | implemented — `template-import-dialog.tsx`; parse-then-select, base64 in                                                                       |
| Export wizard (copy to clipboard or save `templates.json`)                           | implemented — `template-export-dialog.tsx`; base64 out, copy or download                                                                       |
| Pagination                                                                           | present (DataGrid, 10/20/50)                                                                                                                   |

Behavioural notes:

- **Import/export is base64-encoded.** `TemplateService.exportTemplates()` serializes a `TemplateTransfer`
  (`src/lib/template/template-transfer.model.ts`) and base64-encodes it; `parseTemplates()` reverses that and
  validates against `templateTransferSchema` before anything is written. Because template content is arbitrary
  Unicode, `encodeBase64Utf8()`/`decodeBase64Utf8()` were added alongside the existing Latin-1-only helpers in
  `src/lib/common/codec/base64.utils.ts` (which the YOURLS credentials continue to use).
- The transfer format carries no `id` or `predefined` flag, so every import creates a **new user-defined**
  template and nothing is ever overwritten. Predefined templates can still be exported: they are projected
  using their resolved (localised) title and description, making them a usable starting point for a copy.
- Raw JSON and a bare array of templates are also accepted on import so that hand-written documents are not
  rejected; only the export path is guaranteed to be base64.
- Shortcuts are kept unique — `createTemplates()` discards any shortcut already in use, and the editor
  validates against the rest of the collection before saving.

#### 7.2.1 Template field mutability (legacy behaviour to reproduce)

The legacy wizard (`#template_wizard` in `src/options.legacy.html`, driven by `openWizard()`/`resetWizard()`/
`deriveTemplate()` in `src/lib/options.coffee`) exposed exactly five inputs — `#template_title`,
`#template_content`, `#template_shortcut`, `#template_image`, `#template_enabled`. Everything else on the
legacy template object (`key`, `index`, `usage`, `readOnly`, `menuId`) was assigned by the code and never
user-editable: `key` came from `utils.keyGen()` and `index` from `templates.length` on save, while
`deriveTemplate()` carried `key`/`index`/`usage`/`readOnly` over verbatim when editing.

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

Predefined immutability was enforced in `resetWizard()` via
`$('#template_content, #template_title').prop 'disabled', !!activeTemplate.readOnly`, with `#template_delete_btn`
given the `disabled` class and the `opt_template_no_predefined_delete_title` tooltip. It was also enforced
outside the wizard: `deleteTemplates()` skips `readOnly` entries, `refreshSelectButtons()` disables the bulk
delete button when any selected template is predefined, and `updateImportedTemplate()` refuses to overwrite the
`title`/`content` of a read-only template on import. Net effect: a predefined template could be re-keyed,
re-iconed or disabled, but never renamed, rewritten or removed.

The new data model already encodes most of this structurally, and the new editor honours it:
`TemplateDataTemplatePredefined` marks `content`, `titleKey` and `descriptionKey` as `readonly` while
`TemplateDataTemplateBase` leaves `enabled` and `shortcut` mutable, and `id` is `readonly` on both variants
(`src/lib/template/data/template-data.model.ts:47-67`). `TemplateEditorDialog` disables the title, description
and content fields for a predefined template (and explains why via an inline `Alert`), only ever sending
`{ enabled, shortcut }` to `TemplateService.updateTemplate()` for one; `TemplateService.removeTemplates()`
refuses to remove a predefined template, the row delete action is disabled for it, and the toolbar delete
button is disabled with a tooltip whenever the selection contains one. Differences to watch:

- Predefined titles/descriptions are `IntlMessageKey`s rather than strings, so the editor renders them through
  `TemplateService.getTemplateTitle()`/`getTemplateDescription()` and offers no text field for them.
- `description` is **new** for user-defined templates (nullable) and has no legacy counterpart; it has its own
  field in the editor and its own column in the grid.
- `image` no longer exists (§6), so there is no icon picker. `usage` no longer exists either, so there is no
  usage-based sorting.
- `index` no longer exists; order is simply the order of `TemplateData.templates`, which `moveTemplate()`
  rewrites. Migration still does not preserve the legacy `index` (§6), so imported-from-1.x ordering remains
  arbitrary until that is fixed.

### 7.3 URL Shorteners tab

Implemented by `src/lib/ui/options/component/url-shortener-settings/url-shortener-settings.tsx`:

- Active shortener radio (Bitly / YOURLS) — selecting one disables the other, since
  `UrlShortenerService.shorten()` picks the first enabled provider. goo.gl intentionally dropped (§5).
- Bitly account connect/disconnect, driven by `OAuthService` via the new `OAuthContext`
  (`src/lib/oauth/oauth.context.ts`); the connected account (`principal`) is displayed. Unlike legacy, nothing
  is persisted mid-flow: `OAuthService.requestAuthentication()` (new) runs the authorisation flow **without**
  storing anything, the resulting token is held in the dialog's settings state, and disconnecting simply clears
  it — both are only written on `Apply`/`Save`, like every other field on the page.
- YOURLS URL, authentication mode (None/Basic/Advanced), signature, username and password, with inline
  validation (`getUrlShortenerSettingsErrors()`) mirroring `YourlsUrlShortenerProvider.isDataValid()` and the
  Joi schema. `Save` is blocked while invalid, so schema violations can no longer reach storage.

### 7.4 Guide tab

The legacy page shipped five documentation panes (Introduction, Standard, Lists & Objects, Options,
Operations) enumerating every template placeholder and operation as hand-maintained HTML tables.

Implemented by `src/lib/ui/options/component/guide-dialog/guide-dialog.tsx`, which reuses the settings dialog
layout (full-screen dialog, responsive permanent/temporary drawer pair, page-per-navigation-entry). Unlike the
legacy page, the content is **generated from `templateContextEntriesDefinitions`** rather than declared
statically, so it cannot drift from the entries actually registered with `TemplateContextManager`:

- `guide.utils.ts` projects each definition into a `GuideEntry` per category it belongs to. An entry appearing
  in several categories (e.g. `datetime` is both Standard and Operation) is listed on each relevant page.
- Alias definitions (those with `aliasOf`) are skipped as rows and instead listed against the entry they alias,
  mirroring how the legacy guide combined them (e.g. "fragment/anchor").
- `deprecated` renders a chip, and `links` renders the category's external references.
- Types are rendered from the category metadata: `String` etc. for Standard, `Array<String>` /
  `Object<String>` for Collection, and `(String) → String` signatures for Operation.
- Descriptions come from `descriptionKey` via `IntlService`, so this page is already localised — unlike the
  rest of the new UI, whose chrome is still hard-coded English with `TODO: i18n` markers.

Only the Introduction pane is static (`guide-introduction.tsx`), as it documents the Mustache syntax itself
rather than any entry. Per-category examples are likewise hard-coded (`guide-examples.ts`), since they
illustrate shared syntax rather than individual entries.

Both document the **`tmplat-mustache` fork's syntax, not stock mustache.js**: tags use single curly braces
(`{name}`, `{#name}...{/name}`, `{^name}`, `{.}`, `{!...}`), values are **unescaped by default**, and it is
`{{name}}`/`{&name}` that HTML-escapes — the inverse of standard Mustache. Lookups are case-insensitive, and a
list or object referenced without a section renders comma-separated. This matters because stock syntax fails
_silently_: `{{#upper}}{{title}}{{/upper}}` returns the untransformed title rather than erroring. Every
documented example output has been verified against the engine.

The legacy "Options" pane is restored as a fifth page, but generated rather than hand-written. `options` no
longer claims to be an `Object<String>` (its values are nested objects); instead it declares a recursive
`properties` tree via `template-context-options-documentation.ts`, which the guide flattens into full
dot-notation paths (`options.templates.links.target`) — 22 options plus 12 groups. The descriptor's type is
derived from `TemplateContextOptions` itself, so an option added to `buildOptions()` but left undocumented (or
documented with the wrong type, or documented but non-existent) fails `type:check`. Credential options
(`options.urlShorteners.yourls.auth.*`, which `buildOptions()` base64-_decodes_ into plaintext) are flagged
`sensitive` and carry an explicit warning, and enum-backed options list their permitted values.

Remaining gap: object collections other than `options` still have no per-property documentation, though
`properties` is now generic, so they can adopt it whenever descriptions are written.

### 7.5 Tools modal

| Legacy control   | Legacy key       | New storage                                             | New UI                   |
| ---------------- | ---------------- | ------------------------------------------------------- | ------------------------ |
| `#loggerEnabled` | `logger.enabled` | `src/lib/common/logging/data/logging-data.model.ts:1-6` | `developer-settings.tsx` |
| `#loggerLevel`   | `logger.level`   | same, migrator at `logging-data-migrator.ts:38,51`      | `developer-settings.tsx` |

The legacy "Tools" modal is now a "Logging" entry in the settings dialog navigation. The notification page also
exposes the new change log settings (`NotificationDataChangeLog.enabled`/`scope`), which have no legacy
equivalent.

### 7.6 Not carried over by design

- PayPal donation form in the footer.
- goo.gl shortener (§5).

---

## 8. Suggested priority

1. Fix `PREDEFINED.00007` (1.1) — either implement Markdown support or change the predefined content.
2. Add the missing selection/link/list context entries (2.1) — data is already available.
3. Implement paste messaging so context-menu auto-paste works (1.2).
4. Either wire up `GetTabContent` to `select`/`xpath` entries or remove the dead code (1.3).
5. Confirm/fix the `chrome.action.setPopup` browser-restart behaviour (§4).
6. Preserve template order during migration and log skipped templates (6).
7. Decide on Markdown conversion library (2.2), then restore the `*Markdown` family.
8. Replace UA analytics with GA4 and call it from the worker (4).
9. Sweep the ~20 localisation TODOs so users see meaningful errors again (5), including the new template
   editor/import/export strings, which are hard-coded English.
10. Decide whether to reinstate the template `image` field (§6/§7.2.1) — the last legacy template capability
    with nowhere to live in the new model.

---

## 9. Recently resolved

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
  injecting it into `GetTabContextMessageListener` and adding a `linkTarget: {html, text} | undefined` field to
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

The Templates tab (§7.2) is no longer a stub. `TemplateDataGrid` gained a toolbar, a shortcut column, a
`Predefined` chip, free-text search and multi-select bulk actions, and four components were added beside it:

- `template-editor-dialog.tsx` — create/modify a template (title, description, shortcut, enabled, content) with
  inline validation (title required and capped at `TEMPLATE_TITLE_MAX_LENGTH`, content required, shortcut a
  single character that is not already assigned), dirty tracking via `lodash.isequal` and a disabled `Save`
  until it is both dirty and valid. Predefined templates open read-only apart from `shortcut`/`enabled`,
  matching §7.2.1.
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
- `getErrorMessage()` moved out of `settings-dialog.tsx` into shared `options-error.utils.ts`.
- Fixed the live bug where the grid's `deleteTemplate()` called `toggleTemplateEnabled()`.

Known limitations, tracked above: no icon picker (`image` is not in the model, §6), reordering is via
`Move up`/`Move down` rather than drag-and-drop (`@mui/x-data-grid` row reordering is a Pro feature), and all
strings are hard-coded English pending the i18n sweep.

### Options UI guide — **implemented** (verified 2026-09-03)

The legacy Guide tab (§7.4) is restored as `GuideDialog`
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

Every legacy settings category except Templates is now editable again (§7):

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
- `SettingsDialog` now loads settings on open, tracks dirty state with `lodash.isequal`, blocks `Apply`/`Save`
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

Residual follow-ups are tracked in §4 (startup re-application, user-facing failure feedback).

### Related fixes landed at the same time

- `ExtensionManager` now awaits content-script injection and uses `allFulfilled`, so injection/install
  failures are no longer swallowed (`src/lib/common/extension-manager.ts:62,146-158`).
- `src/lib/template/context/entry/index.ts:118-138` replaces the vague `TODO: Complete` with an explicit
  inventory of the missing legacy context entries.
- `package.json` gained `type:check`, `check` and `dev` scripts; `npm run check`
  (`tsc` + `oxlint` + `oxfmt --check`) passes cleanly on the current tree.
