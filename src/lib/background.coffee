# [Template](http://neocotic.com/template)  
# (c) 2012 Alasdair Mercer  
# Freely distributable under the MIT license.  
# For all details and documentation:  
# <http://neocotic.com/template>

# Private constants
# -----------------

# List of blacklisted extension IDs that should be prevented from making
# external requests to Template.
BLACKLIST         = []
# Predefined templates to be used by default.
DEFAULT_TEMPLATES = [
    content:  '{url}'
    enabled:  yes
    image:    'tmpl_globe'
    index:    0
    key:      'PREDEFINED.00001'
    readOnly: yes
    shortcut: 'U'
    title:    i18n.get 'default_template_url'
    usage:    0
  ,
    content:  '{#shorten}{url}{/shorten}'
    enabled:  yes
    image:    'tmpl_link'
    index:    1
    key:      'PREDEFINED.00002'
    readOnly: yes
    shortcut: 'S'
    title:    i18n.get 'default_template_short'
    usage:    0
  ,
    content:  "<a href=\"{{url}}\"{#anchorTarget}
 target=\"_blank\"{/anchorTarget}{#anchorTitle}
 title=\"{{title}}\"{/anchorTitle}>{{title}}</a>"
    enabled:  yes
    image:    'tmpl_html'
    index:    2
    key:      'PREDEFINED.00003'
    readOnly: yes
    shortcut: 'A'
    title:    i18n.get 'default_template_anchor'
    usage:    0
  ,
    content:  '{#encode}{url}{/encode}'
    enabled:  yes
    image:    'tmpl_component'
    index:    3
    key:      'PREDEFINED.00004'
    readOnly: yes
    shortcut: 'E'
    title:    i18n.get 'default_template_encoded'
    usage:    0
  ,
    content:  '[url={url}]{title}[/url]'
    enabled:  no
    image:    'tmpl_discussion'
    index:    5
    key:      'PREDEFINED.00005'
    readOnly: yes
    shortcut: 'B'
    title:    i18n.get 'default_template_bbcode'
    usage:    0
  ,
    content:  '[{title}]({url})'
    enabled:  no
    image:    'tmpl_discussion'
    index:    4
    key:      'PREDEFINED.00006'
    readOnly: yes
    shortcut: 'M'
    title:    i18n.get 'default_template_markdown'
    usage:    0
  ,
    content:  '{selectionMarkdown}'
    enabled:  no
    image:    'tmpl_note'
    index:    6
    key:      'PREDEFINED.00007'
    readOnly: yes
    shortcut: 'C'
    title:    i18n.get 'default_template_markdown_selection'
    usage:    0
]
# Extension ID being used by Template.
EXTENSION_ID      = i18n.get '@@extension_id'
# Domain of this extension's homepage.
HOMEPAGE_DOMAIN   = 'neocotic.com'
# List of known operating systems that could be used by the user.
OPERATING_SYSTEMS = [
  substring: 'Win'
  title:     'Windows'
,
  substring: 'Mac'
  title:     'Mac'
,
  substring: 'Linux'
  title:     'Linux'
]
# Milliseconds before the popup automatically resets or closes, depending on
# user preferences.
POPUP_DELAY       = 600
# Regular expression used to detect upper case characters.
R_UPPER_CASE      = /[A-Z]+/
# Regular expression used to perform simple URL validation.
R_VALID_URL       = /^https?:\/\/\S+\.\S+/i
# Extension ID of the production version of Template.
REAL_EXTENSION_ID = 'dcjnfaoifoefmnbhhlbppaebgnccfddf'
# List of URL shortener services supported by Template.
SHORTENERS        = [
  # Setup [bitly](http://bit.ly).
  getHeaders:    -> 'Content-Type': 'application/x-www-form-urlencoded'
  getParameters: (url) ->
    params =
      format:  'json'
      longUrl: url
    if @oauth.hasAccessToken()
      params.access_token = @oauth.getAccessToken()
    else
      params.apiKey = services.bitly.api_key
      params.login  = services.bitly.login
    params
  getUsage:      -> store.get 'bitly.usage'
  input:         -> null
  isEnabled:     -> store.get 'bitly.enabled'
  method:        'GET'
  name:          'bitly'
  oauth:         -> new OAuth2 'bitly'
    client_id:     services.bitly.client_id
    client_secret: services.bitly.client_secret
  output:        (resp) -> JSON.parse(resp).data.url
  title:         i18n.get 'shortener_bitly'
  url:           -> services.bitly.url
,
  # Setup [Google URL Shortener](http://goo.gl).
  getHeaders:    ->
    headers = 'Content-Type': 'application/json'
    if @oauth.hasAccessToken()
      headers.Authorization = "OAuth #{@oauth.getAccessToken()}"
    headers
  getParameters: -> unless @oauth.hasAccessToken()
    key: services.googl.api_key
  getUsage:      -> store.get 'googl.usage'
  input:         (url) -> JSON.stringify longUrl: url
  isEnabled:     -> store.get 'googl.enabled'
  method:        'POST'
  name:          'googl'
  oauth:         -> new OAuth2 'google'
    api_scope:     services.googl.api_scope
    client_id:     services.googl.client_id
    client_secret: services.googl.client_secret
  output:        (resp) -> JSON.parse(resp).id
  title:         i18n.get 'shortener_googl'
  url:           -> services.googl.url
,
  # Setup [YOURLS](http://yourls.org).
  getHeaders:    -> 'Content-Type': 'application/json'
  getParameters: (url) ->
    params =
      action: 'shorturl'
      format: 'json'
      url:    url
    yourls = store.get 'yourls'
    switch yourls.authentication
      when 'advanced'
        params.signature = yourls.signature if yourls.signature
      when 'basic'
        params.password = yourls.password if yourls.password
        params.username = yourls.username if yourls.username
    params
  getUsage:      -> store.get 'yourls.usage'
  input:         -> null
  isEnabled:     -> store.get 'yourls.enabled'
  method:        'POST'
  name:          'yourls'
  output:        (resp) -> JSON.parse(resp).shorturl
  title:         i18n.get 'shortener_yourls'
  url:           -> store.get 'yourls.url'
]
# List of extensions supported by Template and used for compatibility purposes.
SUPPORT           =
  # Setup [IE Tab](http://ietab.net).
  hehijbfgiekmjfkfjpbkbammjbdenadd: (tab) ->
    if tab.title
      str = 'IE: '
      idx = tab.title.indexOf str
      tab.title = tab.title.substring idx + str.length if idx isnt -1
    if tab.url
      str = 'iecontainer.html#url='
      idx = tab.url.indexOf str
      if idx isnt -1
        tab.url = decodeURIComponent tab.url.substring idx + str.length
  # Setup [IE Tab Classic](http://goo.gl/u7Cau).
  miedgcmlgpmdagojnnbemlkgidepfjfi: (tab) ->
    if tab.url
      str = 'ie.html#'
      idx = tab.url.indexOf str
      tab.url = tab.url.substring idx + str.length if idx isnt -1
  # Setup [IE Tab Multi (Enhance)](http://iblogbox.com/chrome/ietab).
  fnfnbeppfinmnjnjhedifcfllpcfgeea: (tab) ->
    if tab.url
      str = 'navigate.html?chromeurl='
      idx = tab.url.indexOf str
      if idx isnt -1
        tab.url = tab.url.substring idx + str.length
        str = '[escape]'
        if tab.url.indexOf(str) is 0
          tab.url = decodeURIComponent tab.url.substring str.length
  # Setup [Mozilla Gecko Tab](http://iblogbox.com/chrome/geckotab).
  icoloanbecehinobmflpeglknkplbfbm: (tab) ->
    if tab.url
      str = 'navigate.html?chromeurl='
      idx = tab.url.indexOf str
      if idx isnt -1
        tab.url = tab.url.substring idx + str.length
        str = '[escape]'
        if tab.url.indexOf(str) is 0
          tab.url = decodeURIComponent tab.url.substring str.length

# Private variables
# -----------------

# Details of the current browser.
browser           =
  title:   'Chrome'
  version: ''
# Indicate whether or not Template has just been installed.
isNewInstall      = no
# Indicate whether or not Template is currently running the production build.
isProductionBuild = EXTENSION_ID is REAL_EXTENSION_ID
# Name of the user's operating system.
operatingSystem   = ''
# Details of web services used by Template.
services          = {}

# Private functions
# -----------------

# Inject and execute the `content.coffee` and `install.coffee` scripts within
# all of the tabs (where valid) of each Chrome window.
executeScriptsInExistingWindows = ->
  log.trace()
  # Create a runner to help manage the asynchronous aspect.
  runner = new utils.Runner()
  runner.push chrome.windows, 'getAll', null, (windows) ->
    log.info 'Retrieved the following windows...', windows
    for win in windows
      do (win) -> runner.push chrome.tabs, 'query', windowId: win.id, (tabs) ->
        log.info 'Retrieved the following tabs...', tabs
        # Check tabs are not displaying a *protected* page (i.e. one that
        # will cause an error if an attempt is made to execute content
        # scripts).
        for tab in tabs when not isProtectedPage tab
          chrome.tabs.executeScript tab.id, file: 'lib/content.js'
          # Only execute inline installation content script for tabs
          # displaying a page on Template's homepage domain.
          if tab.url.indexOf(HOMEPAGE_DOMAIN) isnt -1
            chrome.tabs.executeScript tab.id, file: 'lib/install.js'
        runner.next()
    runner.next()
  runner.run()

# Attempt to derive the current version of the user's browser.
getBrowserVersion = ->
  log.trace()
  str = navigator.userAgent
  idx = str.indexOf browser.title
  if idx isnt -1
    str = str.substring idx + browser.title.length + 1
    idx = str.indexOf ' '
    if idx is -1 then str else str.substring 0, idx

# Derive the path of the image used by `template`.
getImagePathForTemplate = (template, relative) ->
  log.trace()
  path = if relative then '../' else ''
  for image in ext.IMAGES when image is template.image
    path += "images/#{image}.png"
    break
  path += 'images/spacer.gif' if path.length <= 3
  path

# Derive the operating system being used by the user.
getOperatingSystem = ->
  log.trace()
  str = navigator.platform
  for os in OPERATING_SYSTEMS when str.indexOf(os.substring) isnt -1
    str = os.title
    break
  str

# Attempt to retrieve the template with the specified `key`.
getTemplateWithKey = (key) ->
  log.trace()
  ext.queryTemplate (template) -> template.key is key

# Attempt to retrieve the template with the specified `menuId`.
getTemplateWithMenuId = (menuId) ->
  log.trace()
  ext.queryTemplate (template) -> template.menuId is menuId

# Attempt to retrieve the template with the specified keyboard `shortcut`.  
# Exclude disabled templates from this query.
getTemplateWithShortcut = (shortcut) ->
  log.trace()
  ext.queryTemplate (template) ->
    template.enabled and template.shortcut is shortcut

# Determine whether or not the specified extension is blacklisted.
isBlacklisted = (extensionId) ->
  log.trace()
  return yes for extension in BLACKLIST when extension is extensionId
  no

# Determine whether or not the specified extension is active on `tab`.
isExtensionActive = (tab, extensionId) ->
  log.trace()
  log.debug "Checking activity of #{extensionId}"
  isSpecialPage(tab) and tab.url.indexOf(extensionId) isnt -1

# Determine whether or not `tab` is currently displaying a page on the Chrome
# Extension Gallery (i.e. Web Store).
isExtensionGallery = (tab) ->
  log.trace()
  tab.url.indexOf('https://chrome.google.com/webstore') is 0

# Determine whether or not `tab` is currently displaying a *protected* page
# (i.e. a page that content scripts cannot be executed on).
isProtectedPage = (tab) ->
  log.trace()
  isSpecialPage(tab) or isExtensionGallery tab

# Determine whether or not `tab` is currently displaying a *special* page (i.e.
# a page that is internal to the browser).
isSpecialPage = (tab) ->
  log.trace()
  tab.url.indexOf('chrome') is 0

# Ensure `null` is returned instead of `object` if it is *empty*.
nullIfEmpty = (object) ->
  log.trace()
  if $.isEmptyObject object then null else object

# Listener for internal requests to the extension.  
# External requests are also routed through here, but only after being checked
# that they do not originate from a blacklisted extension.
onRequest = (request, sender, sendResponse) ->
  log.trace()
  # Don't allow shortcut requests when shortcuts are disabled.
  if request.type is 'shortcut' and not store.get 'shortcuts'
    return sendResponse?()
  # Select or create a tab for the Options page.
  if request.type is 'options'
    selectOrCreateTab utils.url 'pages/options.html'
    # Close the popup if it's currently open. This should happen naturally but
    # is being forced to ensure consistency.
    chrome.extension.getViews(type: 'popup')[0]?.close()
    return sendResponse?()
  # Info requests are simple, just send some useful information back. Done!
  if request.type in ['info', 'version']
    return sendResponse? id: EXTENSION_ID, version: ext.version
  data       = null
  output     = null
  shortenMap = {}
  tab        = null
  template   = null
  windowId   = chrome.windows.WINDOW_ID_CURRENT
  # Create a runner to manage this asynchronous mess.
  runner = new utils.Runner()
  unless windowId?
    runner.push chrome.windows, 'getCurrent', (win) ->
      log.info 'Retrieved the following window...', win
      windowId = win.id
      runner.next()
  runner.pushPacked chrome.tabs, 'query', ->
    [active: yes, windowId: windowId, (tabs) ->
      log.info 'Retrieved the following tabs...', tabs
      tab = tabs[0]
      runner.next()
    ]
  runner.push null, ->
    # Called whenever the `shorten` (or previously `short`) tag is found to
    # indicate that a URL needs shortened.  
    # Replace the tag with the unique placeholder so that it can be rendered
    # again later with the short URL.
    shortCallback = (text, render) ->
      text = if text then render text else @url
      url  = text.trim()
      log.debug 'Following is the contents of a shorten tag...', text
      # If `url` doesn't appear to be a valid URL so just return the rendered
      # `text`.
      return text unless R_VALID_URL.test url
      placeholder = key for own key, value of shortenMap when value is url
      unless placeholder?
        placeholder = utils.keyGen '', null, 's', no
        shortenMap[placeholder] = url
        # Sections are re-rendered so the context must have a property for the
        # placeholder the replaces itself with itself so that it still when it
        # comes to replacing with the shortened URL.
        this[placeholder] = "{#{placeholder}}"
      log.debug "Replacing shorten tag with #{placeholder} placeholder"
      "{#{placeholder}}"
    # If the popup is currently displayed, hide the template list and show a
    # loading animation.
    updateProgress null, on
    # Attempt to derive the contextual template data.
    try
      switch request.type
        when 'menu'
          template = getTemplateWithMenuId request.data.menuItemId
          if template?
            data = buildDerivedData tab, request.data, shortCallback
        when 'popup', 'toolbar'
          template = getTemplateWithKey request.data.key
          data     = buildStandardData tab, shortCallback if template?
        when 'shortcut'
          template = getTemplateWithShortcut request.data.key
          data     = buildStandardData tab, shortCallback if template?
      updateProgress 20
      if data? then runner.next() else runner.finish()
    catch error
      log.error error
      # Oops! Something went wrong so we should probably let the user know.
      runner.finish
        message: i18n.get if error instanceof URIError
          'result_bad_uri_description'
        else
          'result_bad_error_description'
        success: no
  runner.pushPacked null, addAdditionalData, ->
    [tab, data, ->
      updateProgress 40
      # Ensure all properties of `data` are lower case.
      transformData data
      # To complete the data, simply extend it using `template`.
      $.extend data, template: template
      log.debug "Using the following data to render #{template.title}...", data
      if template.content
        output = Mustache.to_html template.content, data
        updateProgress 60
        log.debug 'Following string is the rendered result...', output
        # If any `shorten` (or old `short`) tags are found and replaced, the
        # URL shortener service needs to be called in order to replace any
        # placeholders with their corresponding short URL.
        if $.isEmptyObject shortenMap
          runner.finish
            contents: output
            success:  yes
            template: template
        else
          runner.next()
      else
        # Display the *empty contents* error message if the contents of the
        # template itself is empty.
        runner.finish
          contents: ''
          success:  yes
          template: template
    ]
  runner.push null, callUrlShortener, shortenMap, (response) ->
    log.info 'URL shortener service was called one or more times'
    updateProgress 80
    if response.success
      updateUrlShortenerUsage response.service.name, response.oauth
      # Request to the URL shortener service was successful so re-render the
      # output.
      newOutput = Mustache.to_html output, shortenMap
      log.debug 'Following string is the re-rendered result...', newOutput
      runner.finish
        contents: newOutput
        success:  yes
        template: template
    else
      # Aw man, something went wrong. Let the user down gently.
      response.message ?= i18n.get 'shortener_error', response.service.title
      log.warn response.message
      runner.finish
        message:  response.message
        success:  no
        template: template
  runner.run (result) ->
    type  = request.type[0].toUpperCase() + request.type.substr 1
    value = request.data.key.charCodeAt 0 if request.type is 'shortcut'
    analytics.track 'Requests', 'Processed', type, value
    updateProgress 100
    if result?
      # Ensure that the user is notified if they have attempted to copy an
      # empty string to the system clipboard.
      if result.success and not result.contents
        result.message = i18n.get 'result_bad_empty_description',
          result.template.title
        result.success = no
      if result.success
        ext.notification.title       = i18n.get 'result_good_title'
        ext.notification.titleStyle  = 'color: #050'
        ext.notification.description = result.message ?
          i18n.get 'result_good_description', result.template.title
        ext.copy result.contents
        sendResponse? contents: result.contents
      else
        ext.notification.title       = i18n.get 'result_bad_title'
        ext.notification.titleStyle  = 'color: #A00'
        ext.notification.description = result.message ?
          i18n.get 'result_bad_description', result.template.title
        showNotification()
        sendResponse?()
      if result.template?
        updateTemplateUsage result.template.key
        updateStatistics()
    else
      updateProgress null, off
    log.debug "Finished handling #{type} request"

# Attempt to select a tab in the current window displaying a page whose
# location begins with `url`.  
# If no existing tab exists a new one is simply created.
selectOrCreateTab = (url, callback) ->
  log.trace()
  tab      = null
  windowId = chrome.windows.WINDOW_ID_CURRENT
  # Create a runner to mange the asynchronous pattern.
  runner = new utils.Runner()
  unless windowId?
    runner.push chrome.windows, 'getCurrent', (win) ->
      log.debug 'Retrieved the following window...', win
      windowId = win.id
      runner.next()
  runner.pushPacked chrome.tabs, 'query', ->
    [windowId: windowId, (tabs) ->
      log.debug 'Retrieved the following tabs...', tabs
      result = yes
      # Try to find an existing tab.
      for tab in tabs
        if tab.url.indexOf(url) is 0
          existingTab = tab
          break
      if existingTab?
        # Found one! Now to select it.
        chrome.tabs.update existingTab.id, active: yes
        result = no
      else
        # Ach well, let's just create a new one.
        chrome.tabs.create url: url, active: yes
      runner.finish result
    ]
  runner.run callback

# Display a desktop notification informing the user on whether or not the copy
# request was successful.  
# Also, ensure that `ext` is *reset* and that notifications are only displayed
# if the user has enabled the corresponding option (enabled by default).
showNotification = ->
  log.trace()
  if store.get 'notifications.enabled'
    webkitNotifications.createHTMLNotification(
      utils.url 'pages/notification.html'
    ).show()
  else
    ext.reset()
  updateProgress null, off

# Update the popup UI state to reflect the progress of the current request.  
# Ignore `percent` if `toggle` is specified; otherwise update the percentage on
# the progress bar and reset the delay timer.  
# `toggle` can be used to show the progress bar or reset/close the popup.
updateProgress = (percent, toggle) ->
  log.trace()
  popup       = $ chrome.extension.getViews(type: 'popup')[0]
  item        = if popup.length then $ '#item',    popup[0].document else $()
  loadDiv     = if popup.length then $ '#loadDiv', popup[0].document else $()
  progressBar = loadDiv.find '.progress .bar'
  # Update the progress bar to display the specified `percent`.
  if toggle?
    if toggle
      progressBar.css 'width', '0%'
      popup.delay          POPUP_DELAY
      item.hide().delay    POPUP_DELAY
      loadDiv.show().delay POPUP_DELAY
    else
      if store.get 'toolbar.close'
        popup.queue -> popup.dequeue()[0]?.close()
      else
        loadDiv.queue ->
          loadDiv.hide().dequeue()
          progressBar.css 'width', '0%'
        item.queue -> item.show().dequeue()
  else if percent?
    popup.dequeue().delay   POPUP_DELAY
    item.dequeue().delay    POPUP_DELAY
    loadDiv.dequeue().delay POPUP_DELAY
    progressBar.css 'width', "#{percent}%"

# Update the statistical information.
updateStatistics = ->
  log.trace()
  log.info 'Updating statistics'
  store.init 'stats', {}
  store.modify 'stats', (stats) =>
    # Determine which template has the greatest usage.
    maxUsage = 0
    utils.query ext.templates, no, (template) ->
      maxUsage = template.usage if template.usage > maxUsage
      no
    popular = ext.queryTemplate (template) -> template.usage is maxUsage
    # Calculate the up-to-date statistical information.
    stats.count       = ext.templates.length
    stats.customCount = stats.count - DEFAULT_TEMPLATES.length
    stats.popular     = popular?.key

# Increment the usage for the template with the specified `key` and persist the
# changes.
updateTemplateUsage = (key) ->
  log.trace()
  for template in ext.templates when template.key is key
    template.usage++
    break
  store.set 'templates', ext.templates
  log.info "Used #{template.title} template"
  analytics.track 'Templates', 'Used', template.title, Number template.readOnly

# Increment the usage for the URL shortener service with the specified `name`
# and persist the changes.
updateUrlShortenerUsage = (name, oauth) ->
  log.trace()
  store.modify name, (shortener) -> shortener.usage++
  shortener = ext.queryUrlShortener (shortener) -> shortener.name is name
  log.info "Used #{shortener.title} URL shortener"
  analytics.track 'Shorteners', 'Used', shortener.title, Number oauth

# Data functions
# --------------

# Extract additional information from `tab` and add it to `data`.
addAdditionalData = (tab, data, callback) ->
  log.trace()
  windowId = chrome.windows.WINDOW_ID_CURRENT
  # Create a runner to simplify this process.
  runner = new utils.Runner()
  unless windowId?
    runner.push chrome.windows, 'getCurrent', (win) ->
      log.info 'Retrieved the following window...', win
      windowId = win.id
      runner.next()
  runner.pushPacked chrome.tabs, 'query', -> [windowId: windowId, (tabs) ->
    log.info 'Retrieved the following tabs...', tabs
    urls = []
    urls.push tab.url for tab in tabs when tab.url not in urls
    $.extend data, tabs: urls
    runner.next()
  ]
  runner.push navigator.geolocation, 'getCurrentPosition', (position) ->
    log.debug 'Retrieved the following geolocation information...', position
    coords = {}
    for own prop, value of position.coords
      coords[prop.toLowerCase()] = if value? then "#{value}" else ''
    $.extend data, coords: coords
    runner.next()
  , (error) ->
    log.error error.message
    runner.next()
  runner.push chrome.cookies, 'getAll', url: data.url, (cookies = []) ->
    log.debug 'Retrieved the following cookies...', cookies
    $.extend data,
      cookie:  -> (text, render) ->
        # Attempt to find the value for the cookie name.
        name = render text
        return cookie.value for cookie in cookies when cookie.name is name
        ''
      cookies: (
        names = []
        for cookie in cookies when cookie.name not in names
          names.push cookie.name
        names
      )
    # Try to prevent pages hanging because content script should not have been
    # executed.
    if isProtectedPage tab then runner.finish() else runner.next()
  runner.push chrome.tabs, 'sendRequest', tab.id, {}, (response) ->
    log.debug 'Retrieved the following data from the content script...',
      response
    runner.finish response
  runner.run (result = {}) ->
    lastModified = if result.lastModified?
      time = Date.parse result.lastModified
      new Date time unless isNaN time
    $.extend data,
      author:         result.author         ? ''
      characterset:   result.characterSet   ? ''
      description:    result.description    ? ''
      images:         result.images         ? []
      keywords:       result.keywords       ? []
      lastmodified:   -> (text, render) ->
        lastModified?.format(render(text) or undefined) ? ''
      links:          result.links          ? []
      pageheight:     result.pageHeight     ? ''
      pagewidth:      result.pageWidth      ? ''
      referrer:       result.referrer       ? ''
      scripts:        result.scripts        ? []
      selectedimages: result.selectedImages ? []
      selectedlinks:  result.selectedLinks  ? []
      selection:      result.selection      ? ''
      selectionhtml:  result.selectionHTML  ? ''
      # Deprecated since 1.0.0, use `selectedLinks` instead.
      selectionlinks: -> @selectedlinks
      stylesheets:    result.styleSheets    ? []
    callback()

# Creates an object containing data based on information derived from the
# specified tab and menu item data.
buildDerivedData = (tab, onClickData, shortCallback) ->
  log.trace()
  data =
    title: tab.title
    url:   if onClickData.linkUrl
        onClickData.linkUrl
      else if onClickData.srcUrl
        onClickData.srcUrl
      else if onClickData.frameUrl
        onClickData.frameUrl
      else
        onClickData.pageUrl
  buildStandardData data, shortCallback

# Construct a data object based on information extracted from `tab`.  
# The tab information is then merged with additional information relating to
# the URL of the tab.  
# If a shortened URL is requested when parsing the templates contents later,
# `shortCallback` is called to handle this as we don't want to call a URL
# shortener service unless it is actually required.
buildStandardData = (tab, shortCallback) ->
  log.trace()
  # Create a copy of the original tab of the tab to run the compatibility
  # scripts on.
  ctab = {}
  ctab[prop] = value for own prop, value of tab
  # Check for any support extensions running on the current tab by simply
  # checking the tabs URL.
  for own extension, handler of SUPPORT when isExtensionActive tab, extension
    log.debug "Making data compatible with #{extension}"
    handler? ctab
    break
  # Build the initial URL data.
  data = {}
  url  = $.url ctab.url
  # Create references to the base of all grouped options to improve lookup
  # performance.
  anchor        = store.get 'anchor'
  bitly         = store.get 'bitly'
  googl         = store.get 'googl'
  menu          = store.get 'menu'
  notifications = store.get 'notifications'
  stats         = store.get 'stats'
  toolbar       = store.get 'toolbar'
  yourls        = store.get 'yourls'
  # Merge the initial data with the attributes of the [URL
  # parser](https://github.com/allmarkedup/jQuery-URL-Parser) and all of the
  # custom Template properties.  
  # All properties should be in lower case so that they can be looked up
  # ignoring case by our modified version of
  # [mustache.js](https://github.com/janl/mustache.js).
  $.extend data, url.attr(),
    anchortarget:          anchor.target
    anchortitle:           anchor.title
    bitly:                 bitly.enabled
    bitlyaccount:          ->
      ext.queryUrlShortener((shortener) ->
        shortener.name is 'bitly'
      ).oauth.hasAccessToken()
    browser:               browser.title
    browserversion:        browser.version
    # Deprecated since 1.0.0, use `menu` instead.
    contextmenu:           -> @menu
    cookiesenabled:        navigator.cookieEnabled
    count:                 stats.count
    customcount:           stats.customCount
    datetime:              -> (text, render) ->
      new Date().format(render(text) or undefined) ? ''
    decode:                -> (text, render) ->
      decodeURIComponent(render text) ? ''
    depth:                 screen.colorDepth
    # Deprecated since 1.0.0, use `anchorTarget` instead.
    doanchortarget:        -> @anchortarget
    # Deprecated since 1.0.0, use `anchorTitle` instead.
    doanchortitle:         -> @anchortitle
    encode:                -> (text, render) ->
      encodeURIComponent(render text) ? ''
    # Deprecated since 0.1.0.2, use `encode` instead.
    encoded:               -> encodeURIComponent @url
    favicon:               ctab.favIconUrl
    fparam:                -> (text, render) ->
      url.fparam(render text) ? ''
    fparams:               nullIfEmpty url.fparam()
    fsegment:              -> (text, render) ->
      url.fsegment(parseInt render(text), 10) ? ''
    fsegments:             url.fsegment()
    googl:                 googl.enabled
    googlaccount:          ->
      ext.queryUrlShortener((shortener) ->
        shortener.name is 'googl'
      ).oauth.hasAccessToken()
    # Deprecated since 1.0.0, use `googlAccount` instead.
    googloauth:            -> @googlaccount()
    java:                  navigator.javaEnabled()
    menu:                  menu.enabled
    menuoptions:           menu.options
    notifications:         notifications.enabled
    notificationduration:  notifications.duration * .001
    offline:               not navigator.onLine
    # Deprecated since 0.1.0.2, use `originalUrl` instead.
    originalsource:        -> @originalurl
    originaltitle:         tab.title or url.attr 'source'
    originalurl:           tab.url
    os:                    operatingSystem
    param:                 -> (text, render) ->
      url.param(render text) ? ''
    params:                nullIfEmpty url.param()
    plugins:               (
      results = []
      for plugin in navigator.plugins when plugin.name not in results
        results.push plugin.name
      results.sort()
    )
    popular:               ext.queryTemplate (template) ->
      template.key is stats.popular
    screenheight:          screen.height
    screenwidth:           screen.width
    segment:               -> (text, render) ->
      url.segment(parseInt render(text), 10) ? ''
    segments:              url.segment()
    selectionmarkdown:     -> md @selectionhtml
    # Deprecated since 1.0.0, use `shorten` instead.
    short:                 -> @shorten()
    shortcuts:             store.get 'shortcuts'
    shorten:               -> shortCallback
    title:                 ctab.title or url.attr 'source'
    toolbarclose:          toolbar.close
    # Deprecated since 1.0.0, use the inverse of `toolbarPopup` instead.
    toolbarfeature:        -> not @toolbarpopup
    # Deprecated since 1.0.0, use `toolbarStyle` instead.
    toolbarfeaturedetails: -> @toolbarstyle
    # Deprecated since 1.0.0, use `toolbarKey` instead.
    toolbarfeaturename:    -> @toolbarkey
    toolbarkey:            toolbar.key
    toolbaroptions:        toolbar.options
    toolbarpopup:          toolbar.popup
    toolbarstyle:          toolbar.style
    url:                   url.attr 'source'
    version:               ext.version
    yourls:                yourls.enabled
    yourlsauthentication:  yourls.authentication
    yourlspassword:        yourls.password
    yourlssignature:       yourls.signature
    yourlsurl:             yourls.url
    yourlsusername:        yourls.username
  data

# Ensure there is a lower case variant of all properties of `data`, optionally
# removing the original non-lower-case property.
transformData = (data, deleteOld) ->
  log.trace()
  for own prop, value of data when R_UPPER_CASE.test prop
    data[prop.toLowerCase()] = value
    delete data[prop] if deleteOld

# HTML building functions
# -----------------------

# Build the HTML to populate the popup with to optimize popup loading times.
buildPopup = ->
  log.trace()
  item     = $ '<div id="item"/>'
  itemList = $ '<ul id="itemList"/>'
  loadDiv  = $ '<div id="loadDiv"/>'
  loadDiv.append $('<div/>',
    class: 'progress progress-info progress-striped active'
  ).append $ '<div/>',
    class: 'bar'
    style: 'width: 100%'
  # Generate the HTML for each template.
  for template in ext.templates when template.enabled
    itemList.append buildTemplate template
  # Add a generic message to state the obvious... that the list is empty.
  if itemList.find('li').length is 0
    itemList.append $('<li/>').append $('<div/>',
      class: 'menu'
      style: "background-image: url('../images/spacer.gif')"
    ).append $ '<span/>',
      class: 'text'
      style: 'margin-left: 0'
      text:  i18n.get 'empty'
  # Add a link to the options page if the user doesn't mind.
  if store.get 'toolbar.options'
    itemList.append $('<li/>',
      class:       'options'
      'data-type': 'options'
      onclick:     'popup.sendRequest(this)'
    ).append $('<div/>',
      class: 'menu'
      style: "background-image: url('../images/tmpl_tools.png')"
    ).append $ '<span/>',
      class: 'text'
      text:  i18n.get 'options'
  item.append itemList
  ext.popupHtml = $('<div/>').append(loadDiv, item).html()

# Create an `li` element to represent `template`.  
# The element should then be inserted in to the `ul` element in the popup page
# but is created here to optimize display times for the popup.
buildTemplate = (template) ->
  log.trace()
  log.debug "Creating popup list item for #{template.title}"
  image = getImagePathForTemplate template, yes
  item  = $ '<li/>',
    'data-key':  template.key
    'data-type': 'popup'
    onclick:     'popup.sendRequest(this)'
  menu  = $ '<div/>',
    class: 'menu'
    style: "background-image: url('#{image}')"
  menu.append $ '<span/>',
    class: 'text'
    text:  template.title
  if store.get 'shortcuts'
    modifiers = ext.SHORTCUT_MODIFIERS
    modifiers = ext.SHORTCUT_MAC_MODIFIERS if ext.isThisPlatform 'mac'
    menu.append $ '<span/>',
      class: 'shortcut',
      html:  if template.shortcut then modifiers + template.shortcut else ''
  item.append menu

# Initialization functions
# ------------------------

# Handle the conversion/removal of older version of settings that may have been
# stored previously by `ext.init`.
init_update = ->
  log.trace()
  # Update the update progress indicator itself.
  if store.exists 'update_progress'
    store.modify 'updates', (updates) ->
      progress = store.remove 'update_progress'
      for own namespace, versions of progress
        updates[namespace] = if versions?.length then versions.pop() else ''
  # Create updater for the `settings` namespace.
  updater      = new store.Updater 'settings'
  isNewInstall = updater.isNew
  # Define the processes for all required updates to the `settings`
  # namespace.
  updater.update '0.1.0.0', ->
    log.info 'Updating general settings for 0.1.0.0'
    store.rename 'settingNotification',      'notifications',        on
    store.rename 'settingNotificationTimer', 'notificationDuration', 3000
    store.rename 'settingShortcut',          'shortcuts',            on
    store.rename 'settingTargetAttr',        'doAnchorTarget',       off
    store.rename 'settingTitleAttr',         'doAnchorTitle',        off
    store.remove 'settingIeTabExtract',      'settingIeTabTitle'
  updater.update '1.0.0', ->
    log.info 'Updating general settings for 1.0.0'
    if store.exists 'options_active_tab'
      optionsActiveTab = store.get 'options_active_tab'
      store.set 'options_active_tab', switch optionsActiveTab
        when 'features_nav' then 'templates_nav'
        when 'toolbar_nav' then 'general_nav'
        else optionsActiveTab
    store.modify 'anchor', (anchor) ->
      anchor.target = store.get('doAnchorTarget') ? off
      anchor.title  = store.get('doAnchorTitle') ? off
    store.remove 'doAnchorTarget', 'doAnchorTitle'
    store.modify 'menu', (menu) ->
      menu.enabled = store.get('contextMenu') ? yes
    store.remove 'contextMenu'
    store.set 'notifications',
      duration: store.get('notificationDuration') ? 3000
      enabled:  store.get('notifications') ? yes
    store.remove 'notificationDuration'

# Initialize the settings related to statistical information.
initStatistics = ->
  log.trace()
  updateStatistics()

# Initialize `template` and its properties, before adding it to `templates` to
# be persisted later.
initTemplate = (template, templates) ->
  log.trace()
  # Derive the index of `template` to determine whether or not it already
  # exists.
  idx = templates.indexOf utils.query templates, yes, (tmpl) ->
    tmpl.key is template.key
  if idx is -1
    # `template` doesn't already exist so add it now.
    log.debug 'Adding the following predefined template...', template
    templates.push template
  else
    # `template` exists so modify the properties to ensure they are reliable.
    log.debug 'Ensuring following template adheres to structure...', template
    if template.readOnly
      # `template` is read-only so certain properties should always be
      # overriden and others only when they are not already available.
      templates[idx].content   = template.content
      templates[idx].enabled  ?= template.enabled
      templates[idx].image    ?= template.image
      templates[idx].index    ?= template.index
      templates[idx].key       = template.key
      templates[idx].readOnly  = yes
      templates[idx].shortcut ?= template.shortcut
      templates[idx].title     = template.title
      templates[idx].usage    ?= template.usage
    else
      # `template` is *not* read-only so set unavailable, but required,
      # properties to their default value.
      templates[idx].content  ?= ''
      templates[idx].enabled  ?= yes
      templates[idx].image    ?= ''
      templates[idx].index    ?= 0
      templates[idx].key      ?= template.key
      templates[idx].readOnly  = no
      templates[idx].shortcut ?= ''
      templates[idx].title    ?= i18n.get 'untitled'
      templates[idx].usage    ?= 0
    template = templates[idx]
  template

# Initialize the persisted managed templates.
initTemplates = ->
  log.trace()
  initTemplates_update()
  store.modify 'templates', (templates) ->
    # Initialize all default templates to ensure their properties are as
    # expected.
    initTemplate template, templates for template in DEFAULT_TEMPLATES
    # Now, initialize *all* templates to ensure their properties are valid.
    initTemplate template, templates for template in templates
  ext.updateTemplates()

# Handle the conversion/removal of older version of settings that may have been
# stored previously by `initTemplates`.
initTemplates_update = ->
  log.trace()
  # Create updater for the `features` namespace and then rename it to
  # `templates`.
  updater = new store.Updater 'features'
  updater.rename 'templates'
  # Define the processes for all required updates to the `templates` namespace.
  updater.update '0.1.0.0', ->
    log.info 'Updating template settings for 0.1.0.0'
    store.rename 'copyAnchorEnabled',  'feat__anchor_enabled',  yes
    store.rename 'copyAnchorOrder',    'feat__anchor_index',    2
    store.rename 'copyBBCodeEnabled',  'feat__bbcode_enabled',  no
    store.rename 'copyBBCodeOrder',    'feat__bbcode_index',    4
    store.rename 'copyEncodedEnabled', 'feat__encoded_enabled', yes
    store.rename 'copyEncodedOrder',   'feat__encoded_index',   3
    store.rename 'copyShortEnabled',   'feat__short_enabled',   yes
    store.rename 'copyShortOrder',     'feat__short_index',     1
    store.rename 'copyUrlEnabled',     'feat__url_enabled',     yes
    store.rename 'copyUrlOrder',       'feat__url_index',       0
  updater.update '0.2.0.0', ->
    log.info 'Updating template settings for 0.2.0.0'
    names = store.get('features') ? []
    for name in names when typeof name is 'string'
      store.rename "feat_#{name}_template", "feat_#{name}_content"
      image = store.get "feat_#{name}_image"
      switch typeof image
        when 'string'
          if image in ['', 'spacer.gif', 'spacer.png']
            store.set "feat_#{name}_image", 0
          else
            for img, i in ext.IMAGES
              oldImg = img.replace /^tmpl/, 'feat'
              if "#{oldImg}.png" is image
                store.set "feat_#{name}_image", i + 1
                break
        else store.set "feat_#{name}_image", 0
  updater.update '1.0.0', ->
    log.info 'Updating template settings for 1.0.0'
    names              = store.remove('features') ? []
    templates          = []
    toolbarFeatureName = store.get 'toolbarFeatureName'
    for name in names when typeof name is 'string'
      image = store.remove("feat_#{name}_image") ? 0
      image--
      if image < 0
        image = ''
      else
        for img, i in ext.IMAGES when i is image
          image = img
          break
        image = '' if typeof image isnt 'string'
      key = ext.getKeyForName name
      if toolbarFeatureName is name
        if store.exists 'toolbar'
          store.modify 'toolbar', (toolbar) -> toolbar.key = key
        else
          store.set 'toolbar', key: key
      templates.push
        content:  store.remove("feat_#{name}_content")  ? ''
        enabled:  store.remove("feat_#{name}_enabled")  ? yes
        image:    image
        index:    store.remove("feat_#{name}_index")    ? 0
        key:      key
        readOnly: store.remove("feat_#{name}_readonly") ? no
        shortcut: store.remove("feat_#{name}_shortcut") ? ''
        title:    store.remove("feat_#{name}_title")    ? i18n.get 'untitled'
        usage:    0
    store.set 'templates', templates
    store.remove store.search(
      /^feat_.*_(content|enabled|image|index|readonly|shortcut|title)$/
    )...

# Initialize the settings related to the toolbar/browser action.
initToolbar = ->
  log.trace()
  initToolbar_update()
  store.modify 'toolbar', (toolbar) ->
    toolbar.close   ?= yes
    toolbar.key     ?= 'PREDEFINED.00001'
    toolbar.options ?= yes
    toolbar.popup   ?= yes
    toolbar.style   ?= no
  ext.updateToolbar()

# Handle the conversion/removal of older version of settings that may have been
# stored previously by `initToolbar`.
initToolbar_update = ->
  log.trace()
  # Create updater for the `toolbar` namespace.
  updater = new store.Updater 'toolbar'
  # Define the processes for all required updates to the `toolbar` namespace.
  updater.update '1.0.0', ->
    log.info 'Updating toolbar settings for 1.0.0'
    store.modify 'toolbar', (toolbar) ->
      toolbar.popup = store.get('toolbarPopup') ? yes
      toolbar.style = store.get('toolbarFeatureDetails') ? no
    store.remove 'toolbarFeature',     'toolbarFeatureDetails',
                 'toolbarFeatureName', 'toolbarPopup'

# Initialize the settings related to the supported URL Shortener services.
initUrlShorteners = ->
  log.trace()
  store.init
    bitly:  {}
    googl:  {}
    yourls: {}
  initUrlShorteners_update()
  store.modify 'bitly', (bitly) ->
    bitly.enabled ?= yes
    bitly.usage   ?= 0
  store.modify 'googl', (googl) ->
    googl.enabled ?= no
    googl.usage   ?= 0
  store.modify 'yourls', (yourls) ->
    yourls.authentication ?= ''
    yourls.enabled        ?= no
    yourls.password       ?= ''
    yourls.signature      ?= ''
    yourls.url            ?= ''
    yourls.username       ?= ''
    yourls.usage          ?= 0

# Handle the conversion/removal of older version of settings that may have been
# stored previously by `initUrlShorteners`.
initUrlShorteners_update = ->
  log.trace()
  # Create updater for the `shorteners` namespace.
  updater = new store.Updater 'shorteners'
  # Define the processes for all required updates to the `shorteners`
  # namespace.
  updater.update '0.1.0.0', ->
    log.info 'Updating URL shortener settings for 0.1.0.0'
    store.rename 'bitlyEnabled',       'bitly',         yes
    store.rename 'bitlyXApiKey',       'bitlyApiKey',   ''
    store.rename 'bitlyXLogin',        'bitlyUsername', ''
    store.rename 'googleEnabled',      'googl',         no
    store.rename 'googleOAuthEnabled', 'googlOAuth',    yes
  updater.update '1.0.0', ->
    log.info 'Updating URL shortener settings for 1.0.0'
    bitly = store.get 'bitly'
    store.set 'bitly',
      apiKey:    store.get('bitlyApiKey') ? ''
      enabled:   if typeof bitly is 'boolean' then bitly else yes
      username:  store.get('bitlyUsername') ? ''
    store.remove 'bitlyApiKey', 'bitlyUsername'
    googl = store.get 'googl'
    store.set 'googl',
      enabled: if typeof googl is 'boolean' then googl else no
    store.remove 'googlOAuth'
    yourls = store.get 'yourls'
    store.set 'yourls',
      enabled:   if typeof yourls is 'boolean' then yourls else no
      password:  store.get('yourlsPassword') ? ''
      signature: store.get('yourlsSignature') ? ''
      url:       store.get('yourlsUrl') ? ''
      username:  store.get('yourlsUsername') ? ''
    store.remove 'yourlsPassword', 'yourlsSignature', 'yourlsUrl',
                 'yourlsUsername'
  updater.update '1.0.1', ->
    store.modify 'bitly', (bitly) ->
      delete bitly.apiKey
      delete bitly.username
    store.modify 'yourls', (yourls) ->
      yourls.authentication = if yourls.signature
        'advanced'
      else if yourls.password and yourls.username
        'basic'
      else 
        ''
    store.remove store.search(/^oauth_token.*/)...

# URL shortener functions
# -----------------------

# Call the active URL shortener service for each URL in `map` in order to
# obtain their corresponding short URLs.  
# `callback` will be called with the result once all URLs have been shortened
# or an error is encountered.
callUrlShortener = (map, callback) ->
  log.trace()
  service  = getActiveUrlShortener()
  endpoint = service.url()
  title    = service.title
  # Ensure the service URL exists in case it is user-defined (e.g. YOURLS).
  unless endpoint
    return callback
      message: i18n.get 'shortener_config_error', title
      service: service
      success: no
  # Create a runner to control the dependencies in the asynchronous processes.
  runner = new utils.Runner()
  for own placeholder, url of map
    do (placeholder, url) ->
      oauth = !!service.oauth?.hasAccessToken()
      if oauth
        runner.push service.oauth, 'authorize', -> runner.next()
      runner.push null, ->
        params    = service.getParameters url
        endpoint += "?#{$.param params}" if params?
        # Build the HTTP request for the URL shortener service.
        xhr = new XMLHttpRequest()
        xhr.open service.method, endpoint, yes
        # Allow service to populate request headers.
        for own header, value of service.getHeaders() ? {}
          xhr.setRequestHeader header, value
        xhr.onreadystatechange = ->
          # Wait for the response and let the service handle it before passing
          # the result to `callback` via the runner.
          if xhr.readyState is 4
            if xhr.status is 200
              map[placeholder] = service.output xhr.responseText
              runner.next oauth: oauth, success: yes
            else
              # Something went wrong so let's tell the user.
              runner.finish
                message: i18n.get('shortener_detailed_error', [title, url])
                success: no
        # Finally, send the HTTP request.
        xhr.send service.input url
  runner.run (result = {}) -> callback
    message: result.message
    oauth:   result.oauth
    service: service
    success: result.success

# Retrieve the active URL shortener service.
getActiveUrlShortener = ->
  log.trace()
  # Attempt to lookup enabled URL shortener service.
  shortener = ext.queryUrlShortener (shortener) -> shortener.isEnabled()
  unless shortener?
    # Should never reach here but we'll return bit.ly service by default after
    # ensuring it's the active URL shortener service from now on to save some
    # time in the future.
    store.modify 'bitly', (bitly) -> bitly.enabled = yes
    shortener = getActiveUrlShortener()
  log.debug "Getting details for #{shortener.title} URL shortener"
  shortener

# Background page setup
# ---------------------

ext = window.ext = new class Extension extends utils.Class

  # Public constants
  # ----------------

  # List of images available as template icons.
  IMAGES: [
    'tmpl_auction',         'tmpl_bug',        'tmpl_clipboard'
    'tmpl_clipboard_empty', 'tmpl_component',  'tmpl_cookies'
    'tmpl_discussion',      'tmpl_globe',      'tmpl_google'
    'tmpl_heart',           'tmpl_html',       'tmpl_key'
    'tmpl_lightbulb',       'tmpl_lighthouse', 'tmpl_lightning'
    'tmpl_link',            'tmpl_linux',      'tmpl_mail'
    'tmpl_newspaper',       'tmpl_note',       'tmpl_page'
    'tmpl_plugin',          'tmpl_rss',        'tmpl_script'
    'tmpl_scull',           'tmpl_sign',       'tmpl_siren'
    'tmpl_star',            'tmpl_support',    'tmpl_tag'
    'tmpl_tags',            'tmpl_thumb_down', 'tmpl_thumb_up'
    'tmpl_tools'
  ]

  # String representation of the keyboard modifiers listened to by Template on
  # Windows/Linux platforms.
  SHORTCUT_MODIFIERS: 'Ctrl+Alt+'

  # String representation of the keyboard modifiers listened to by Template on
  # Mac platforms.
  SHORTCUT_MAC_MODIFIERS: '&#8679;&#8997;'

  # Public variables
  # ----------------

  # Information specifying what should be displaying in the notification.  
  # This should be reset after every copy request.
  notification:
    description:      ''
    descriptionStyle: ''
    html:             ''
    icon:             utils.url '../images/icon_48.png'
    iconStyle:        ''
    title:            ''
    titleStyle:       ''

  # Pre-prepared HTML for the popup to be populated using.  
  # This should be updated whenever templates are changed/updated in any way as
  # this is generated to improve performance and load times of the popup frame.
  popupHtml: ''

  # Local copy of templates being used, ordered to match that specified by the
  # user.
  templates: []

  # Current version of Template.
  version: ''

  # Public functions
  # ----------------

  # Add `str` to the system clipboard.  
  # All successful copy requests should, at some point, call this function.  
  # If `str` is empty the contents of the system clipboard will not change.
  copy: (str, hidden) ->
    log.trace()
    sandbox = $('#sandbox').val(str).select()
    document.execCommand 'copy'
    log.debug 'Copied the following string...', str
    sandbox.val ''
    showNotification() unless hidden

  # Attempt to retrieve the key of the template with the specified `name`.  
  # Since only the names of predefined templates are known, return a newly
  # generated key if it does not match any of their names.
  getKeyForName: (name, generate = yes) ->
    log.trace()
    key = switch name
      when '_url'      then 'PREDEFINED.00001'
      when '_short'    then 'PREDEFINED.00002'
      when '_anchor'   then 'PREDEFINED.00003'
      when '_encoded'  then 'PREDEFINED.00004'
      when '_bbcode'   then 'PREDEFINED.00005'
      when '_markdown' then 'PREDEFINED.00006'
      else utils.keyGen() if generate
    log.debug "Associating #{key} key with #{name} template"
    key

  # Initialize the background page.  
  # This will involve initializing the settings and adding the request
  # listeners.
  init: ->
    log.trace()
    log.info 'Initializing extension controller'
    # Add support for analytics if the user hasn't opted out.
    analytics.add() if store.get 'analytics'
    # Create a runner to ensure asynchronous dependencies are met.
    runner = new utils.Runner()
    runner.push jQuery, 'getJSON', utils.url('manifest.json'), (data) =>
      # It's nice knowing what version is running.
      @version = data.version
      runner.next()
    runner.push jQuery, 'getJSON', utils.url('services.json'), (data) ->
      services = data
      shortener.oauth = shortener.oauth?() for shortener in SHORTENERS
      runner.next()
    runner.run =>
      # Begin initialization.
      store.init
        anchor:        {}
        menu:          {}
        notifications: {}
        stats:         {}
        templates:     []
        toolbar:       {}
      init_update()
      store.modify 'anchor', (anchor) ->
        anchor.target ?= off
        anchor.title  ?= off
      store.modify 'menu', (menu) ->
        menu.enabled ?= yes
        menu.options ?= yes
      store.modify 'notifications', (notifications) ->
        notifications.duration ?= 3000
        notifications.enabled  ?= yes
      store.init 'shortcuts', on
      initTemplates()
      initToolbar()
      initStatistics()
      initUrlShorteners()
      # Add listener for toolbar/browser action clicks.  
      # This listener will be ignored whenever the popup is enabled.
      chrome.browserAction.onClicked.addListener (tab) -> onRequest
        data: key: store.get 'toolbar.key'
        type: 'toolbar'
      # Add listeners for internal and external requests.
      chrome.extension.onRequest.addListener onRequest
      chrome.extension.onRequestExternal.addListener (req, sender, cb) ->
        block = isBlacklisted sender.id
        analytics.track 'External Requests', 'Started', sender.id,
          Number !block
        if block
          log.debug "Blocking external request from #{sender.id}"
          cb?()
        else
          log.debug "Accepting external request from #{sender.id}"
          onRequest req, sender, cb
      # Derive the browser and OS information.
      browser.version = getBrowserVersion()
      operatingSystem = getOperatingSystem()
      if isNewInstall
        analytics.track 'Installs', 'New', @version, Number isProductionBuild
      # Execute content scripts now that we know the version.
      executeScriptsInExistingWindows()

  # Determine whether or not `os` matches the user's operating system.
  isThisPlatform: (os) ->
    log.trace()
    navigator.userAgent.toLowerCase().indexOf(os) isnt -1

  # Attempt to retrieve the contents of the system clipboard as a string.
  paste: ->
    log.trace()
    result  = ''
    sandbox = $('#sandbox').val('').select()
    result  = sandbox.val() if document.execCommand 'paste'
    log.debug 'Pasted the following string...', result
    sandbox.val ''
    result

  # Retrieve the first template that passes the specified `filter`.
  queryTemplate: (filter, singular = yes) ->
    log.trace()
    utils.query @templates, singular, filter

  # Retrieve the first URL shortener service that passes the specified
  # `filter`.
  queryUrlShortener: (filter, singular = yes) ->
    log.trace()
    utils.query SHORTENERS, singular, filter

  # Reset the notification information associated with the current copy
  # request.  
  # This should be called when a copy request is completed regardless of its
  # outcome.
  reset: ->
    log.trace()
    @notification =
      description:      ''
      descriptionStyle: ''
      html:             ''
      icon:             utils.url '../images/icon_48.png'
      iconStyle:        ''
      title:            ''
      titleStyle:       ''

  # Update the context menu items to reflect the currently enabled templates.  
  # If the context menu option has been disabled by the user, just remove all
  # of the existing menu items.
  updateContextMenu: ->
    log.trace()
    # Ensure that any previously added context menu items are removed.
    chrome.contextMenus.removeAll =>
      # Called whenever a template menu item is clicked.  
      # Send a self request, passing along the available information.
      onMenuClick = (info, tab) -> onRequest data: info, type: 'menu'
      menu = store.get 'menu'
      if menu.enabled
        # Create and add the top-level Template menu.
        parentId = chrome.contextMenus.create
          contexts: ['all']
          title:    i18n.get 'name'
        # Create and add a sub-menu item for each enabled template.
        for template in @templates when template.enabled
          notEmpty = yes
          menuId   = chrome.contextMenus.create
            contexts: ['all']
            onclick:  onMenuClick
            parentId: parentId
            title:    template.title
          template.menuId = menuId
        unless notEmpty
          chrome.contextMenus.create
            contexts: ['all']
            parentId: parentId
            title:    i18n.get 'empty'
        # Add an item to open the options page if the user doesn't mind.
        if menu.options
          chrome.contextMenus.create
            contexts: ['all']
            parentId: parentId
            type:     'separator'
          chrome.contextMenus.create
            contexts: ['all']
            onclick:  (info, tab) -> onRequest type: 'options'
            parentId: parentId
            title:    i18n.get 'options'

  # Update the local list of templates to reflect those persisted.  
  # It is very important that this is called whenever templates may have been
  # changed in order to prepare the popup HTML and optimize performance.
  updateTemplates: ->
    log.trace()
    @templates = store.get 'templates'
    @templates.sort (a, b) -> a.index - b.index
    buildPopup()
    @updateContextMenu()
    updateStatistics()

  # Update the toolbar/browser action depending on the current settings.
  updateToolbar: ->
    log.trace()
    image    = 'images/icon_19.png'
    key      = store.get 'toolbar.key'
    template = getTemplateWithKey key if key
    title    = i18n.get 'name'
    buildPopup()
    if not template or store.get 'toolbar.popup'
      log.info 'Configuring toolbar to display popup'
      # Use Template's details to style the browser action.
      chrome.browserAction.setIcon  path:  utils.url image
      chrome.browserAction.setTitle title: title
      # Show the popup when the browser action is clicked.
      chrome.browserAction.setPopup popup: 'pages/popup.html'
    else
      log.info 'Configuring toolbar to activate specified template'
      # Replace Template's details with that of the selected template.
      if store.get 'toolbar.style'
        image = getImagePathForTemplate template if template.image isnt 0
        title = template.title
      # Potentially change the style of the browser action.
      chrome.browserAction.setIcon  path:  utils.url image
      chrome.browserAction.setTitle title: title
      # Disable the popup, effectively enabling the listener for
      # `chrome.browserAction.onClicked`.
      chrome.browserAction.setPopup popup: ''