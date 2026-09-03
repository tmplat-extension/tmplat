# Contributing

If you have any questions about this library, please feel free to
[raise an issue](https://github.com/tmplat-extension/tmplat/issues/new).

Please [search existing issues](https://github.com/tmplat-extension/tmplat/issues) for the same feature and/or issue
before raising a new issue. Commenting on an existing issue is usually preferred over raising duplicate issues.

Please ensure that all files conform to the coding standards, using the same coding style as the rest of the code base.
All unit tests should be updated and passing as well. All of this can easily be checked via command-line:

```sh
pnpm install          # install dependencies
pnpm build            # build for production
pnpm build:dev        # build for local development (faster)
pnpm test             # check linting/formatting and run the unit tests
pnpm check            # as above, plus type checking
pnpm fix              # fix linting and formatting issues
```

This project uses [pnpm](https://pnpm.io) as its package manager, and running `npm install`/`yarn` here will fail
deliberately. The required version is declared via the `packageManager` field in `package.json`, so the simplest
way to get the right one is `corepack enable` (bundled with Node.js), or install it by following the
[pnpm installation guide](https://pnpm.io/installation).

You must have at least [Node.js](https://nodejs.org) version v24.15 or newer installed; the major version used by CI
is declared in [.node-version](.node-version), which is understood by most Node version managers (fnm, nvm, asdf,
mise, Volta). This is enforced — `engineStrict: true` in [pnpm-workspace.yaml](pnpm-workspace.yaml) makes both
`pnpm install` and `pnpm run` fail fast on an unsupported Node rather than breaking obscurely later.

If that check reports an older version than `node -v` does, your version manager is likely pinning pnpm itself to
an older runtime. Volta binds a global tool to whichever Node was default when the tool was installed, so run
`volta install pnpm@<version>` (matching `packageManager` in `package.json`) to rebind it, then confirm with
`pnpm exec node -v`.

See [TESTING.md](TESTING.md) for how the tests are organized and what is expected of new tests.

You can run `pnpm fix` to automatically fix any linting and formatting issues that are found.

All pull requests should be made to the `main` branch.

Remember to add your details to the list of
[AUTHORS.md](https://github.com/tmplat-extension/tmplat/blob/main/AUTHORS.md) if you want your contribution to be
recognized by others.
