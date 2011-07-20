# [URL Copy](https://chrome.google.com/webstore/detail/dcjnfaoifoefmnbhhlbppaebgnccfddf) - Google Chrome Extension

## Build Requirements
In order to build URL Copy, you need to have the following:

* GNU make 3.8+
* Node 0.2+
* git 1.7+

If you want to generate documentation the following are also required;

* [Java Runtime Environment](http://www.java.com/en) 1.5+
* [JsDoc Toolkit](http://code.google.com/p/jsdoc-toolkit) 2.4+

*Earlier versions might work, but have not been tested.*

The following options are available depending on your operating system;

### Microsoft Windows
Either of the below options are aviable;

1. Install [msysgit](https://code.google.com/p/msysgit) (full installer for official Git), [GNU make for Windows](http://gnuwin32.sourceforge.net/packages/make.htm), and a [binary version of Node](http://node-js.prcn.co.cc)
   * Make sure all three packages are installed to the same location (by default, this is `C:\Program Files\Git`)
2. Install [cygwin](http://cygwin.com) (make sure you install the *git*, *make*, and *which* packages) and then one of the following;
   * Follow the [Node build instructions](https://github.com/ry/node/wiki/Building-node.js-on-Cygwin-%28Windows%29)
   * Install the [binary version of Node](http://node-js.prcn.co.cc)

### Apple Mac OS X

* Install [Xcode](http://developer.apple.com/technologies/xcode.html) (also available on your Mac OS installation DVD)
* Install [Homebrew](http://mxcl.github.com/homebrew) and then both of the following;
   * Run `brew install git`
   * Run `brew install node`

### Linux/BSD
Use your appropriate package managers to install *git*, *make*, and *Node*.

## Building
Follow these steps to build URL Copy;

1. Clone a copy of the main URL Copy git repository by running `git clone git://github.com/neocotic/url-copy-chrome.git`
2. For the minified and validated version `cd` to the repository directory and enter `make`
   * If you don't have *Node* installed and/or want the basic, uncompressed, unvalidated version of URL Copy, simply run the extension off of the `src` directory
   * Outputs to `bin` directory
3. For the distribution enter `make dist`
   * Outputs to `dist` directory

If you want to generate documentation as well you can do the following after step 1 of the above;

1. `cd` to the repository directory and enter `make doc`
   * Outputs to `docs` directory
   * If JsDoc Toolkit has not be unpacked at `/usr/local/jsdoc-toolkit` you can specify it's path at runtime by doing the following;
      * Enter `make "jsdoc_toolkit=C:/jsdoc-toolkit-2.4.0/jsdoc-toolkit" doc`

To remove all built files, run `make clean`.

## Debugging
To run the locally built extension in [Google Chrome](http://www.google.com/chrome) you can follow these steps;

1. Launch Google Chrome
2. Bring up the extensions management page by clicking the wrench icon ![wrench](http://code.google.com/chrome/extensions/images/toolsmenu.gif) and choosing **Tools > Extensions**
3. If **Developer mode** has a + by it, click the + to add developer information to the page (the + changes to a -, and more buttons and information appear)
4. If any other installations of the extension exist either **Disable** or **Uninstall** them
4. Click the **Load unpacked extension** button (a file dialog appears)
5. In the file dialog, navigate to the extension's `bin` or `src` folder and click **OK**