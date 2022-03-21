# Install

This document is only relevant for those that want to contribute to the [tmplat][] open source project (we love you
guys!). If you are only interested in installing the extension you can do so from our homepage:

https://tmplat.com

## Build Requirements

In order to build [tmplat][], you need to have the following install [git][] and [node.js][] (which includes [npm][]).

## Building

Follow these steps to build [tmplat][];

1. Clone a copy of the main [tmplat git repository](https://github.com/tmplat-extension/tmplat)
   by running `git clone git://github.com/tmplat-extension/tmplat.git`
2. `cd` to the repository directory
3. Ensure that you have all the dependencies by entering `npm install`
4. To compile a developer runnable version enter `npm run build` or `npm run build:dev`
   * Outputs to the `dist/temp` directory
5. To compile a production-optimized runnable version enter `npm run build:prod`
   * Outputs to the `dist/temp` directory
   * Compresses the contents of the `dist/temp` directory into a `dist/tmplat.zip` file

### Important

If you're planning on contributing to [tmplat][] please do **NOT** update the distributable file or documentation (steps
6 and 7 respectively) when submitting a pull request. We will not accept pull requests when these files have been
changed as we run these ourselves when creating a new release.

Read the `CONTRIBUTING.md` file for more information about submitting pull requests.

## Debugging

To run a locally built extension in [Google Chrome][] you can follow these steps;

1. Launch [Google Chrome][]
2. Bring up the extension's management page by choosing **More Tools > Extensions** from its main menu
3. Ensure **Developer mode** is enabled in the top right of the page
4. **Disable** all other versions of [tmplat][] which are installed to avoid any conflicts (e.g. with keyboard shortcuts)
5. Click the **Load unpacked** button (a file dialog should appear)
6. In the file dialog, navigate to this directory and select the `dist/temp` folder before clicking **Select**

[git]: https://git-scm.com
[google chrome]: https://google.com/chrome
[node.js]: https://nodejs.org
[npm]: https://npmjs.com
[tmplat]: https://tmplat.com
