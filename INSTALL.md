# Build Requirements
In order to build [Template][], you need to have the following install [git][] 1.7+ and [node.js][]
0.8+ (which includes [npm][]).

# Building
Follow these steps to build [Template][];

1. Clone a copy of the main [Template git repository](https://github.com/template-extension/template-chrome)
   by running `git clone git://github.com/template-extension/template-chrome.git`
2. `cd` to the repository directory
3. Ensure you have all of the dependencies by entering `npm install`
4. To update the compiled and runnable version enter `cake build`
   * Outputs to the `bin` directory
5. To update the optimized distributable file enter `cake dist`
   * Outputs to the `dist` directory
   * Currently requires a `zip` utility to exist on the path
6. To update the documentation enter `cake docs`
   * Outputs to the `docs` directory
   * Not currently working on Windows as it uses linux shell commands

# Debugging
To run a locally built extension in [Google Chrome][] you can follow these steps;

1. Launch [Google Chrome][]
2. Bring up the extensions management page by choosing **Tools > Extensions** from its main menu
3. Ensure **Developer mode** is checked in the top right of the page
4. **Disable** all other versions of [Template][] which are installed to avoid any conflicts (e.g. with keyboard shortcuts)
5. Click the **Load unpacked extension...** button (a file dialog should appear)
6. In the file dialog, navigate to this directory and select the `bin` folder before clicking **OK**

[git]: http://git-scm.com
[google chrome]: https://www.google.com/chrome
[node.js]: http://nodejs.org
[npm]: http://npmjs.org
[template]: http://template-extension.org
