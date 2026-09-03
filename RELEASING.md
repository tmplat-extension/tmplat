# Releasing

Releases are automated. Pushing a `vX.Y.Z` tag runs [.github/workflows/release.yml](.github/workflows/release.yml),
which verifies the tag, re-runs the whole CI suite against it, pulls the current translations from Crowdin, builds
the extension, uploads it to the Chrome Web Store as a **draft** and publishes a GitHub release.

Nothing reaches a user without a human: the `publish` job waits on the `release` GitHub environment, and the store
package is uploaded unpublished so the listing and review status can be checked by hand.

## Translations

[Crowdin](https://crowdin.com) holds the translations. The flow is one-directional in each place it runs, which is
what keeps the repository and Crowdin from fighting over the same files:

- **Upload (`main`)** — [.github/workflows/crowdin.yml](.github/workflows/crowdin.yml) pushes
  `src/_locales/en/messages.json` to Crowdin whenever it changes on `main`, so translators are always working
  against the current source strings.
- **Download (release)** — the release workflow downloads translations into `src/_locales/<locale>/messages.json`,
  next to the English source, so they go through the normal build and are minified and packaged like everything
  else. They are **not** committed: each release takes a fresh snapshot, so the repository never carries a stale
  half-translation.

Which translations actually ship is controlled by the `download_translations` inputs in the release workflow:

| Input                       | Current value | Effect                                                                      |
| --------------------------- | ------------- | --------------------------------------------------------------------------- |
| `export_only_approved`      | `true`        | Only strings a proofreader has approved are exported                        |
| `skip_untranslated_strings` | `true`        | Unapproved/untranslated strings are omitted rather than filled with English |
| `skip_untranslated_files`   | `false`       | A locale still ships even if it is only partly translated                   |

Chrome falls back to `default_locale` per message, so an omitted string renders in English — never blank and never
stale. Set `skip_untranslated_files: true` instead if a mostly-English UI is considered worse than an English one.

The build also defends itself against translations that have drifted: `localesPlugin` in
[rolldown.config.mjs](rolldown.config.mjs) derives `IntlMessageKey`/`ExtensionErrorCode` from the default locale
alone, and drops (with a warning) any key a translation still carries that no longer exists in
`src/_locales/en/messages.json`. Without that, a translation left over from the legacy extension would fail the
build outright.

## Rehearsing a release

Running the release workflow manually (_Actions_ → _Release_ → _Run workflow_) performs a **dry run**. Everything
happens for real — the tag/changelog checks, the full CI suite, the Crowdin download, the production build and a
live check of the Chrome Web Store credentials — except the two irreversible steps: nothing is uploaded to the
store and no GitHub release is created.

A real release can therefore only ever be started by pushing a tag. There is no checkbox that turns a rehearsal
into a publish by accident.

A dry run is worth doing before the first real release, and after rotating any credential, because it proves:

- the Crowdin token and project ID work, and which locales and how many strings actually come back (the workflow
  summary has a coverage table);
- the downloaded translations survive the build — download the run's artifact, unzip `dist/temp` and load it via
  _chrome://extensions_ → _Load unpacked_ to see them in the real UI;
- the Chrome Web Store client ID, client secret, refresh token and item ID are all valid, via a token exchange and
  a read of the item. This is what catches a consent screen left in _Testing_, or a refresh token that expired
  while releases were quiet;
- the generated release notes read the way you want — they are printed to the workflow summary.

Dry runs pass `--allow-unreleased` to `scripts/release-notes.mjs`, so a version still marked `"unreleased": true`
can be rehearsed. Every other check still applies, including the requirement for at least one recorded change.

### Locally, without GitHub

```sh
# The tag/version/changelog gate, and a preview of the release notes
node scripts/release-notes.mjs v2.0.0 --allow-unreleased --out /tmp/notes.md

# The Chrome Web Store credentials (a token exchange and a read - changes nothing)
CWS_CLIENT_ID=... CWS_CLIENT_SECRET=... CWS_REFRESH_TOKEN=... CWS_EXTENSION_ID=... \
  node scripts/check-chrome-web-store.mjs

# The workflows themselves (syntax, expressions, shell)
brew install actionlint shellcheck && actionlint

# What Crowdin would upload or download, without touching the project
pnpm dlx @crowdin/cli push --dryrun
pnpm dlx @crowdin/cli download --dryrun
```

`@crowdin/cli` reads the same [crowdin.yml](crowdin.yml) as the workflow, so export
`CROWDIN_PROJECT_ID`/`CROWDIN_PERSONAL_TOKEN` first. Running `download` for real locally is also a good way to see
the translations in a dev build — just remember `src/_locales/*` is only meant to hold the English source in git,
so revert anything it writes.

## Cutting a release

1. Finalise the entry for the version in `src/changelog.json` — remove `"unreleased": true`, add the `"date"` and
   make sure it records at least one change. The release fails immediately otherwise.
2. Make sure `version` in `package.json` matches. `manifest.json` takes its version from there at build time.
3. Run `pnpm check` and `pnpm build` locally, and commit anything the build regenerates (`CHANGELOG.md`,
   `src/lib/common/extension-version.ts`, `src/lib/common/intl/intl-message-key.ts`).
4. Tag and push:

   ```sh
   git tag v2.0.0
   git push origin v2.0.0
   ```

5. Approve the `release` environment when GitHub asks.
6. Follow the Chrome Web Store link in the workflow summary and submit the draft for review.

## One-time configuration

### Crowdin

1. Create the project, set the source language to English and add the target languages.
2. Generate a Personal Access Token (_Account Settings_ → _API_) with the **Projects** scope, limited to this
   project.
3. Note the numeric project ID from the project's _Tools_ → _API_ tab.
4. If a target language ever maps to a directory name Chrome does not recognise, fix it with Language Mapping in
   the project settings, or `languages_mapping` in [crowdin.yml](crowdin.yml) — not by changing the `translation`
   pattern.

### Chrome Web Store

1. In the [Developer Dashboard](https://chrome.google.com/webstore/devconsole), note the **item ID** and the
   **publisher ID** (the long number in the dashboard URL).
2. Follow [_Use the Chrome Web Store API_](https://developer.chrome.com/docs/webstore/using-api) to create a Google
   Cloud project, enable the Chrome Web Store API, create an OAuth client (type _Web application_, with
   `https://developers.google.com/oauthplayground` as an authorised redirect URI) and exchange it for a refresh
   token via the OAuth Playground, using the scope `https://www.googleapis.com/auth/chromewebstore`.
3. Set the OAuth consent screen's publishing status to **In production**, not _Testing_. Google expires refresh
   tokens issued by a Testing app after **7 days**, so a token minted in that state will break the release a week
   later. Verification is not required — you are the only user, so the "unverified app" warning can simply be
   clicked through during the Playground exchange.
4. Even in production, a refresh token is revoked after **6 months without use**. Releases here can easily be
   further apart than that, so if a release fails with `invalid_grant`, re-run the Playground exchange and update
   `CWS_REFRESH_TOKEN`. Rotating the OAuth client secret, or revoking the app's access from the Google account,
   invalidates it immediately too.

### GitHub

Create two [environments](https://docs.github.com/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments)
under _Settings_ → _Environments_:

**`crowdin`** — deployment branch rule: _Selected branches_, `main`.

| Name                     | Type   |
| ------------------------ | ------ |
| `CROWDIN_PROJECT_ID`     | Secret |
| `CROWDIN_PERSONAL_TOKEN` | Secret |

**`release`** — deployment branch rule: _Selected branches and tags_, `v*`. Add yourself as a **required
reviewer**, which is what turns publishing into a deliberate act.

| Name                     | Type     | Notes                                                          |
| ------------------------ | -------- | -------------------------------------------------------------- |
| `CROWDIN_PROJECT_ID`     | Secret   |                                                                |
| `CROWDIN_PERSONAL_TOKEN` | Secret   |                                                                |
| `CWS_CLIENT_ID`          | Secret   |                                                                |
| `CWS_CLIENT_SECRET`      | Secret   |                                                                |
| `CWS_REFRESH_TOKEN`      | Secret   |                                                                |
| `CWS_EXTENSION_ID`       | Variable | A variable, not a secret, so the dashboard link can be printed |
| `CWS_PUBLISHER_ID`       | Variable | As above                                                       |

Also worth setting, under _Settings_ → _Rules_ → _Rulesets_: a tag ruleset matching `v*` that restricts who can
create those tags, since creating one is what starts a release.
