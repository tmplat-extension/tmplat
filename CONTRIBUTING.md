# Contributing

## Questions and bugs

[Search the existing issues](https://github.com/tmplat-extension/tmplat/issues) first — commenting on an open issue is
more useful than opening a duplicate. Otherwise,
[raise a new one](https://github.com/tmplat-extension/tmplat/issues/new).

## Making a change

Set up your environment as described in [INSTALL.md](INSTALL.md) (git, Node 24.15+, pnpm), then:

```sh
pnpm install
pnpm dev       # watch build + type checking, loaded from dist/temp
```

Match the style of the surrounding code, and add or update tests for anything you change —
[TESTING.md](TESTING.md) explains how the suites are organised and what is expected of a new test.

Before opening a pull request:

```sh
pnpm fix       # apply lint and formatting fixes
pnpm check     # type checks (including e2e), lint and format — no tests
pnpm test      # unit tests
pnpm test:e2e  # only if you touched the manifest, worker, content scripts or a user flow
```

CI runs the same commands, plus a production build, on every pull request.

## Pull requests

- Target the `main` branch.
- Keep the change focused; unrelated fixes are easier to review separately.
- Don't commit build output — `dist/` is gitignored and releases are built by CI (see
  [RELEASING.md](RELEASING.md)). User-visible changes belong in `src/changelog.json`, from which `CHANGELOG.md` is
  generated.
- Add yourself to [AUTHORS.md](AUTHORS.md) if you'd like the credit.
