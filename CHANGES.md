YYYY.MM.DD, Version 1.0.0

* Full release!
* [#20](https://github.com/neocotic/template/issues/20): Add *"Revoke Access"* button to [goo.gl](http://goo.gl)'s configuration on the Options page
* [#35](https://github.com/neocotic/template/issues/35): Tidy naming and documentation of the code
* [#47](https://github.com/neocotic/template/issues/47): Simplify internationalization code
* [#48](https://github.com/neocotic/template/issues/48): Add option to keep popup open after clicking a template (available in templates via the new *"toolbarPopupClose"* option tag)
* [#48](https://github.com/neocotic/template/issues/48): Deprecate the *"toolbarFeature"* template option tag and replace with the *"toolbarTemplate"* option tag
* [#48](https://github.com/neocotic/template/issues/48): Deprecate the *"toolbarFeatureDetails"* template option tag and replace with the *"toolbarTemplateDetails"* option tag
* [#48](https://github.com/neocotic/template/issues/48): Deprecate the *"toolbarFeatureName"* template option tag and replace with the *"toolbarTemplateName"* option tag
* [#49](https://github.com/neocotic/template/issues/49): Add new *"count"* simple tag to allow access to the total number of templates
* [#49](https://github.com/neocotic/template/issues/49): Add new *"customCount"* simple tag to allow access to the total number of custom templates (i.e. excluding predefined)
* [#49](https://github.com/neocotic/template/issues/49): Add new *"popular"* complex tag to allow access to the details of the most popular template
* [#49](https://github.com/neocotic/template/issues/49): Restructure template data stored in `localStorage`
* [#52](https://github.com/neocotic/template/issues/52): Completely rewrite code in [CoffeeScript](http://coffeescript.org)
* [#52](https://github.com/neocotic/template/issues/52): Update build process
* Bug fixes and UI tweaks

2011.12.22, Version 0.3.0.0

* [#48](https://github.com/neocotic/template/issues/48): Add option to change behaviour of the toolbar icon (available in templates via the new *"toolbarPopup"* and *"toolbarFeature"* option tags)
* [#48](https://github.com/neocotic/template/issues/48): Add option to change the style of the toolbar icon to that of the  (available in templates via the new *"toolbarFeatureDetails"* option tag)
* [#48](https://github.com/neocotic/template/issues/48): Add option to select a default template (available in templates via the new *"toolbarFeatureName"* option tag)
* [#50](https://github.com/neocotic/template/issues/50): Make tags case-insensitive
* [#51](https://github.com/neocotic/template/issues/51): Add new *"dateTime"* simple tag and function to allow formatted date/time
* [#53](https://github.com/neocotic/template/issues/53): Add support for [inline installation](http://code.google.com/chrome/webstore/docs/inline_installation.html)
* [#54](https://github.com/neocotic/template/issues/54): Replace API calls deprecated by [Chrome 16](http://code.google.com/chrome/extensions/whats_new.html#16)
* [#56](https://github.com/neocotic/template/issues/56): Add new *"decode"* function to decode its previously encoded contents
* Change to [MIT license](http://www.opensource.org/licenses/mit-license.php)
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
* Update [jQuery](http://jquery.com) to v1.6.4

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

* [#27](https://github.com/neocotic/template/issues/27): Add new permissions required by [Chrome 13](http://code.google.com/chrome/extensions/whats_new.html#13) to use copy/paste functionality
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

* [#21](https://github.com/neocotic/template/issues/21): Fix error caused by using extension on a page where [IE Tab](https://chrome.google.com/webstore/detail/hehijbfgiekmjfkfjpbkbammjbdenadd) is active
* [#21](https://github.com/neocotic/template/issues/21): Redesign compatibility structure to support multiple extensions
* [#21](https://github.com/neocotic/template/issues/21): Add compatibility support for [IE Tab Classic](https://chrome.google.com/webstore/detail/miedgcmlgpmdagojnnbemlkgidepfjfi), [IE Tab Multi (Enhance)](https://chrome.google.com/webstore/detail/fnfnbeppfinmnjnjhedifcfllpcfgeea) and [Mozilla Gecko Tab](https://chrome.google.com/webstore/detail/icoloanbecehinobmflpeglknkplbfbm) extensions

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
* [#6](https://github.com/neocotic/template/issues/6): Add support for [YOURLS](http://yourls.org) URL shortener installations
* [#1](https://github.com/neocotic/template/issues/1): Fix [bit.ly](http://bit.ly) URL shortener service
* [#5](https://github.com/neocotic/template/issues/5): Allow keyboard shortcuts to be customized
* [#3](https://github.com/neocotic/template/issues/3): Fix OS X keyboard shortcuts
* Major rewrite of code including huge optimization work and performance improvements
* Update [jQuery](http://jquery.com) to v1.6.2
* Remove [jQuery](http://jquery.com) dependencies from all but the background and options pages to optimize page loads
* Remove support for the French language
* Change how supported extensions are used to be less intrusive
* And lots more...

2011.04.11, Version 0.0.2.1

* Add support for multiple URL shortener services
* Add [OAuth](http://oauth.net) support for URL shortener services (enabled by default)
* Add support for [bit.ly](http://bit.ly) URL shortener service
* Add new window (target) option for anchor feature
* Change software-specific features (e.g. BBCode) to be disabled by default
* Change key listeners to listen for `keyup` events as opposed to `keydown`
* Add collapsible sections to options page to simplify content
* Complete rewrite of code and file system restructuring for optimization and ease of future improvements/changes
* Include [jQuery](http://jquery.com) (v1.5.2 - minified) to minimize code duplication and increase efficiency
* Reduce image sizes for optimization
* Minify JavaScript files for optimization

2011.03.29, Version 0.0.2.0

* Add BBCode feature
* Add Encoded feature
* Implement [IE Tab](https://chrome.google.com/webstore/detail/hehijbfgiekmjfkfjpbkbammjbdenadd) extension compatibility (options are included but not visible yet)
* Add enable/disable feature option functionality
* Add reorder feature option functionality
* Add French language support
* Change images to be more consistent