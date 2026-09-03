# Install

This document is for people who want to build tmplat from source. **To just use the extension**, install it from
<https://tmplat.com>.

## Requirements

- [git](https://git-scm.com)
- [Node.js](https://nodejs.org) 24.15 or later (`.node-version` is read by most version managers and by CI)
- [pnpm](https://pnpm.io) — pinned by the `packageManager` field; `npm` and `yarn` are blocked by a preinstall guard.
  The simplest way to get the right version is `corepack enable` (bundled with Node.js).

## Build

```sh
git clone https://github.com/tmplat-extension/tmplat.git
cd tmplat
pnpm install
pnpm build:dev   # unminified build in dist/temp
```

Other useful builds:

| Command          | Result                                                                     |
| ---------------- | -------------------------------------------------------------------------- |
| `pnpm dev`       | `dist/temp`, rebuilt on change, with type checking running alongside       |
| `pnpm build:dev` | `dist/temp`, unminified, type checked once                                 |
| `pnpm build`     | `dist/temp` minified, plus `dist/tmplat.zip` — the artifact stores receive |

`dist/` is gitignored, so build output is never committed; releases are built by CI (see
[RELEASING.md](RELEASING.md)). Before opening a pull request, run `pnpm check` and `pnpm test` — see
[CONTRIBUTING.md](CONTRIBUTING.md).

## Run it locally

Load `dist/temp` as an unpacked extension. **Disable any other installed copy of tmplat first**, or keyboard shortcuts
will conflict.

**[Google Chrome](https://google.com/chrome)**

1. Open **More Tools > Extensions** from the main menu.
2. Enable **Developer mode** (top right).
3. Click **Load unpacked** and select the `dist/temp` folder.

**[Microsoft Edge](https://microsoft.com/edge)**

Edge runs the very same build — there is no separate Edge package — so only the menus differ:

1. Open **Extensions > Manage extensions** from the main menu.
2. Enable **Developer mode** (left-hand sidebar).
3. Click **Load unpacked** and select the `dist/temp` folder.

After a rebuild, click the extension's **reload** button on that page. Changes to the service worker or the manifest
always need a reload; changes to a page's UI only need the page reopening.
