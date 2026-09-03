<!-- This file is generated during the build from "docs/changelog.json". -->
<!-- Do not edit it manually as any changes will be overwritten. -->

# Changelog

## Version 1.2.9, 2015-11-08

### Fixes

- Fix bug where **dateTime** standard variable failed to render correctly

## Version 1.2.8, 2014-05-11

### Improvements

- Update Bitly configuration due to recent security breach

## Version 1.2.7, 2014-02-26

### Improvements

- Restyle keyboard shortcuts in popup and options page
- Use rich desktop notifications
- Update a YOURLS Wiki link
- Update build dependencies

### Fixes

- Fix overlapping UI bug in popup
- Fix bug preventing OAuth flow completing

## Version 1.2.6, 2013-05-20

### Features

- Add tooltips to explain button states
- Add new **wordCount** operation to count the words in a string
- Add new **meta** operation to access specific meta information
- Add new **html** standard variable to enable access to the entire pages HTML
- Add new **markdown** standard variable to enable access to the entire contents of a page as Markdown
- Add new **text** standard variable to enable access to the entire pages text

### Fixes

- Minor bug fixes and tweaks

## Version 1.2.5, 2013-05-14

### Features

- Add new operations for evaluating XPath expressions
- Add new objects for accessing Web Storage
- Add options for configuring HTML to Markdown conversion

### Improvements

- Update html.md to v2.1.1
- Make the Anchor Tags options more generic
- Deprecate the **anchorTarget** option and replace with the **linksTarget** option
- Deprecate the **anchorTitle** option and replace with the **linksTitle** option
- Update the extension homepage

### Fixes

- Minor bug fixes and UI tweaks

## Version 1.2.4, 2013-05-07

### Fixes

- Fix critical bug for Linux systems

## Version 1.2.3, 2013-05-06

### Fixes

- Fix bug preventing options from being saved correctly

## Version 1.2.2, 2013-05-04

### Improvements

- Update html.md to v2.1.0

### Fixes

- Fix bug on OS X causing Windows keyboard shortcut modifiers to be displayed
- Fix bug which caused sections to be case-sensitive

## Version 1.2.1, 2013-04-29

### Features

- Support bulk enable & disable operations
- Add new **escape** operation to escape strings for insertion into HTML
- Add new **unescape** operation to perform the opposite action of **escape**
- Add new **locale** standard variable to enable access to the detected ISO 639 language code
- Some nice new undocumented features

### Improvements

- Upgrade feedback widget from UserVoice to newer version to avoid CSP workaround
- Update mustache.js to v0.7.2
- Update jQuery to v1.9.1
- Update Bootstrap to v2.3.1
- Add Underscore.js v1.4.4 to allow for cleaner code and remove duplication
- Add Async v0.2.7 to greatly simplify asynchronous code
- Change CSP to prevent errors caused by the UserVoice feedback widget
- Dialog windows to provide initial focus to first field when opened
- Make trace logs cleaner
- Simplify how template icons are managed internally
- Massive re-write of a lot of code to make it simpler and more optimized

### Fixes

- Fix bug where whitespace in templates was being ignored
- Fix "Save As..." functionality in export process
- Huge number of bug fixes and UI tweaks

## Version 1.2.0, 2013-01-15

### Features

- Add new operations for query selectors
- Add new configuration file to simplify future changes

### Improvements

- Replace calls to deprecated chrome API methods
- Update Bootstrap to v2.2.2
- Redesign Templates tab on Options page
- Improve build process and restructure code to simplify support for other browsers
- Update jQuery to v1.8.3
- Update jQuery URL Parser to v2.2.1
- Update html.md to v2.0.1

### Fixes

- Plenty of bug fixes and UI tweaks

## Version 1.1.4, 2012-05-31

### Improvements

- Improve inline installation compatibility

## Version 1.1.3, 2012-05-30

### Improvements

- Relocate new donation button and add tooltip

## Version 1.1.2, 2012-05-29

### Features

- Add donation button to footer of Options page

## Version 1.1.1, 2012-05-25

### Improvements

- Minor i18n tweaks

### Fixes

- No longer remove `btn-primary` class from inline installation buttons on homepage

## Version 1.1.0, 2012-05-25

### Features

- Add option to automatically paste Template output into the input field focused when using a keyboard shortcut (available in templates via the new **shortcutsPaste** option)

### Improvements

- Change keyboard shortcut detection to `keydown` from `keyup`
- Update manifest version to 2
- Provide and support a Content Security Policy
- Move all CSS and inline styles into individual external files
- Update Bootstrap to v2.0.3
- Many minor UI fixes and tweaks
- Redesign popup to be more consistent with look and feel of the Options page
- Replace all template icons with the Glyphicons set included in Bootstrap
- Remove toolbar button text/icon editing functionality and make the **toolbarStyle** option obsolete

### Fixes

- Minor fixes and tweaks

## Version 1.0.10, 2012-05-14

### Fixes

- Fix bug where **capitalise** operation wasn't working

## Version 1.0.9, 2012-05-09

### Features

- Add new operations for string manipulation

### Improvements

- Update build process to minify i18n files for distribution
- Update date-ext to v1.0.2

## Version 1.0.8, 2012-04-20

### Features

- Add new **linkHTML** standard variable to enable access to the HTML behind the right-clicked link
- Add new **linkMarkdown** standard variable to enable access to contents of the right-clicked link as Markdown
- Add new **linkText** standard variable to enable access to the text of the right-clicked link
- Add option to automatically paste Template output into right-clicked input field (available in templates via the new **menuPaste** option)

### Improvements

- Improve error handling when saving export data to a file
- Update jQuery to v1.7.2
- Update mustache.js to v0.4.2

### Fixes

- Minor fixes

## Version 1.0.7, 2012-03-16

### Features

- Add new **tabs** list to enable iteration over the URLs of every tab in the current window

### Fixes

- Fix bug where wrong window is used to populate template data in Chrome dev

## Version 1.0.6, 2012-03-15

### Features

- Add new _Selection in Markdown_ predefined template (disabled by default)

### Fixes

- Fix bug where URL and all derived variables are automatically decoded
- Fix bug where whitespace after an operation is being ignored
- Minor UI fixes

## Version 1.0.5, 2012-03-12

### Features

- Add new **selectionMarkdown** standard variable to enable access to the current selection formatted as Markdown
- Add user feedback system to the Options page

### Improvements

- Improve way in which web service configurations are stored and retrieved
- Improve help documentation for certain fields in the Options page

## Version 1.0.4, 2012-03-07

### Improvements

- Tidy i18n bundle to help with new translation process

### Fixes

- Fix bug where unregistered keyboard shortcuts still trigger desktop notification when using modifier

## Version 1.0.3, 2012-03-06

### Features

- Add new **selectionHTML** standard variable to enable access to the HTML behind the current selection
- Add new **selectedImages** list to enable iteration over images within in current selection
- Add new **images** list to enable iteration over all of the images on the page

### Improvements

- Remove duplicate URLs from certain lists

### Fixes

- Fix bug preventing access to page-derived template variables

## Version 1.0.1, 2012-03-05

### Features

- Add OAuth support for Bitly
- Add new **bitlyAccount** option to determine whether or not you are logged in to Bitly
- Add new **yourlsAuthentication** option to determine how the YOURLS URL shortener is being authenticated
- Implement support for OAuth 2.0

### Improvements

- Make Bitly the default URL shortener
- Make unauthenticated Bitly use the tmpl.at custom domain
- Remove the **bitlyApiKey** and **bitlyUsername** options
- Improve UI on Options page in some places
- Improve extension compatibility system

### Fixes

- Minor bug fixes and UI tweaks

## Version 1.0.0, 2012-02-17

### Features

- Add _Login_/_Logout_ button to goo.gl's configuration on the Options page
- Add option to keep popup open after clicking a template (available in templates via the new **toolbarClose** option)
- Add new **count** standard variable to enable access to the total number of templates
- Add new **customCount** standard variable to enable access to the total number of custom templates (i.e. excluding predefined)
- Add new **popular** object to enable access to the details of the most popular template
- Add new **coords** object to enable access to the user's geolocation
- Add Options link to bottom of context menu (available in templates via the new **menuOptions** option)
- Add Options link to bottom of popup (available in templates via the new **toolbarOptions** option)
- Add new **author** standard variable to enable access to the author from the page's meta information
- Add new **characterSet** standard variable to enable access to the character set
- Add new **description** standard variable to enable access to the description from the page's meta information
- Add new **depth** standard variable to enable access to the colour depth of the user's screen
- Add new **keywords** list to enable iteration over the keywords from the page's meta information
- Add new **lastModified** standard variable and operation to enable access to the potentially formatted last modified date/time
- Add new **links** list to enable iteration over all of the links on the page
- Add new **pageWidth** and **pageHeight** standard variables to enable access to the page's dimensions
- Add new **plugins** list to enable iteration over the active browser plugins
- Add new **referrer** standard variable to enable access to the URL of the referring page
- Add new **screenWidth** and **screenHeight** standard variables to enable access to the user's screen resolution
- Add new **scripts** list to enable iteration over all of the page's external script sources
- Add new **styleSheets** list to enable iteration over all of the page's external CSS stylesheet sources
- Add new **template** object to enable access to the activated template
- Allow easier access to object properties using dot notation

### Improvements

- **Full release!**
- Deprecate the **googlOAuth** option and replace with the new **googlAccount** option
- Ensure code and documentation quality and standards are high
- Completely redesign and simplify the Options page
- Deprecate the **toolbarFeature** option (still available by inverting the **toolbarPopup** option)
- Deprecate the **toolbarFeatureDetails** option and replace with the **toolbarStyle** option
- Deprecate the **toolbarFeatureName** option and replace with the **toolbarKey** option
- Reorganize template data stored in `localStorage`
- Completely rewrite code in CoffeeScript
- Update build process
- Remove requirement of names for templates
- Reorganize option data stored in `localStorage`
- Automically save changes on the Options page
- Deprecate the **contextMenu** option and replace with the new **menu** option
- Deprecate the **selectionLinks** list and replace with the new **selectedLinks** list
- Deprecate the **short** standard variable and replace with the new **shorten** operation
- Simplify debugging and testing by adding a new Developer Tools section to the Options page
- Redesign desktop notifications
- Redesign _Please wait..._ animation in popup

### Fixes

- Fix bug where some variables are not case-insensitive
- Fix bug where overwriting an existing file during the export process can corrupt the file
- More bug fixes and UI tweaks

## Version 0.3.0, 2011-12-22

### Features

- Add option to change behaviour of the toolbar icon (available in templates via the new **toolbarPopup** and **toolbarFeature** option tags)
- Add option to select a default template (available in templates via the new **toolbarFeatureName** option tag)
- Add option to change the style of the toolbar icon to that of the default template (available in templates via the new **toolbarFeatureDetails** option tag)
- Add new **dateTime** simple tag and function to allow formatted date/time
- Add support for inline installation
- Add new **decode** function to decode its previously encoded contents

### Improvements

- Make tags case-insensitive
- Replace API calls deprecated by Chrome 16
- Change to MIT license
- Update homepage links
- Patch underlying template technology

### Fixes

- Minor bug fixes

## Version 0.2.4, 2011-10-20

### Features

- Add help documentation for general settings on options page

### Improvements

- Make template export process no longer require external resource
- Many minor UI changes in options page

## Version 0.2.3, 2011-10-10

### Improvements

- Rebrand logo and create new promotional images
- Improve URL derivation when using the context menu
- Update jQuery to v1.6.4
- Rebrand logo, again...

### Fixes

- Prevent content script conflicts between version updates

## Version 0.2.2, 2011-08-08

### Improvements

- Ignore keyboard shortcuts for disabled templates for validation and lookup

### Fixes

- Minor spelling correction

## Version 0.2.1, 2011-08-05

### Features

- Add new predefined Markdown template (disabled by default)
- Add new **selectionLinks** complex tag to allow iteration over links within in current selection

### Improvements

- Change **selection** simple tag to allow access using popup/shortcuts and not just right-click menu

### Fixes

- Fix minor UI defects in popup
- Minor bug fixes
- Fix bug where notification is displayed when user clicks _Copy_ button when exporting templates

## Version 0.2.0, 2011-08-04

### Features

- Add import/export functionality for templates
- Add many more images to be used with your custom templates
- Add new permissions required by Chrome 13 to use copy/paste functionality
- Add copy and paste buttons to the template import and export views

### Improvements

- Change extension name to _Template_ to do it better justice
- Clean up options page further using tabs
- Remove supported extensions section on the options page, along with the _management_ permission

### Fixes

- Minor bug fixes and tweaks

## Version 0.1.1, 2011-07-28

### Features

- Add new **cookies** template complex tag to allow iteration over cookie names
- Add new **cookie** template function tag to allow access to cookie values
- Add new **selection** template simple tag to allow access to the currently selected text on the page (only available when accessed via the context menu)
- Add option to disable the context (right-click) menu (available in templates via the new **contextMenu** option tag)
- Add compatibility support for IE Tab Classic, IE Tab Multi (Enhance) and Mozilla Gecko Tab extensions

### Improvements

- Rename the **cookies** template simple tag to **cookiesEnabled**
- Update the notification messages to be more generic
- Slightly rearrange the options page
- Redesign compatibility structure to support multiple extensions

### Fixes

- Fix error caused by using extension on a page where IE Tab is active

## Version 0.1.0, 2011-07-26

### Features

- Add feature customization including a template system
- Add new help system to options page including documentation on the new template system
- Add support for context (right-click) menus
- Add support for YOURLS URL shortener installations
- Allow keyboard shortcuts to be customized
- Add some feedback messages if/when any errors occur when copying a shortened URL (i.e. could not reach URL shortener service)
- Add more options (browser, OS and extension information)

### Improvements

- Convert default features to use the new template system
- Completely rewrite code to dynamically copy parsed templates
- Redesign Features section of options page to support feature customization
- Major rewrite of code including huge optimization work and performance improvements
- Update jQuery to v1.6.2
- Remove jQuery dependencies from all but the background and options pages to optimize page loads
- Remove support for the French language
- Change how supported extensions are used to be less intrusive
- And lots more...
- Deprecate the **originalSource** template simple tag and replace with the **originalUrl** simple tag
- Deprecate the **source** template simple tag and replace with the **url** simple tag
- Deprecate the **encoded** template simple tag and replace with the **encode** function which encodes its rendered contents
- Make some minor UI tweaks for options page
- Rename _Features_ to _Templates_ for simplicity
- Remove _Update_ button from options page, as changes now update automatically where appropriate, although you must still press _Save & Close_ to persist them
- Simplify the process of adding new feature (i.e. templates)

### Fixes

- Fix Bitly URL shortener service
- Fix OS X keyboard shortcuts
- Fix problem where URL shortener options were being forgotten when browser was closed
- Attempt to make keyboard shortcuts work more consistently
- Fix error generated by **param**, **segment**, **fparam** and **fsegment** template functions
- Fix bug where valid keyboard shortcut inputs were being rejected

## Version 0.0.2, 2011-04-11

### Features

- Add BBCode feature
- Add Encoded feature
- Implement IE Tab extension compatibility (options are included but not visible yet)
- Add enable/disable feature option functionality
- Add reorder feature option functionality
- Add French language support
- Add support for multiple URL shortener services
- Add OAuth support for URL shortener services (enabled by default)
- Add support for Bitly URL shortener service
- Add new window (target) option for anchor feature
- Add collapsible sections to options page to simplify content

### Improvements

- Change images to be more consistent
- Change software-specific features (e.g. BBCode) to be disabled by default
- Change key listeners to listen for `keyup` events as opposed to `keydown`
- Complete rewrite of code and file system restructuring for optimization and ease of future improvements/changes
- Include jQuery (v1.5.2 - minified) to minimize code duplication and increase efficiency
- Reduce image sizes for optimization
- Minify JavaScript files for optimization
