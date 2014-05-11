## Version 1.2.8, 2014.05.11

* [#217](https://github.com/emplate-extension/template-chrome/issues/217): Update [bit.ly][] configuration due to recent security breach

## Version 1.2.7, 2014.02.26

* [#201](https://github.com/emplate-extension/template-chrome/issues/201): Restyle keyboard shortcuts in popup and options page
* [#204](https://github.com/emplate-extension/template-chrome/issues/204): Use rich desktop notifications
* [#206](https://github.com/emplate-extension/template-chrome/issues/206): Update a [YOURLS][] Wiki link
* [#208](https://github.com/emplate-extension/template-chrome/issues/208): Fix overlapping UI bug in popup
* [#209](https://github.com/emplate-extension/template-chrome/issues/209): Fix bug preventing OAuth flow completing
* Update build dependencies

## Version 1.2.6, 2013.05.20

* [#170](https://github.com/emplate-extension/template-chrome/issues/170): Add tooltips to explain button states
* [#193](https://github.com/emplate-extension/template-chrome/issues/193): Add new **wordCount** operation to count the words in a string
* [#198](https://github.com/emplate-extension/template-chrome/issues/198): Add new **meta** operation to access specific meta information
* [#199](https://github.com/emplate-extension/template-chrome/issues/199): Add new **html** standard variable to enable access to the entire pages HTML
* [#199](https://github.com/emplate-extension/template-chrome/issues/199): Add new **markdown** standard variable to enable access to the entire contents of a page as [Markdown][]
* [#199](https://github.com/emplate-extension/template-chrome/issues/199): Add new **text** standard variable to enable access to the entire pages text
* Minor bug fixes and tweaks

## Version 1.2.5, 2013.05.14

* [#181](https://github.com/template-extension/template-chrome/issues/181): Add new operations for evaluating [XPath][] expressions
* [#183](https://github.com/template-extension/template-chrome/issues/183): Add new objects for accessing [Web Storage][]
* [#184](https://github.com/template-extension/template-chrome/issues/184): Update [html.md][] to v2.1.1
* [#184](https://github.com/template-extension/template-chrome/issues/184): Add options for configuring HTML to Markdown conversion
* [#187](https://github.com/template-extension/template-chrome/issues/187): Make the Anchor Tags options more generic
* [#187](https://github.com/template-extension/template-chrome/issues/187): Deprecate the **anchorTarget** option and replace with the **linksTarget** option
* [#187](https://github.com/template-extension/template-chrome/issues/187): Deprecate the **anchorTitle** option and replace with the **linksTitle** option
* [#189](https://github.com/template-extension/template-chrome/issues/189): Update the extension homepage to <http://template-extension.org>
* Minor bug fixes and UI tweaks

## Version 1.2.4, 2013.05.07

* [#179](https://github.com/template-extension/template-chrome/issues/179): Fix critical bug for Linux systems

## Version 1.2.3, 2013.05.06

* [#176](https://github.com/template-extension/template-chrome/issues/176): Fix bug preventing options from being saved correctly

## Version 1.2.2, 2013.05.04

* [#168](https://github.com/template-extension/template-chrome/issues/168): Fix bug on OS X causing Windows keyboard shortcut modifiers to be displayed
* [#169](https://github.com/template-extension/template-chrome/issues/169): Update [html.md][] to v2.1.0
* [#171](https://github.com/template-extension/template-chrome/issues/171): Fix bug which caused sections to be case-sensitive

## Version 1.2.1, 2013.04.29

* [#109](https://github.com/template-extension/template-chrome/issues/109): Upgrade feedback widget from [UserVoice][] to newer version to avoid CSP workaround
* [#119](https://github.com/template-extension/template-chrome/issues/119): Update [mustache.js][] to v0.7.2
* [#133](https://github.com/template-extension/template-chrome/issues/133): Update [jQuery][] to v1.9.1
* [#133](https://github.com/template-extension/template-chrome/issues/133): Update [Bootstrap][] to v2.3.1
* [#136](https://github.com/template-extension/template-chrome/issues/136): Add [Underscore.js][] v1.4.4 to allow for cleaner code and remove duplication
* [#137](https://github.com/template-extension/template-chrome/issues/137): Add [Async][] v0.2.7 to greatly simplify asynchronous code
* [#141](https://github.com/template-extension/template-chrome/issues/141): Change CSP to prevent errors caused by the [UserVoice][] feedback widget
* [#143](https://github.com/template-extension/template-chrome/issues/143): Dialog windows to provide initial focus to first field when opened
* [#144](https://github.com/template-extension/template-chrome/issues/144): Make trace logs cleaner
* [#145](https://github.com/template-extension/template-chrome/issues/145): Fix bug where whitespace in templates was being ignored
* [#146](https://github.com/template-extension/template-chrome/issues/146): Support bulk enable & disable operations
* [#153](https://github.com/template-extension/template-chrome/issues/153): Fix "Save As..." functionality in export process
* [#155](https://github.com/template-extension/template-chrome/issues/155): Add new **escape** operation to escape strings for insertion into HTML
* [#155](https://github.com/template-extension/template-chrome/issues/155): Add new **unescape** operation to perform the opposite action of **escape**
* [#162](https://github.com/template-extension/template-chrome/issues/162): Add new **locale** standard variable to enable access to the detected [ISO 639][] language code
* [#166](https://github.com/template-extension/template-chrome/issues/166): Simplify how template icons are managed internally
* Massive re-write of a lot of code to make it simpler and more optimized
* Huge number of bug fixes and UI tweaks
* Some nice new undocumented features

## Version 1.2.0, 2013.01.15

* [#110](https://github.com/template-extension/template-chrome/issues/110): Replace calls to deprecated chrome API methods
* [#111](https://github.com/template-extension/template-chrome/issues/111): Update [Bootstrap][] to v2.2.2
* [#115](https://github.com/template-extension/template-chrome/issues/115): Add new operations for query selectors
* [#116](https://github.com/template-extension/template-chrome/issues/116): Redesign Templates tab on Options page
* [#117](https://github.com/template-extension/template-chrome/issues/117): Improve build process and restructure code to simplify support for other browsers
* [#120](https://github.com/template-extension/template-chrome/issues/120): Update [jQuery][] to v1.8.3
* [#120](https://github.com/template-extension/template-chrome/issues/120): Update [jQuery URL Parser][] to v2.2.1
* [#120](https://github.com/template-extension/template-chrome/issues/120): Update [html.md][] to v2.0.1
* [#130](https://github.com/template-extension/template-chrome/issues/130): Add new configuration file to simplify future changes
* Plenty of bug fixes and UI tweaks

## Version 1.1.4, 2012.05.31

* [#108](https://github.com/template-extension/template-chrome/issues/108): Improve inline installation compatibility

## Version 1.1.3, 2012.05.30

* Relocate new donation button and add tooltip

## Version 1.1.2, 2012.05.29

* [#107](https://github.com/template-extension/template-chrome/issues/107): Add donation button to footer of Options page

## Version 1.1.1, 2012.05.25

* [#106](https://github.com/template-extension/template-chrome/issues/106): No longer remove `btn-primary` class from inline installation buttons on homepage
* Minor i18n tweaks

## Version 1.1.0, 2012.05.25

* [#98](https://github.com/template-extension/template-chrome/issues/98): Add option to automatically paste Template output into the input field focused when using a keyboard shortcut (available in templates via the new **shortcutsPaste** option)
* [#98](https://github.com/template-extension/template-chrome/issues/98): Change keyboard shortcut detection to `keydown` from `keyup`
* [#102](https://github.com/template-extension/template-chrome/issues/102): Update [manifest version][] to 2
* [#102](https://github.com/template-extension/template-chrome/issues/102): Provide and support a [Content Security Policy][]
* [#103](https://github.com/template-extension/template-chrome/issues/103): Move all CSS and inline styles into individual external files
* [#104](https://github.com/template-extension/template-chrome/issues/104): Update [Bootstrap][] to v2.0.3
* [#104](https://github.com/template-extension/template-chrome/issues/104): Many minor UI fixes and tweaks
* [#105](https://github.com/template-extension/template-chrome/issues/105): Redesign popup to be more consistent with look and feel of the Options page
* [#105](https://github.com/template-extension/template-chrome/issues/105): Replace all template icons with the [Glyphicons][] set included in [Bootstrap][]
* [#105](https://github.com/template-extension/template-chrome/issues/105): Remove toolbar button text/icon editing functionality and make the **toolbarStyle** option obsolete
* Minor fixes and tweaks

## Version 1.0.10, 2012.05.14

* [#101](https://github.com/template-extension/template-chrome/issues/101): Fix bug where **capitalise** operation wasn't working

## Version 1.0.9, 2012.05.09

* [#97](https://github.com/template-extension/template-chrome/issues/97): Update build process to minify i18n files for distribution
* [#99](https://github.com/template-extension/template-chrome/issues/99): Add new operations for string manipulation
* Update [date-ext][] to v1.0.2

## Version 1.0.8, 2012.04.20

* [#92](https://github.com/template-extension/template-chrome/issues/92): Improve error handling when saving export data to a file
* [#94](https://github.com/template-extension/template-chrome/issues/94): Add new **linkHTML** standard variable to enable access to the HTML behind the right-clicked link
* [#94](https://github.com/template-extension/template-chrome/issues/94): Add new **linkMarkdown** standard variable to enable access to contents of the right-clicked link as [Markdown][]
* [#94](https://github.com/template-extension/template-chrome/issues/94): Add new **linkText** standard variable to enable access to the text of the right-clicked link
* [#95](https://github.com/template-extension/template-chrome/issues/95): Add option to automatically paste Template output into right-clicked input field (available in templates via the new **menuPaste** option)
* Update [jQuery][] to v1.7.2
* Update [mustache.js][] to v0.4.2
* Minor fixes

## Version 1.0.7, 2012.03.16

* [#90](https://github.com/template-extension/template-chrome/issues/90): Fix bug where wrong window is used to populate template data in [Chrome dev][]
* [#91](https://github.com/template-extension/template-chrome/issues/91): Add new **tabs** list to enable iteration over the URLs of every tab in the current window

## Version 1.0.6, 2012.03.15

* [#87](https://github.com/template-extension/template-chrome/issues/87): Fix bug where URL and all derived variables are automatically decoded
* [#88](https://github.com/template-extension/template-chrome/issues/88): Add new *Selection in Markdown* predefined template (disabled by default)
* [#89](https://github.com/template-extension/template-chrome/issues/89): Fix bug where whitespace after an operation is being ignored
* Minor UI fixes

## Version 1.0.5, 2012.03.12

* [#82](https://github.com/template-extension/template-chrome/issues/82): Add new **selectionMarkdown** standard variable to enable access to the current selection formatted as [Markdown][]
* [#83](https://github.com/template-extension/template-chrome/issues/83): Improve way in which web service configurations are stored and retrieved
* [#85](https://github.com/template-extension/template-chrome/issues/85): Improve help documentation for certain fields in the Options page
* [#86](https://github.com/template-extension/template-chrome/issues/86): Add user feedback system to the Options page

## Version 1.0.4, 2012.03.07

* [#80](https://github.com/template-extension/template-chrome/issues/80): Tidy i18n bundle to help with [new translation process][translation]
* [#81](https://github.com/template-extension/template-chrome/issues/81): Fix bug where unregistered keyboard shortcuts still trigger desktop notification when using modifier

## Version 1.0.3, 2012.03.06

* [#76](https://github.com/template-extension/template-chrome/issues/76): Add new **selectionHTML** standard variable to enable access to the HTML behind the current selection
* [#76](https://github.com/template-extension/template-chrome/issues/76): Add new **selectedImages** list to enable iteration over images within in current selection
* [#76](https://github.com/template-extension/template-chrome/issues/76): Add new **images** list to enable iteration over all of the images on the page 
* [#77](https://github.com/template-extension/template-chrome/issues/77): Fix bug preventing access to page-derived template variables
* [#78](https://github.com/template-extension/template-chrome/issues/78): Remove duplicate URLs from certain lists

## Version 1.0.1, 2012.03.05

* [#71](https://github.com/template-extension/template-chrome/issues/71): Make [bit.ly][] the default URL shortener
* [#71](https://github.com/template-extension/template-chrome/issues/71): Make unauthenticated [bit.ly][] use the [tmpl.at][] custom domain
* [#72](https://github.com/template-extension/template-chrome/issues/72): Add [OAuth][] support for [bit.ly][]
* [#72](https://github.com/template-extension/template-chrome/issues/72): Add new **bitlyAccount** option to determine whether or not you are logged in to [bit.ly][]
* [#72](https://github.com/template-extension/template-chrome/issues/72): Remove the **bitlyApiKey** and **bitlyUsername** options
* [#73](https://github.com/template-extension/template-chrome/issues/73): Add new **yourlsAuthentication** option to determine how the [YOURLS][] URL shortener is being authenticated
* [#73](https://github.com/template-extension/template-chrome/issues/73): Improve UI on Options page in some places
* [#74](https://github.com/template-extension/template-chrome/issues/74): Implement support for [OAuth 2.0][]
* [#75](https://github.com/template-extension/template-chrome/issues/75): Improve extension compatibility system
* Minor bug fixes and UI tweaks

## Version 1.0.0, 2012.02.17

* **Full release!**
* [#20](https://github.com/template-extension/template-chrome/issues/20): Add *Login*/*Logout* button to [goo.gl][]'s configuration on the Options page
* [#20](https://github.com/template-extension/template-chrome/issues/20): Deprecate the **googlOAuth** option and replace with the new **googlAccount** option
* [#35](https://github.com/template-extension/template-chrome/issues/35): Ensure code and documentation quality and standards are high
* [#47](https://github.com/template-extension/template-chrome/issues/47): Completely redesign and simplify the Options page
* [#48](https://github.com/template-extension/template-chrome/issues/48): Add option to keep popup open after clicking a template (available in templates via the new **toolbarClose** option)
* [#48](https://github.com/template-extension/template-chrome/issues/48): Deprecate the **toolbarFeature** option (still available by inverting the **toolbarPopup** option)
* [#48](https://github.com/template-extension/template-chrome/issues/48): Deprecate the **toolbarFeatureDetails** option and replace with the **toolbarStyle** option
* [#48](https://github.com/template-extension/template-chrome/issues/48): Deprecate the **toolbarFeatureName** option and replace with the **toolbarKey** option
* [#49](https://github.com/template-extension/template-chrome/issues/49): Add new **count** standard variable to enable access to the total number of templates
* [#49](https://github.com/template-extension/template-chrome/issues/49): Add new **customCount** standard variable to enable access to the total number of custom templates (i.e. excluding predefined)
* [#49](https://github.com/template-extension/template-chrome/issues/49): Add new **popular** object to enable access to the details of the most popular template
* [#49](https://github.com/template-extension/template-chrome/issues/49): Reorganize template data stored in `localStorage`
* [#52](https://github.com/template-extension/template-chrome/issues/52): Completely rewrite code in [CoffeeScript][]
* [#52](https://github.com/template-extension/template-chrome/issues/52): Update build process
* [#58](https://github.com/template-extension/template-chrome/issues/58): Remove requirement of names for templates
* [#59](https://github.com/template-extension/template-chrome/issues/59): Reorganize option data stored in `localStorage`
* [#60](https://github.com/template-extension/template-chrome/issues/60): Automically save changes on the Options page
* [#61](https://github.com/template-extension/template-chrome/issues/61): Add new **coords** object to enable access to the user's geolocation
* [#62](https://github.com/template-extension/template-chrome/issues/62): Add Options link to bottom of context menu (available in templates via the new **menuOptions** option)
* [#62](https://github.com/template-extension/template-chrome/issues/62): Add Options link to bottom of popup (available in templates via the new **toolbarOptions** option)
* [#62](https://github.com/template-extension/template-chrome/issues/62): Deprecate the **contextMenu** option and replace with the new **menu** option
* [#63](https://github.com/template-extension/template-chrome/issues/63): Add new **author** standard variable to enable access to the author from the page's meta information
* [#63](https://github.com/template-extension/template-chrome/issues/63): Add new **characterSet** standard variable to enable access to the [character set][]
* [#63](https://github.com/template-extension/template-chrome/issues/63): Add new **description** standard variable to enable access to the description from the page's meta information
* [#63](https://github.com/template-extension/template-chrome/issues/63): Add new **depth** standard variable to enable access to the colour depth of the user's screen
* [#63](https://github.com/template-extension/template-chrome/issues/63): Add new **keywords** list to enable iteration over the keywords from the page's meta information
* [#63](https://github.com/template-extension/template-chrome/issues/63): Add new **lastModified** standard variable and operation to enable access to the potentially formatted last modified date/time
* [#63](https://github.com/template-extension/template-chrome/issues/63): Add new **links** list to enable iteration over all of the links on the page
* [#63](https://github.com/template-extension/template-chrome/issues/63): Add new **pageWidth** and **pageHeight** standard variables to enable access to the page's dimensions
* [#63](https://github.com/template-extension/template-chrome/issues/63): Add new **plugins** list to enable iteration over the active browser plugins
* [#63](https://github.com/template-extension/template-chrome/issues/63): Add new **referrer** standard variable to enable access to the URL of the referring page
* [#63](https://github.com/template-extension/template-chrome/issues/63): Add new **screenWidth** and **screenHeight** standard variables to enable access to the user's screen resolution
* [#63](https://github.com/template-extension/template-chrome/issues/63): Add new **scripts** list to enable iteration over all of the page's external script sources
* [#63](https://github.com/template-extension/template-chrome/issues/63): Add new **styleSheets** list to enable iteration over all of the page's external CSS stylesheet sources
* [#63](https://github.com/template-extension/template-chrome/issues/63): Add new **template** object to enable access to the activated template
* [#63](https://github.com/template-extension/template-chrome/issues/63): Deprecate the **selectionLinks** list and replace with the new **selectedLinks** list
* [#64](https://github.com/template-extension/template-chrome/issues/64): Deprecate the **short** standard variable and replace with the new **shorten** operation
* [#65](https://github.com/template-extension/template-chrome/issues/65): Allow easier access to object properties using dot notation
* [#66](https://github.com/template-extension/template-chrome/issues/66): Fix bug where some variables are not case-insensitive
* [#67](https://github.com/template-extension/template-chrome/issues/67): Fix bug where overwriting an existing file during the export process can corrupt the file
* [#68](https://github.com/template-extension/template-chrome/issues/68): Simplify debugging and testing by adding a new Developer Tools section to the Options page
* [#69](https://github.com/template-extension/template-chrome/issues/69): Redesign desktop notifications
* [#70](https://github.com/template-extension/template-chrome/issues/70): Redesign *Please wait...* animation in popup
* More bug fixes and UI tweaks

## Version 0.3.0.0, 2011.12.22

* [#48](https://github.com/template-extension/template-chrome/issues/48): Add option to change behaviour of the toolbar icon (available in templates via the new **toolbarPopup** and **toolbarFeature** option tags)
* [#48](https://github.com/template-extension/template-chrome/issues/48): Add option to select a default template (available in templates via the new **toolbarFeatureName** option tag)
* [#48](https://github.com/template-extension/template-chrome/issues/48): Add option to change the style of the toolbar icon to that of the default template (available in templates via the new **toolbarFeatureDetails** option tag)
* [#50](https://github.com/template-extension/template-chrome/issues/50): Make tags case-insensitive
* [#51](https://github.com/template-extension/template-chrome/issues/51): Add new **dateTime** simple tag and function to allow formatted date/time
* [#53](https://github.com/template-extension/template-chrome/issues/53): Add support for [inline installation][]
* [#54](https://github.com/template-extension/template-chrome/issues/54): Replace API calls deprecated by [Chrome 16][]
* [#56](https://github.com/template-extension/template-chrome/issues/56): Add new **decode** function to decode its previously encoded contents
* Change to [MIT license][]
* Update homepage links
* Patch underlying template technology
* Minor bug fixes

## Version 0.2.4.0, 2011.10.20

* [#38](https://github.com/template-extension/template-chrome/issues/38): Add help documentation for general settings on options page
* [#40](https://github.com/template-extension/template-chrome/issues/40): Make template export process no longer require external resource
* [#44](https://github.com/template-extension/template-chrome/issues/44): Many minor UI changes in options page

## Version 0.2.3.1, 2011.10.10

* [#41](https://github.com/template-extension/template-chrome/issues/41): Rebrand logo, again...
* [#42](https://github.com/template-extension/template-chrome/issues/42): Prevent content script conflicts between version updates

## Version 0.2.3.0, 2011.10.07

* Rebrand logo and create new promotional images
* [#36](https://github.com/template-extension/template-chrome/issues/36): Improve URL derivation when using the context menu
* Update [jQuery][] to v1.6.4

## Version 0.2.2.0, 2011.08.08

* [#33](https://github.com/template-extension/template-chrome/issues/33): Ignore keyboard shortcuts for disabled templates for validation and lookup
* Minor spelling correction

## Version 0.2.1.1, 2011.08.05

* [#34](https://github.com/template-extension/template-chrome/issues/34): Fix bug where notification is displayed when user clicks *Copy* button when exporting templates

## Version 0.2.1.0, 2011.08.05

* Add new predefined Markdown template (disabled by default)
* [#29](https://github.com/template-extension/template-chrome/issues/29): Add new **selectionLinks** complex tag to allow iteration over links within in current selection
* [#29](https://github.com/template-extension/template-chrome/issues/29): Change **selection** simple tag to allow access using popup/shortcuts and not just right-click menu
* [#26](https://github.com/template-extension/template-chrome/issues/26): Fix minor UI defects in popup
* Minor bug fixes

## Version 0.2.0.1, 2011.08.04

* [#27](https://github.com/template-extension/template-chrome/issues/27): Add new permissions required by [Chrome 13][] to use copy/paste functionality
* [#28](https://github.com/template-extension/template-chrome/issues/28): Add copy and paste buttons to the template import and export views
* Minor bug fixes and tweaks

## Version 0.2.0.0, 2011.08.03

* [#14](https://github.com/template-extension/template-chrome/issues/14): Change extension name to *Template* to do it better justice
* [#11](https://github.com/template-extension/template-chrome/issues/11): Add import/export functionality for templates
* [#17](https://github.com/template-extension/template-chrome/issues/17): Add many more images to be used with your custom templates
* [#10](https://github.com/template-extension/template-chrome/issues/10): Clean up options page further using tabs
* [#23](https://github.com/template-extension/template-chrome/issues/23): Remove supported extensions section on the options page
 * Includes removal of *management* permission
* Minor bug fixes and tweaks

## Version 0.1.1.1, 2011.07.28

* [#21](https://github.com/template-extension/template-chrome/issues/21): Fix error caused by using extension on a page where [IE Tab][] is active
* [#21](https://github.com/template-extension/template-chrome/issues/21): Redesign compatibility structure to support multiple extensions
* [#21](https://github.com/template-extension/template-chrome/issues/21): Add compatibility support for [IE Tab Classic][], [IE Tab Multi (Enhance)][] and [Mozilla Gecko Tab][] extensions

## Version 0.1.1.0, 2011.07.27

* [#16](https://github.com/template-extension/template-chrome/issues/16): Rename the **cookies** template simple tag to **cookiesEnabled**
* [#16](https://github.com/template-extension/template-chrome/issues/16): Add new **cookies** template complex tag to allow iteration over cookie names
* [#16](https://github.com/template-extension/template-chrome/issues/16): Add new **cookie** template function tag to allow access to cookie values
* [#13](https://github.com/template-extension/template-chrome/issues/13): Add new **selection** template simple tag to allow access to the currently selected text on the page (only available when accessed via the context menu)
* [#18](https://github.com/template-extension/template-chrome/issues/18): Update the notification messages to be more generic
* [#15](https://github.com/template-extension/template-chrome/issues/15): Add option to disable the context (right-click) menu (available in templates via the new **contextMenu** option tag)
* Slightly rearrange the options page

## Version 0.1.0.3, 2011.07.26

* Rename *Features* to *Templates* for simplicity
* Add more options (browser, OS and extension information)
* Remove *Update* button from options page
 * Automatically updates where appropriate from now on
 * You must still press *Save & Close* to persist your changes
* Simplify the process of adding new feature (i.e. templates)

## Version 0.1.0.2, 2011.07.21

* Fix error generated by **param**, **segment**, **fparam** and **fsegment** template functions
* [#2](https://github.com/template-extension/template-chrome/issues/2): Fix bug where valid keyboard shortcut inputs were being rejected
* Deprecate the **originalSource** template simple tag and replace with the **originalUrl** simple tag
* Deprecate the **source** template simple tag and replace with the **url** simple tag
* Deprecate the **encoded** template simple tag and replace with the **encode** function which encodes its rendered contents
* Make some minor UI tweaks for options page

## Version 0.1.0.1, 2011.07.20

* [#8](https://github.com/template-extension/template-chrome/issues/8): Fix problem where URL shortener options were being forgotten when browser was closed
* [#8](https://github.com/template-extension/template-chrome/issues/8): Add some feedback messages if/when any errors occur when copying a shortened URL (i.e. could not reach URL shortener service)
* [#2](https://github.com/template-extension/template-chrome/issues/2): Attempt to make keyboard shortcuts work more consistently

## Version 0.1.0.0, 2011.07.19

* [#4](https://github.com/template-extension/template-chrome/issues/4): Add feature customization including a template system
* [#4](https://github.com/template-extension/template-chrome/issues/4): Convert default features to use the new template system
* [#4](https://github.com/template-extension/template-chrome/issues/4): Completely rewrite code to dynamically copy parsed templates
* [#4](https://github.com/template-extension/template-chrome/issues/4): Redesign Features section of options page to support feature customization
* [#4](https://github.com/template-extension/template-chrome/issues/4): Add new help system to options page including documentation on the new template system
* [#7](https://github.com/template-extension/template-chrome/issues/7): Add support for context (right-click) menus
* [#6](https://github.com/template-extension/template-chrome/issues/6): Add support for [YOURLS][] URL shortener installations
* [#1](https://github.com/template-extension/template-chrome/issues/1): Fix [bit.ly][] URL shortener service
* [#5](https://github.com/template-extension/template-chrome/issues/5): Allow keyboard shortcuts to be customized
* [#3](https://github.com/template-extension/template-chrome/issues/3): Fix OS X keyboard shortcuts
* Major rewrite of code including huge optimization work and performance improvements
* Update [jQuery][] to v1.6.2
* Remove [jQuery][] dependencies from all but the background and options pages to optimize page loads
* Remove support for the French language
* Change how supported extensions are used to be less intrusive
* And lots more...

## Version 0.0.2.1, 2011.04.11

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

## Version 0.0.2.0, 2011.03.29

* Add BBCode feature
* Add Encoded feature
* Implement [IE Tab][] extension compatibility (options are included but not visible yet)
* Add enable/disable feature option functionality
* Add reorder feature option functionality
* Add French language support
* Change images to be more consistent

[async]: https://github.com/caolan/async
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
[html.md]: http://neocotic.com/html.md
[ie tab]: https://chrome.google.com/webstore/detail/hehijbfgiekmjfkfjpbkbammjbdenadd
[ie tab classic]: https://chrome.google.com/webstore/detail/miedgcmlgpmdagojnnbemlkgidepfjfi
[ie tab multi (enhance)]: https://chrome.google.com/webstore/detail/fnfnbeppfinmnjnjhedifcfllpcfgeea
[inline installation]: http://code.google.com/chrome/webstore/docs/inline_installation.html
[iso 639]: http://en.wikipedia.org/wiki/ISO_639_macrolanguage
[jquery]: http://jquery.com
[jquery url parser]: https://github.com/allmarkedup/jQuery-URL-Parser
[manifest version]: http://code.google.com/chrome/extensions/manifestVersion.html
[markdown]: http://en.wikipedia.org/wiki/Markdown
[mit license]: http://www.opensource.org/licenses/mit-license.php
[mozilla gecko tab]: https://chrome.google.com/webstore/detail/icoloanbecehinobmflpeglknkplbfbm
[mustache.js]: https://github.com/janl/mustache.js
[oauth]: http://oauth.net
[oauth 2.0]: http://oauth.net/2
[tmpl.at]: http://tmpl.at
[translation]: http://i18n.tmpl.at
[underscore.js]: http://underscorejs.org
[uservoice]: https://www.uservoice.com
[web storage]: http://dev.w3.org/html5/webstorage/
[xpath]: http://en.wikipedia.org/wiki/XPath
[yourls]: http://yourls.org
