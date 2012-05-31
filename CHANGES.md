2012.05.31, Version 1.1.4

* [#108](https://github.com/neocotic/template/issues/108): Improve inline installation compatibility

2012.05.30, Version 1.1.3

* Relocate new donation button and add tooltip

2012.05.29, Version 1.1.2

* [#107](https://github.com/neocotic/template/issues/107): Add donation button to footer of Options page

2012.05.25, Version 1.1.1

* [#106](https://github.com/neocotic/template/issues/106): No longer remove `btn-primary` class from inline installation buttons on homepage
* Minor i18n tweaks

2012.05.25, Version 1.1.0

* [#98](https://github.com/neocotic/template/issues/98): Add option to automatically paste Template output into the input field focused when using a keyboard shortcut (available in templates via the new *"shortcutsPaste"* option)
* [#98](https://github.com/neocotic/template/issues/98): Change keyboard shortcut detection to `keydown` from `keyup`
* [#102](https://github.com/neocotic/template/issues/102): Update [manifest version][] to 2
* [#102](https://github.com/neocotic/template/issues/102): Provide and support a [Content Security Policy][]
* [#103](https://github.com/neocotic/template/issues/103): Move all CSS and inline styles into individual external files
* [#104](https://github.com/neocotic/template/issues/104): Update [Bootstrap][] to v2.0.3
* [#104](https://github.com/neocotic/template/issues/104): Many minor UI fixes and tweaks
* [#105](https://github.com/neocotic/template/issues/105): Redesign popup to be more consistent with look and feel of the Options page
* [#105](https://github.com/neocotic/template/issues/105): Replace all template icons with the [Glyphicons][] set included in [Bootstrap][]
* [#105](https://github.com/neocotic/template/issues/105): Remove toolbar button text/icon editing functionality and make the *"toolbarStyle"* option obsolete
* Minor fixes and tweaks

2012.05.14, Version 1.0.10

* [#101](https://github.com/neocotic/template/issues/101): Fix bug where *"capitalise"* operation wasn't working

2012.05.09, Version 1.0.9

* [#97](https://github.com/neocotic/template/issues/97): Update build process to minify i18n files for distribution
* [#99](https://github.com/neocotic/template/issues/99): Add new operations for string manipulation
* Update [date-ext][] to v1.0.2

2012.04.20, Version 1.0.8

* [#92](https://github.com/neocotic/template/issues/92): Improve error handling when saving export data to a file
* [#94](https://github.com/neocotic/template/issues/94): Add new *"linkHTML"* standard variable to enable access to the HTML behind the right-clicked link
* [#94](https://github.com/neocotic/template/issues/94): Add new *"linkMarkdown"* standard variable to enable access to contents of the right-clicked link as [Markdown][]
* [#94](https://github.com/neocotic/template/issues/94): Add new *"linkText"* standard variable to enable access to the text of the right-clicked link
* [#95](https://github.com/neocotic/template/issues/95): Add option to automatically paste Template output into right-clicked input field (available in templates via the new *"menuPaste"* option)
* Update [jQuery][] to v1.7.2
* Update [mustache.js][] to v0.4.2
* Minor fixes

2012.03.16, Version 1.0.7

* [#90](https://github.com/neocotic/template/issues/90): Fix bug where wrong window is used to populate template data in [Chrome dev][]
* [#91](https://github.com/neocotic/template/issues/91): Add new *"tabs"* list to enable iteration over the URLs of every tab in the current window

2012.03.15, Version 1.0.6

* [#87](https://github.com/neocotic/template/issues/87): Fix bug where URL and all derived variables are automatically decoded
* [#88](https://github.com/neocotic/template/issues/88): Add new *"Selection in Markdown"* predefined template (disabled by default)
* [#89](https://github.com/neocotic/template/issues/89): Fix bug where whitespace after an operation is being ignored
* Minor UI fixes

2012.03.12, Version 1.0.5

* [#82](https://github.com/neocotic/template/issues/82): Add new *"selectionMarkdown"* standard variable to enable access to the current selection formatted as [Markdown][]
* [#83](https://github.com/neocotic/template/issues/83): Improve way in which web service configurations are stored and retrieved
* [#85](https://github.com/neocotic/template/issues/85): Improve help documentation for certain fields in the Options page
* [#86](https://github.com/neocotic/template/issues/86): Add user feedback system to the Options page

2012.03.07, Version 1.0.4

* [#80](https://github.com/neocotic/template/issues/80): Tidy i18n bundle to help with [new translation process][translation]
* [#81](https://github.com/neocotic/template/issues/81): Fix bug where unregistered keyboard shortcuts still trigger desktop notification when using modifier

2012.03.06, Version 1.0.3

* [#76](https://github.com/neocotic/template/issues/76): Add new *"selectionHTML"* standard variable to enable access to the HTML behind the current selection
* [#76](https://github.com/neocotic/template/issues/76): Add new *"selectedImages"* list to enable iteration over images within in current selection
* [#76](https://github.com/neocotic/template/issues/76): Add new *"images"* list to enable iteration over all of the images on the page 
* [#77](https://github.com/neocotic/template/issues/77): Fix bug preventing access to page-derived template variables
* [#78](https://github.com/neocotic/template/issues/78): Remove duplicate URLs from certain lists

2012.03.05, Version 1.0.1

* [#71](https://github.com/neocotic/template/issues/71): Make [bit.ly][] the default URL shortener
* [#71](https://github.com/neocotic/template/issues/71): Make unauthenticated [bit.ly][] use the [tmpl.at][] custom domain
* [#72](https://github.com/neocotic/template/issues/72): Add [OAuth][] support for [bit.ly][]
* [#72](https://github.com/neocotic/template/issues/72): Add new *"bitlyAccount"* option to determine whether or not you are logged in to [bit.ly][]
* [#72](https://github.com/neocotic/template/issues/72): Remove the *"bitlyApiKey"* and *"bitlyUsername"* options
* [#73](https://github.com/neocotic/template/issues/73): Add new *"yourlsAuthentication"* option to determine how the [YOURLS][] URL shortener is being authenticated
* [#73](https://github.com/neocotic/template/issues/73): Improve UI on Options page in some places
* [#74](https://github.com/neocotic/template/issues/74): Implement support for [OAuth 2.0][]
* [#75](https://github.com/neocotic/template/issues/75): Improve extension compatibility system
* Minor bug fixes and UI tweaks

2012.02.17, Version 1.0.0

* **Full release!**
* [#20](https://github.com/neocotic/template/issues/20): Add *"Login"*/*"Logout"* button to [goo.gl][]'s configuration on the Options page
* [#20](https://github.com/neocotic/template/issues/20): Deprecate the *"googlOAuth"* option and replace with the new *"googlAccount"* option
* [#35](https://github.com/neocotic/template/issues/35): Ensure code and documentation quality and standards are high
* [#47](https://github.com/neocotic/template/issues/47): Completely redesign and simplify the Options page
* [#48](https://github.com/neocotic/template/issues/48): Add option to keep popup open after clicking a template (available in templates via the new *"toolbarClose"* option)
* [#48](https://github.com/neocotic/template/issues/48): Deprecate the *"toolbarFeature"* option (still available by inverting the *"toolbarPopup"* option)
* [#48](https://github.com/neocotic/template/issues/48): Deprecate the *"toolbarFeatureDetails"* option and replace with the *"toolbarStyle"* option
* [#48](https://github.com/neocotic/template/issues/48): Deprecate the *"toolbarFeatureName"* option and replace with the *"toolbarKey"* option
* [#49](https://github.com/neocotic/template/issues/49): Add new *"count"* standard variable to enable access to the total number of templates
* [#49](https://github.com/neocotic/template/issues/49): Add new *"customCount"* standard variable to enable access to the total number of custom templates (i.e. excluding predefined)
* [#49](https://github.com/neocotic/template/issues/49): Add new *"popular"* object to enable access to the details of the most popular template
* [#49](https://github.com/neocotic/template/issues/49): Reorganize template data stored in `localStorage`
* [#52](https://github.com/neocotic/template/issues/52): Completely rewrite code in [CoffeeScript][]
* [#52](https://github.com/neocotic/template/issues/52): Update build process
* [#58](https://github.com/neocotic/template/issues/58): Remove requirement of names for templates
* [#59](https://github.com/neocotic/template/issues/59): Reorganize option data stored in `localStorage`
* [#60](https://github.com/neocotic/template/issues/60): Automically save changes on the Options page
* [#61](https://github.com/neocotic/template/issues/61): Add new *"coords"* object to enable access to the user's geolocation
* [#62](https://github.com/neocotic/template/issues/62): Add Options link to bottom of context menu (available in templates via the new *"menuOptions"* option)
* [#62](https://github.com/neocotic/template/issues/62): Add Options link to bottom of popup (available in templates via the new *"toolbarOptions"* option)
* [#62](https://github.com/neocotic/template/issues/62): Deprecate the *"contextMenu"* option and replace with the new *"menu"* option
* [#63](https://github.com/neocotic/template/issues/63): Add new *"author"* standard variable to enable access to the author from the page's meta information
* [#63](https://github.com/neocotic/template/issues/63): Add new *"characterSet"* standard variable to enable access to the [character set][]
* [#63](https://github.com/neocotic/template/issues/63): Add new *"description"* standard variable to enable access to the description from the page's meta information
* [#63](https://github.com/neocotic/template/issues/63): Add new *"depth"* standard variable to enable access to the colour depth of the user's screen
* [#63](https://github.com/neocotic/template/issues/63): Add new *"keywords"* list to enable iteration over the keywords from the page's meta information
* [#63](https://github.com/neocotic/template/issues/63): Add new *"lastModified"* standard variable and operation to enable access to the potentially formatted last modified date/time
* [#63](https://github.com/neocotic/template/issues/63): Add new *"links"* list to enable iteration over all of the links on the page
* [#63](https://github.com/neocotic/template/issues/63): Add new *"pageWidth"* and *"pageHeight"* standard variables to enable access to the page's dimensions
* [#63](https://github.com/neocotic/template/issues/63): Add new *"plugins"* list to enable iteration over the active browser plugins
* [#63](https://github.com/neocotic/template/issues/63): Add new *"referrer"* standard variable to enable access to the URL of the referring page
* [#63](https://github.com/neocotic/template/issues/63): Add new *"screenWidth"* and *"screenHeight"* standard variables to enable access to the user's screen resolution
* [#63](https://github.com/neocotic/template/issues/63): Add new *"scripts"* list to enable iteration over all of the page's external script sources
* [#63](https://github.com/neocotic/template/issues/63): Add new *"styleSheets"* list to enable iteration over all of the page's external CSS stylesheet sources
* [#63](https://github.com/neocotic/template/issues/63): Add new *"template"* object to enable access to the activated template
* [#63](https://github.com/neocotic/template/issues/63): Deprecate the *"selectionLinks"* list and replace with the new *"selectedLinks"* list
* [#64](https://github.com/neocotic/template/issues/64): Deprecate the *"short"* standard variable and replace with the new *"shorten"* operation
* [#65](https://github.com/neocotic/template/issues/65): Allow easier access to object properties using dot notation
* [#66](https://github.com/neocotic/template/issues/66): Fix bug where some variables are not case-insensitive
* [#67](https://github.com/neocotic/template/issues/67): Fix bug where overwriting an existing file during the export process can corrupt the file
* [#68](https://github.com/neocotic/template/issues/68): Simplify debugging and testing by adding a new Developer Tools section to the Options page
* [#69](https://github.com/neocotic/template/issues/69): Redesign desktop notifications
* [#70](https://github.com/neocotic/template/issues/70): Redesign *Please wait...* animation in popup
* More bug fixes and UI tweaks

2011.12.22, Version 0.3.0.0

* [#48](https://github.com/neocotic/template/issues/48): Add option to change behaviour of the toolbar icon (available in templates via the new *"toolbarPopup"* and *"toolbarFeature"* option tags)
* [#48](https://github.com/neocotic/template/issues/48): Add option to select a default template (available in templates via the new *"toolbarFeatureName"* option tag)
* [#48](https://github.com/neocotic/template/issues/48): Add option to change the style of the toolbar icon to that of the default template (available in templates via the new *"toolbarFeatureDetails"* option tag)
* [#50](https://github.com/neocotic/template/issues/50): Make tags case-insensitive
* [#51](https://github.com/neocotic/template/issues/51): Add new *"dateTime"* simple tag and function to allow formatted date/time
* [#53](https://github.com/neocotic/template/issues/53): Add support for [inline installation][]
* [#54](https://github.com/neocotic/template/issues/54): Replace API calls deprecated by [Chrome 16][]
* [#56](https://github.com/neocotic/template/issues/56): Add new *"decode"* function to decode its previously encoded contents
* Change to [MIT license][]
* Update homepage links
* Patch underlying template technology
* Minor bug fixes

2011.10.20, Version 0.2.4.0

* [#38](https://github.com/neocotic/template/issues/38): Add help documentation for general settings on options page
* [#40](https://github.com/neocotic/template/issues/40): Make template export process no longer require external resource
* [#44](https://github.com/neocotic/template/issues/44): Many minor UI changes in options page

2011.10.10, Version 0.2.3.1

* [#41](https://github.com/neocotic/template/issues/41): Rebrand logo, again...
* [#42](https://github.com/neocotic/template/issues/42): Prevent content script conflicts between version updates

2011.10.07, Version 0.2.3.0

* Rebrand logo and create new promotional images
* [#36](https://github.com/neocotic/template/issues/36): Improve URL derivation when using the context menu
* Update [jQuery][] to v1.6.4

2011.08.08, Version 0.2.2.0

* [#33](https://github.com/neocotic/template/issues/33): Ignore keyboard shortcuts for disabled templates for validation and lookup
* Minor spelling correction

2011.08.05, Version 0.2.1.1

* [#34](https://github.com/neocotic/template/issues/34): Fix bug where notification is displayed when user clicks *"Copy"* button when exporting templates

2011.08.05, Version 0.2.1.0

* Add new predefined Markdown template (disabled by default)
* [#29](https://github.com/neocotic/template/issues/29): Add new *"selectionLinks"* complex tag to allow iteration over links within in current selection
* [#29](https://github.com/neocotic/template/issues/29): Change *"selection"* simple tag to allow access using popup/shortcuts and not just right-click menu
* [#26](https://github.com/neocotic/template/issues/26): Fix minor UI defects in popup
* Minor bug fixes

2011.08.04, Version 0.2.0.1

* [#27](https://github.com/neocotic/template/issues/27): Add new permissions required by [Chrome 13][] to use copy/paste functionality
* [#28](https://github.com/neocotic/template/issues/28): Add copy and paste buttons to the template import and export views
* Minor bug fixes and tweaks

2011.08.03, Version 0.2.0.0

* [#14](https://github.com/neocotic/template/issues/14): Change extension name to *"Template"* to do it better justice
* [#11](https://github.com/neocotic/template/issues/11): Add import/export functionality for templates
* [#17](https://github.com/neocotic/template/issues/17): Add many more images to be used with your custom templates
* [#10](https://github.com/neocotic/template/issues/10): Clean up options page further using tabs
* [#23](https://github.com/neocotic/template/issues/23): Remove supported extensions section on the options page
 * Includes removal of *"management"* permission
* Minor bug fixes and tweaks

2011.07.28, Version 0.1.1.1

* [#21](https://github.com/neocotic/template/issues/21): Fix error caused by using extension on a page where [IE Tab][] is active
* [#21](https://github.com/neocotic/template/issues/21): Redesign compatibility structure to support multiple extensions
* [#21](https://github.com/neocotic/template/issues/21): Add compatibility support for [IE Tab Classic][], [IE Tab Multi (Enhance)][] and [Mozilla Gecko Tab][] extensions

2011.07.27, Version 0.1.1.0

* [#16](https://github.com/neocotic/template/issues/16): Rename the *"cookies"* template simple tag to *"cookiesEnabled"*
* [#16](https://github.com/neocotic/template/issues/16): Add new *"cookies"* template complex tag to allow iteration over cookie names
* [#16](https://github.com/neocotic/template/issues/16): Add new *"cookie"* template function tag to allow access to cookie values
* [#13](https://github.com/neocotic/template/issues/13): Add new *"selection"* template simple tag to allow access to the currently selected text on the page (only available when accessed via the context menu)
* [#18](https://github.com/neocotic/template/issues/18): Update the notification messages to be more generic
* [#15](https://github.com/neocotic/template/issues/15): Add option to disable the context (right-click) menu (available in templates via the new *"contextMenu"* option tag)
* Slightly rearrange the options page

2011.07.26, Version 0.1.0.3

* Rename *"Features"* to *"Templates"* for simplicity
* Add more options (browser, OS and extension information)
* Remove *"Update"* button from options page
 * Automatically updates where appropriate from now on
 * You must still press *"Save & Close"* to persist your changes
* Simplify the process of adding new feature (i.e. templates)

2011.07.21, Version 0.1.0.2

* Fix error generated by *"param"*, *"segment"*, *"fparam"* and *"fsegment"* template functions
* [#2](https://github.com/neocotic/template/issues/2): Fix bug where valid keyboard shortcut inputs were being rejected
* Deprecate the *"originalSource"* template simple tag and replace with the *"originalUrl"* simple tag
* Deprecate the *"source"* template simple tag and replace with the *"url"* simple tag
* Deprecate the *"encoded"* template simple tag and replace with the *"encode"* function which encodes its rendered contents
* Make some minor UI tweaks for options page

2011.07.20, Version 0.1.0.1

* [#8](https://github.com/neocotic/template/issues/8): Fix problem where URL shortener options were being forgotten when browser was closed
* [#8](https://github.com/neocotic/template/issues/8): Add some feedback messages if/when any errors occur when copying a shortened URL (i.e. could not reach URL shortener service)
* [#2](https://github.com/neocotic/template/issues/2): Attempt to make keyboard shortcuts work more consistently

2011.07.19, Version 0.1.0.0

* [#4](https://github.com/neocotic/template/issues/4): Add feature customization including a template system
* [#4](https://github.com/neocotic/template/issues/4): Convert default features to use the new template system
* [#4](https://github.com/neocotic/template/issues/4): Completely rewrite code to dynamically copy parsed templates
* [#4](https://github.com/neocotic/template/issues/4): Redesign Features section of options page to support feature customization
* [#4](https://github.com/neocotic/template/issues/4): Add new help system to options page including documentation on the new template system
* [#7](https://github.com/neocotic/template/issues/7): Add support for context (right-click) menus
* [#6](https://github.com/neocotic/template/issues/6): Add support for [YOURLS][] URL shortener installations
* [#1](https://github.com/neocotic/template/issues/1): Fix [bit.ly][] URL shortener service
* [#5](https://github.com/neocotic/template/issues/5): Allow keyboard shortcuts to be customized
* [#3](https://github.com/neocotic/template/issues/3): Fix OS X keyboard shortcuts
* Major rewrite of code including huge optimization work and performance improvements
* Update [jQuery][] to v1.6.2
* Remove [jQuery][] dependencies from all but the background and options pages to optimize page loads
* Remove support for the French language
* Change how supported extensions are used to be less intrusive
* And lots more...

2011.04.11, Version 0.0.2.1

* Add support for multiple URL shortener services
* Add [OAuth][] support for URL shortener services (enabled by default)
* Add support for [bit.ly][] URL shortener service
* Add new window (target) option for anchor feature
* Change software-specific features (e.g. BBCode) to be disabled by default
* Change key listeners to listen for `keyup` events as opposed to `keydown`
* Add collapsible sections to options page to simplify content
* Complete rewrite of code and file system restructuring for optimization and ease of future improvements/changes
* Include [jQuery][] (v1.5.2 - minified) to minimize code duplication and increase efficiency
* Reduce image sizes for optimization
* Minify JavaScript files for optimization

2011.03.29, Version 0.0.2.0

* Add BBCode feature
* Add Encoded feature
* Implement [IE Tab][] extension compatibility (options are included but not visible yet)
* Add enable/disable feature option functionality
* Add reorder feature option functionality
* Add French language support
* Change images to be more consistent

[bit.ly]: http://bit.ly
[bootstrap]: http://twitter.github.com/bootstrap
[character set]: http://www.iana.org/assignments/character-sets
[chrome 13]: http://code.google.com/chrome/extensions/whats_new.html#13
[chrome 16]: http://code.google.com/chrome/extensions/whats_new.html#16
[chrome dev]: http://www.chromium.org/getting-involved/dev-channel
[coffeescript]: http://coffeescript.org
[content security policy]: http://code.google.com/chrome/extensions/contentSecurityPolicy.html
[date-ext]: http://neocotic.com/date-ext
[glyphicons]: http://glyphicons.com
[goo.gl]: http://goo.gl
[ie tab]: https://chrome.google.com/webstore/detail/hehijbfgiekmjfkfjpbkbammjbdenadd
[ie tab classic]: https://chrome.google.com/webstore/detail/miedgcmlgpmdagojnnbemlkgidepfjfi
[ie tab multi (enhance)]: https://chrome.google.com/webstore/detail/fnfnbeppfinmnjnjhedifcfllpcfgeea
[inline installation]: http://code.google.com/chrome/webstore/docs/inline_installation.html
[jquery]: http://jquery.com
[manifest version]: http://code.google.com/chrome/extensions/manifestVersion.html
[markdown]: http://en.wikipedia.org/wiki/Markdown
[mit license]: http://www.opensource.org/licenses/mit-license.php
[mozilla gecko tab]: https://chrome.google.com/webstore/detail/icoloanbecehinobmflpeglknkplbfbm
[mustache.js]: https://github.com/janl/mustache.js
[oauth]: http://oauth.net
[oauth 2.0]: http://oauth.net/2
[tmpl.at]: http://tmpl.at
[translation]: http://i18n.tmpl.at
[yourls]: http://yourls.org