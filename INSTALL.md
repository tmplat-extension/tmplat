This document is only relevant for those that want to contribute to the [Template][] open source
project (we love you guys!). If you are only interested in installing the extension you can do so
from our homepage:

http://template-extension.org

## Build Requirements

In order to build [Template][], you need to have the following install [git][] 1.7+ and [node.js][]
0.8+ (which includes [npm][]).

## Building

Follow these steps to build [Template][];

1. Clone a copy of the main [Template git repository](https://github.com/template-extension/template-chrome)
   by running `git clone git://github.com/template-extension/template-chrome.git`
2. `cd` to the repository directory
3. Ensure that you have all of the dependencies by entering `npm install`
4. Ensure that you can run [Grunt][] by using `npm install -g grunt-cli`
5. To update the compiled and runnable version enter `grunt build` (**Pro Tip:** Entering just `grunt` does exactly the same thing in this case)
   * Outputs to the `bin` directory
6. To update the optimized distributable file enter `grunt dist`
   * Outputs to the `dist` directory
7. To update the documentation enter `grunt docs`
   * Outputs to the `docs` directory

### Important

If you're planning on contributing to [Template][] please do **NOT** update the distributable file
or documentation (steps 6 and 7 respectively) when submitting a pull request. We will not accept
pull requests when these files have been changed as we run these ourselves when creating a new
release.

Read the `CONTRIBUTING.md` file for more information about submitting pull requests.

## Debugging

To run a locally built extension in [Google Chrome][] you can follow these steps;

1. Launch [Google Chrome][]
2. Bring up the extensions management page by choosing **Tools > Extensions** from its main menu
3. Ensure **Developer mode** is checked in the top right of the page
4. **Disable** all other versions of [Template][] which are installed to avoid any conflicts (e.g. with keyboard shortcuts)
5. Click the **Load unpacked extension...** button (a file dialog should appear)
6. In the file dialog, navigate to this directory and select the `bin` folder before clicking **OK**

[git]: http://git-scm.com
[google chrome]: https://www.google.com/chrome
[grunt]: http://gruntjs.com
[node.js]: http://nodejs.org
[npm]: http://npmjs.org
[template]: http://template-extension.org
