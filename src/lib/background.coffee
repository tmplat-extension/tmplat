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
    title:    i18n.get 'copy_url'
    usage:    0
  ,
    content:  '{short}'
    enabled:  yes
    image:    'tmpl_link'
    index:    1
    key:      'PREDEFINED.00002'
    readOnly: yes
    shortcut: 'S'
    title:    i18n.get 'copy_short'
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
    title:    i18n.get 'copy_anchor'
    usage:    0
  ,
    content:  '{#encode}{url}{/encode}'
    enabled:  yes
    image:    'tmpl_component'
    index:    3
    key:      'PREDEFINED.00004'
    readOnly: yes
    shortcut: 'E'
    title:    i18n.get 'copy_encoded'
    usage:    0
  ,
    content:  '[url={url}]{title}[/url]'
    enabled:  no
    image:    'tmpl_discussion'
    index:    5
    key:      'PREDEFINED.00005'
    readOnly: yes
    shortcut: 'B'
    title:    i18n.get 'copy_bbcode'
    usage:    0
  ,
    content:  '[{title}]({url})'
    enabled:  no
    image:    'tmpl_discussion'
    index:    4
    key:      'PREDEFINED.00006'
    readOnly: yes
    shortcut: 'M'
    title:    i18n.get 'copy_markdown'
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
# List of URL shortener services supported by Template.
SHORTENERS        = [
  # Setup [bitly](http://bit.ly).
  contentType: 'application/x-www-form-urlencoded'
  getParameters: (url) ->
    bitly  = store.get 'bitly'
    params =
      apiKey:  'R_91eabef2f32d88c07b197c9d69eed516'
      format:  'json'
      login:   'templateextension'
      longUrl: url
    if bitly.apiKey and bitly.username
      params.x_apiKey = bitly.apiKey
      params.x_login  = bitly.username
    params
  input: ->
    null
  isEnabled: ->
    store.get 'bitly.enabled'
  method: 'GET'
  name: 'bit.ly'
  output: (resp) ->
    JSON.parse(resp).data.url
  url: ->
    'http://api.bitly.com/v3/shorten'
,
  # Setup [Google URL Shortener](http://goo.gl).
  contentType: 'application/json'
  getParameters: ->
    key: 'AIzaSyD504IwHeL3V2aw6ZGYQRgwWnJ38jNl2MY'
  input: (url) ->
    JSON.stringify longUrl: url
  isEnabled: ->
    store.get 'googl.enabled'
  isOAuthEnabled: ->
    store.get 'googl.oauth'
  method: 'POST'
  name: 'goo.gl'
  oauth: ChromeExOAuth.initBackgroundPage
    access_url:      'https://www.google.com/accounts/OAuthGetAccessToken'
    app_name:        i18n.get 'app_name'
    authorize_url:   'https://www.google.com/accounts/OAuthAuthorizeToken'
    consumer_key:    'anonymous'
    consumer_secret: 'anonymous'
    request_url:     'https://www.google.com/accounts/OAuthGetRequestToken'
    scope:           'https://www.googleapis.com/auth/urlshortener'
  oauthKeys: [
    'oauth_tokenhttps://www.googleapis.com/auth/urlshortener'
    'oauth_token_secrethttps://www.googleapis.com/auth/urlshortener'
  ]
  output: (resp) ->
    JSON.parse(resp).id
  url: ->
    'https://www.googleapis.com/urlshortener/v1/url'
,
  # Setup [YOURLS](http://yourls.org).
  contentType: 'application/json'
  getParameters: (url) ->
    params =
      action: 'shorturl'
      format: 'json'
      url:    url
    yourls = store.get 'yourls'
    if yourls.password and yourls.username
      params.password  = yourls.password
      params.username  = yourls.username
    else if yourls.signature
      params.signature = yourls.signature
    params
  input: ->
    null
  isEnabled: ->
    store.get 'yourls.enabled'
  method: 'POST'
  name: 'YOURLS'
  output: (resp) ->
    JSON.parse(resp).shorturl
  url: ->
    store.get 'yourls.url'
]
# List of extensions supported by Template and used for compatibility purposes.
SUPPORT           = [
  # Setup [IE Tab](http://ietab.net).
  id: 'hehijbfgiekmjfkfjpbkbammjbdenadd'
  title: (title) ->
    str = 'IE: '
    if title
      idx   = title.indexOf str
      title = title.substring idx + str.length if idx isnt -1
    title
  url: (url) ->
    str = 'iecontainer.html#url='
    if url
      idx = url.indexOf str
      url = decodeURIComponent url.substring idx + str.length if idx isnt -1
    url
,
  # Setup [IE Tab Classic](http://goo.gl/u7Cau).
  id: 'miedgcmlgpmdagojnnbemlkgidepfjfi'
  title: (title) ->
    title
  url: (url) ->
    str = 'ie.html#'
    if url
      idx = url.indexOf str
      url = url.substring idx + str.length if idx isnt -1
    url
,
  # Setup [IE Tab Multi (Enhance)](http://iblogbox.com/chrome/ietab).
  id: 'fnfnbeppfinmnjnjhedifcfllpcfgeea'
  title: (title) ->
    title
  url: (url) ->
    str = 'navigate.html?chromeurl='
    if url
      idx = url.indexOf str
      if idx isnt -1
        url = url.substring idx + str.length
        str = '[escape]'
        if url and url.indexOf(str) is 0
          url = decodeURIComponent url.substring str.length
    url
,
  # Setup [Mozilla Gecko Tab](http://iblogbox.com/chrome/geckotab).
  id: 'icoloanbecehinobmflpeglknkplbfbm'
  title: (title) ->
    title
  url: (url) ->
    str = 'navigate.html?chromeurl='
    if url
      idx = url.indexOf str
      if idx isnt -1
        url = url.substring idx + str.length
        str = '[escape]'
        if url and url.indexOf(str) is 0
          url = decodeURIComponent url.substring str.length
    url
]

# Private variables
# -----------------

# Details of the current browser.
browser         =
  title:   'Chrome'
  version: ''
# Name of the user's operating system.
operatingSystem = ''

# Private functions
# -----------------

# Inject and execute the `content.coffee` and `install.coffee` scripts within
# all of the tabs (where valid) of each Chrome window.
executeScriptsInExistingWindows = ->
  chrome.windows.getAll null, (windows) ->
    for win in windows
      # Retrieve all tabs open in `win`.
      chrome.tabs.query windowId: win.id, (tabs) ->
        # Check tabs are not displaying a *protected* page (i.e. one that will
        # cause an error if an attempt is made to execute content scripts).
        for tab in tabs when not isProtectedPage tab
          chrome.tabs.executeScript tab.id, file: 'lib/content.js'
          # Only execute inline installation content script for tabs displaying
          # a page on Template's homepage domain.
          if tab.url.indexOf(HOMEPAGE_DOMAIN) isnt -1
            chrome.tabs.executeScript tab.id, file: 'lib/install.js'

# Attempt to derive the current version of the user's browser.
getBrowserVersion = ->
  str = navigator.userAgent
  idx = str.indexOf browser.title
  if idx isnt -1
    str = str.substring idx + browser.title.length + 1
    idx = str.indexOf ' '
    if idx is -1 then str else str.substring 0, idx

# Derive the path of the image used by `template`.
getImagePathForTemplate = (template, relative) ->
  path = if relative then '../' else ''
  for image in ext.IMAGES when image is template.image
    path += "images/#{image}.png"
    break
  path += 'images/spacer.gif' if path.length <= 3
  path

# Derive the operating system being used by the user.
getOperatingSystem = ->
  str = navigator.platform
  for os in OPERATING_SYSTEMS when str.indexOf(os.substring) isnt -1
    str = os.title
    break
  str

# Attempt to retrieve the template with the specified `key`.
getTemplateWithKey = (key) ->
  ext.queryTemplate (template) ->
    template.key is key

# Attempt to retrieve the template with the specified `menuId`.
getTemplateWithMenuId = (menuId) ->
  ext.queryTemplate (template) ->
    template.menuId is menuId

# Attempt to retrieve the template with the specified keyboard `shortcut`.  
# Exclude disabled templates from this query.
getTemplateWithShortcut = (shortcut) ->
  ext.queryTemplate (template) ->
    template.enabled and template.shortcut is shortcut

# Determine whether or not `sender` is a blacklisted extension.
isBlacklisted = (sender) ->
  return yes for extension in BLACKLIST when extension is sender.id
  no

# Determine whether or not the specified extension is active on `tab`.
isExtensionActive = (tab, extensionId) ->
  isSpecialPage(tab) and tab.url.indexOf(extensionId) isnt -1

# Determine whether or not `tab` is currently displaying a page on the Chrome
# Extension Gallery (i.e. Web Store).
isExtensionGallery = (tab) ->
  tab.url.indexOf('https://chrome.google.com/webstore') is 0

# Determine whether or not `tab` is currently displaying a *protected* page
# (i.e. a page that content scripts cannot be executed on).
isProtectedPage = (tab) ->
  isSpecialPage(tab) or isExtensionGallery tab

# Determine whether or not `tab` is currently displaying a *special* page (i.e.
# a page that is internal to the browser).
isSpecialPage = (tab) ->
  tab.url.indexOf('chrome') is 0

# Listener for internal requests to the extension.  
# External requests are also routed through here, but only after being checked
# that they do not originate from a blacklisted extension.
onRequest = (request, sender, sendResponse) ->
  # Don't allow shortcut requests when shortcuts are disabled.
  if request.type is 'shortcut' and not store.get 'shortcuts'
    return sendResponse?()
  # Info requests are simple, just send some useful information back. Done!
  if request.type in ['info', 'version']
    return sendResponse? id: EXTENSION_ID, version: ext.version
  chrome.windows.getCurrent (win) ->
    chrome.tabs.query
      active:   yes
      windowId: win.id
    , (tabs) ->
      data             = {}
      popup            = chrome.extension.getViews(type: 'popup')[0]
      shortCalled      = no
      shortPlaceholder = "short#{utils.random 1000, 99999}"
      tab              = tabs[0]
      # Attempt to copy `str` to the system clipboard while handling the
      # potential for failure.  
      # Finally, increment the usage of `template` and update the statistics.
      copyOutput = (template, str) ->
        if str
          ext.copy str
        else
          ext.message = i18n.get 'copy_fail_empty'
          ext.status  = no
          showNotification()
        updateTemplateUsage template.key
        ext.updateStatistics()
      # Called whenever the `short` tag is found to indicate that the URL
      # needs shortened.  
      # Replace the `short` tag with the unique placeholder so that it can be
      # rendered again later with the short URL.
      shortCallback = ->
        shortCalled = yes
        "{#{shortPlaceholder}}"
      # If the popup is currently displayed, hide the template list and show a
      # loading animation.
      if popup
        $('#item', popup.document).hide()
        $('#loadDiv', popup.document).show()
      # Attempt to derive the contextual template data.
      try
        switch request.type
          when 'menu'
            data     = buildDerivedData tab, request.data, shortCallback
            template = getTemplateWithMenuId request.data.menuItemId
          when 'popup'
            data     = buildStandardData tab, shortCallback
            template = getTemplateWithKey request.data.key
          when 'shortcut'
            data     = buildStandardData tab, shortCallback
            template = getTemplateWithShortcut request.data.key
      catch error
        # Oops! Something went wrong so we should probably let the user know.
        if error instanceof URIError
          ext.message = i18n.get 'copy_fail_uri'
        else
          ext.message = i18n.get 'copy_fail_error'
        ext.status = no
        showNotification()
        return
      if template
        addAdditionalData tab, data, ->
          unless template.content
            # Display the *empty template* error message.
            copyOutput template
            return
          output = Mustache.to_html template.content, data
          if shortCalled
            # At least one `short` tag was found and replaced, so now we need
            # to call the URL shortener service and replace that with the
            # actual short URL.
            callUrlShortener data.url, (response) ->
              if response.success and response.shortUrl
                # Short URL was successfully returned, so get rendering.
                newData = {}
                newData[shortPlaceholder] = response.shortUrl
                copyOutput template, Mustache.to_html output, newData
              else
                # Aw man, something went wrong. Let the user down gently.
                unless response.message
                  response.message = i18n.get 'shortener_error',
                    response.shortener
                ext.message = response.message
                ext.status  = no
                showNotification()
          else
            copyOutput template, output
      else
        # Close the popup if it's still open and the user wants it closed.
        # Otherwise, reset the popup so that it can be used further.
        if popup
          if store.get 'toolbar.close'
            popup.close()
          else
            $('#loadDiv', popup.document).hide()
            $('#item', popup.document).show()

# Display a desktop notification informing the user on whether or not the copy
# request was successful.  
# Also, ensure that `ext` is *reset* and that notifications are only displayed
# if the user has enabled the corresponding option (enabled by default).
showNotification = ->
  if store.get 'notifications.enabled'
    webkitNotifications.createHTMLNotification(
      chrome.extension.getURL 'pages/notification.html'
    ).show()
  else
    ext.reset()
  # Close the popup if it's still open and the user wants it closed. Otherwise,
  # reset the popup so that it can be used further.
  if popup = chrome.extension.getViews(type: 'popup')[0]
    if store.get 'toolbar.close'
      popup.close()
    else
      $('#loadDiv', popup.document).hide()
      $('#item', popup.document).show()

# Update the context menu items to reflect the currently enabled templates.  
# If the context menu option has been disabled by the user, just remove all of
# the existing menu items.
updateContextMenu = ->
  # Ensure that any previously added context menu items are removed.
  chrome.contextMenus.removeAll ->
    # Called whenever a menu item is clicked.  
    # Send a self request, passing along the available information.
    onMenuClick = (info, tab) ->
      onRequest
        data: info
        type: 'menu'
    if store.get 'contextMenu'
      # Create and add the top-level Template menu.
      parentId = chrome.contextMenus.create
        contexts: ['all']
        title:    i18n.get 'name'
      # Create and add a sub-menu item for each enabled template.
      for template in ext.templates when template.enabled
        menuId = chrome.contextMenus.create
          contexts: ['all']
          onclick:  onMenuClick
          parentId: parentId
          title:    template.title
        template.menuId = menuId

# Increment the usage for the template with the specified `key` and persist the
# changes.
updateTemplateUsage = (key) ->
  template.usage++ for template in ext.templates when template.key is key
  store.set 'templates', ext.templates

# Data functions
# --------------

# Extract additional information from `tab` and add it to `data`.
addAdditionalData = (tab, data, callback) ->
  chrome.cookies.getAll url: data.url, (cookies) ->
    names     = []
    cookies or= []
    # Extract the names of each cookie.
    names.push cookie.name for cookie in cookies
    $.extend data,
      cookie: ->
        (text, render) ->
          name = render text
          # Attempt to find the value for the cookie name.
          return cookie.value for cookie in cookies when cookie.name is name
          ''
      cookies: names
    # Try to prevent pages hanging because content script wasn't executed.
    if isProtectedPage tab
      $.extend data,
        selection:      ''
        selectionlinks: []
      callback?()
    else
      chrome.tabs.sendRequest tab.id, {}, (response) ->
        $.extend data,
          selection:      response.text or ''
          selectionlinks: response.urls or []
        callback?()

# Creates an object containing data based on information derived from the
# specified tab and menu item data.
buildDerivedData = (tab, onClickData, shortCallback) ->
  data =
    title: tab.title
    url:   ''
  if onClickData.linkUrl
    data.url = onClickData.linkUrl
  else if onClickData.srcUrl
    data.url = onClickData.srcUrl
  else if onClickData.frameUrl
    data.url = onClickData.frameUrl
  else
    data.url = onClickData.pageUrl
  buildStandardData data, shortCallback

# Construct a data object based on information extracted from `tab`.  
# The tab information is then merged with additional information relating to
# the URL of the tab.  
# If a shortened URL is requested when parsing the templates contents later,
# `shortCallback` is called to handle this as we don't want to call a URL
# shortener service unless it is actually required.
buildStandardData = (tab, shortCallback) ->
  compatibility = no
  data          = {}
  title         = ''
  url           = {}
  # Check for any support extensions running on the current tab by simply
  # checking the tabs URL.
  for extension in SUPPORT when isExtensionActive tab, extension.id
    title         = extension.title tab.title
    url           = $.url extension.url tab.url
    compatibility = yes
    break
  # Derive the initial data from the tab itself if no supported extensions were
  # found to be active.
  unless compatibility
    title = tab.title
    url   = $.url tab.url
  # Create references to the base of all grouped options to improve lookup
  # performance.
  anchor        = store.get 'anchor'
  bitly         = store.get 'bitly'
  googl         = store.get 'googl'
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
    bitlyapikey:           bitly.apiKey
    bitlyusername:         bitly.username
    browser:               browser.title
    browserversion:        browser.version
    contextmenu:           store.get 'contextMenu'
    cookiesenabled:        window.navigator.cookieEnabled
    count:                 stats.count
    customcount:           stats.customCount
    datetime:              ->
      (text, render) ->
        new Date().format render(text) or undefined
    decode:                ->
      (text, render) ->
        decodeURIComponent render text
    # Deprecated since 1.0.0, use `anchorTarget` instead.
    doanchortarget:        anchor.target
    # Deprecated since 1.0.0, use `anchorTitle` instead.
    doanchortitle:         anchor.title
    encode:                ->
      (text, render) ->
        encodeURIComponent render text
    # Deprecated since 0.1.0.2, use `encode` instead.
    encoded:               encodeURIComponent url.attr 'source'
    favicon:               tab.favIconUrl
    fparam:                ->
      (text, render) ->
        url.fparam render text
    fparams:               url.fparam()
    fsegment:              ->
      (text, render) ->
        url.fsegment parseInt render(text), 10
    fsegments:             url.fsegment()
    googl:                 googl.enabled
    googloauth:            googl.oauth
    java:                  window.navigator.javaEnabled()
    notifications:         notifications.enabled
    notificationduration:  notifications.duration * .001
    offline:               not window.navigator.onLine
    # Deprecated since 0.1.0.2, use `originalUrl` instead.
    originalsource:        tab.url
    originaltitle:         tab.title or url.attr 'source'
    originalurl:           tab.url
    os:                    operatingSystem
    param:                 ->
      (text, render) ->
        url.param render text
    params:                url.param()
    popular:               ext.queryTemplate (template) ->
      template.key is stats.popular
    segment:               ->
      (text, render) ->
        url.segment parseInt render(text), 10
    segments:              url.segment()
    short:                 ->
      shortCallback?()
    shortcuts:             store.get 'shortcuts'
    title:                 title or url.attr 'source'
    toolbarclose:          toolbar.close
    # Deprecated since 1.0.0, use the inverse of `toolbarPopup` instead.
    toolbarfeature:        not toolbar.popup
    # Deprecated since 1.0.0, use `toolbarStyle` instead.
    toolbarfeaturedetails: toolbar.style
    # Deprecated since 1.0.0, use `toolbarKey` instead.
    toolbarfeaturename:    toolbar.key
    toolbarkey:            toolbar.key
    toolbarpopup:          toolbar.popup
    toolbarstyle:          toolbar.style
    url:                   url.attr 'source'
    version:               ext.version
    yourls:                yourls.enabled
    yourlspassword:        yourls.password
    yourlssignature:       yourls.signature
    yourlsurl:             yourls.url
    yourlsusername:        yourls.username
  data

# HTML building functions
# -----------------------

# Build the HTML to populate the popup with to optimize popup loading times.
buildPopup = ->
  item     = $ '<div id="item"/>'
  itemList = $ '<ul id="itemList"/>'
  loadDiv  = $ '<div id="loadDiv"/>'
  loadDiv.append [
    $ '<img src="../images/loading.gif"/>'
    $ '<div/>', text: i18n.get 'shortening'
  ]...
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
  item.append itemList
  ext.popupHtml = $('<div/>').append(loadDiv, item).html()

# Create an `li` element to represent `template`.  
# The element should then be inserted in to the `ul` element in the popup page
# but is created here to optimize display times for the popup.
buildTemplate = (template) ->
  image = getImagePathForTemplate template, yes
  item  = $ '<li/>',
    key:     template.key
    onclick: 'popup.sendRequest(this)'
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
  store.rename 'update_progress', 'updates', {}
  store.modify 'updates', (updates) ->
    updates.settings ?= []
    # Check if the settings need updated for 0.1.0.0.
    if '0.1.0.0' not in updates.settings
      # Update the settings for 0.1.0.0.
      store.rename 'settingNotification',      'notifications',        on
      store.rename 'settingNotificationTimer', 'notificationDuration', 3000
      store.rename 'settingShortcut',          'shortcuts',            on
      store.rename 'settingTargetAttr',        'doAnchorTarget',       off
      store.rename 'settingTitleAttr',         'doAnchorTitle',        off
      store.remove 'settingIeTabExtract',      'settingIeTabTitle'
      # Ensure that settings are not updated for 0.1.0.0 again.
      updates.settings.push '0.1.0.0'
    # Check if the settings need updated for 1.0.0.
    if '1.0.0' not in updates.settings
      # Update the settings for 1.0.0.
      updates.templates = updates.features ? []
      delete updates.features
      if store.get('options_active_tab') is 'features_nav'
        store.set 'options_active_tab', 'templates_nav'
      store.modify 'anchor', (anchor) ->
        anchor.target = store.get('doAnchorTarget') ? off
        anchor.title  = store.get('doAnchorTitle') ? off
      store.remove 'doAnchorTarget', 'doAnchorTitle'
      store.set 'notifications',
        duration: store.get('notificationDuration') ? 3000
        enabled:  store.get('notifications') ? yes
      store.remove 'notificationDuration'
      # Ensure that settings are not updated for 1.0.0 again.
      updates.settings.push '1.0.0'

# Initialize the settings related to statistical information.
initStatistics = ->
  store.init 'stats', {}
  ext.updateStatistics()

# Initialize `template` and its properties, before adding it to `templates` to
# be persisted later.
initTemplate = (template, templates) ->
  # Derive the index of `template` to determine whether or not it already
  # exists.
  idx = templates.indexOf utils.query templates, yes, (tmpl) ->
    tmpl.key is template.key
  if idx is -1
    # `template` doesn't already exist so add it now.
    templates.push template
  else
    # `template` exists so modify the properties to ensure they are reliable.
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
  store.init 'templates', []
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
  store.modify 'updates', (updates) ->
    updates.templates ?= []
    # Check if the templates need updated for 0.1.0.0.
    if '0.1.0.0' not in updates.templates
      # Update the templates for 0.1.0.0.
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
      # Ensure that templates are not updated for 0.1.0.0 again.
      updates.templates.push '0.1.0.0'
    # Check if the templates need updated for 0.2.0.0.
    if '0.2.0.0' not in updates.templates
      # Update the templates for 0.2.0.0.
      names = store.get('features') ? []
      for name in names when typeof name is 'string'
        store.rename "feat_#{name}_template", "feat_#{name}_content"
        image = store.get "feat_#{name}_image"
        switch typeof image
          when 'string'
            if image in ['', 'spacer.gif', 'spacer.png']
              store.set "feat_#{name}_image", -1
            else
              for img, i in ext.IMAGES
                oldImg = img.replace /^tmpl/, 'feat'
                if "#{oldImg}.png" is image
                  store.set "feat_#{name}_image", i
                  break
          else store.set "feat_#{name}_image", -1
      # Ensure that templates are not updated for 0.2.0.0 again.
      updates.templates.push '0.2.0.0'
    # Check if the templates need updated for 1.0.0.
    if '1.0.0' not in updates.templates
      # Update the templates for 1.0.0.
      names              = store.remove('features') ? []
      templates          = []
      toolbarFeatureName = store.get 'toolbarFeatureName'
      for name in names when typeof name is 'string'
        image = store.remove("feat_#{name}_image") ? -1
        if image is -1
          image = ''
        else
          for img, i in ext.IMAGES when i is image
            image = img
            break
          image = '' if typeof image isnt 'string'
        key = ext.getKeyForName name
        if toolbarFeatureName is name
          store.modify 'toolbar', (toolbar) ->
            toolbar.key = key
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
      # Ensure that templates are not updated for 1.0.0 again.
      updates.templates.push '1.0.0'

# Initialize the settings related to the toolbar/browser action.
initToolbar = ->
  store.init 'toolbar', {}
  initToolbar_update()
  store.modify 'toolbar', (toolbar) ->
    toolbar.close ?= yes
    toolbar.key   ?= 'PREDEFINED.00001'
    toolbar.popup ?= yes
    toolbar.style ?= no
  ext.updateToolbar()

# Handle the conversion/removal of older version of settings that may have been
# stored previously by `initToolbar`.
initToolbar_update = ->
  store.modify 'updates', (updates) ->
    updates.toolbar ?= []
    # Check if the toolbar settings need updated for 1.0.0.
    if '1.0.0' not in updates.toolbar
      # Update the toolbar settings for 1.0.0.
      store.modify 'toolbar', (toolbar) ->
        toolbar.popup = store.get('toolbarPopup') ? yes
        toolbar.style = store.get('toolbarFeatureDetails') ? no
      store.remove 'toolbarFeature',     'toolbarFeatureDetails',
                   'toolbarFeatureName', 'toolbarPopup'
      # Ensure that toolbar settings are not updated for 1.0.0 again.
      updates.toolbar.push '1.0.0'

# Initialize the settings related to the supported URL Shortener services.
initUrlShorteners = ->
  store.init
    bitly:  {}
    googl:  {}
    yourls: {}
  initUrlShorteners_update()
  store.modify 'bitly', (bitly) ->
    bitly.apiKey   ?= ''
    bitly.enabled  ?= no
    bitly.username ?= ''
  store.modify 'googl', (googl) ->
    googl.enabled ?= yes
    googl.oauth   ?= yes
  store.modify 'yourls', (yourls) ->
    yourls.enabled   ?= no
    yourls.password  ?= ''
    yourls.signature ?= ''
    yourls.url       ?= ''
    yourls.username  ?= ''

# Handle the conversion/removal of older version of settings that may have been
# stored previously by `initUrlShorteners`.
initUrlShorteners_update = ->
  store.modify 'updates', (updates) ->
    updates.shorteners ?= []
    # Check if the URL shorteners need updated for 0.1.0.0.
    if '0.1.0.0' not in updates.shorteners
      # Update the URL shorteners for 0.1.0.0.
      store.rename 'bitlyEnabled',       'bitly',         off
      store.rename 'bitlyXApiKey',       'bitlyApiKey',   ''
      store.rename 'bitlyXLogin',        'bitlyUsername', ''
      store.rename 'googleEnabled',      'googl',         on
      store.rename 'googleOAuthEnabled', 'googlOAuth',    on
      # Ensure that URL shorteners are not updated for 0.1.0.0 again.
      updates.shorteners.push '0.1.0.0'
    # Check if the URL shorteners need updated for 1.0.0.
    if '1.0.0' not in updates.shorteners
      # Update the URL shorteners for 1.0.0.
      store.set 'bitly',
        apiKey:    store.get('bitlyApiKey') ? ''
        enabled:   store.get('bitly') ? no
        username:  store.get('bitlyUsername') ? ''
      store.remove 'bitlyApiKey', 'bitlyUsername'
      store.set 'googl',
        enabled: store.get('googl') ? yes
        oauth:   store.get('googlOAuth') ? yes
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
      # Ensure that URL shorteners are not updated for 1.0.0 again.
      updates.shorteners.push '1.0.0'

# URL shortener functions
# -----------------------

# Call the active URL shortener service for `url` in order to obtain the
# relevant short URL.  
# `callback` will be called with the result once it has been received from the
# URL shortener service.
callUrlShortener = (url, callback) ->
  callUrlShortenerHelper (service) ->
    name = service.name
    sUrl = service.url()
    unless sUrl
      # Should never happen... Really just a sanity check.
      callback?(
        message:   i18n.get 'shortener_config_error', name
        shortener: name
        success:   no
      )
      return
    try
      params = service.getParameters(url) or {}
      # Build the HTTP request for the URL shortener service.
      req = new XMLHttpRequest()
      req.open service.method, "#{sUrl}?#{$.param params}", yes
      req.setRequestHeader 'Content-Type', service.contentType
      # Setup the OAuth header, if required.
      if service.oauth and service.isOAuthEnabled()
        req.setRequestHeader 'Authorization',
          service.oauth.getAuthorizationHeader sUrl, service.method, params
      # Wait for the response and let the service handle it before passing the
      # result to `callback`.
      req.onreadystatechange = ->
        if req.readyState is 4
          if req.status is 200
            callback?(
              shortUrl:  service.output req.responseText
              shortener: name
              success:   yes
            )
          else
            # Something went wrong so let's tell the user.
            callback?(
              message:   i18n.get 'shortener_error', name
              shortener: name
              success:   no
            )
      # Finally, send the HTTP request.
      req.send service.input url
    catch error
      # Aw snap! Notify the user via `callback`.
      log.error error
      callback?(
        message:   i18n.get 'shortener_error', name
        shortener: name
        success:   no
      )

# Determine when `callback` is called depending on whether or not the active
# URL Shortener supports [OAuth](http://oauth.net).
callUrlShortenerHelper = (callback) ->
  service = getActiveUrlShortener()
  if service.oauth and service.isOAuthEnabled()
    service.oauth.authorize ->
      callback? service
  else
    callback? service

# Retrieve the active URL shortener service.
getActiveUrlShortener = ->
  # Attempt to lookup enabled URL shortener service.
  shortener = ext.queryUrlShortener (shortener) ->
    shortener.isEnabled()
  return shortener if shortener?
  # Should never reach here but we'll return goo.gl service by default after
  # ensuring it's the active URL shortener service from now on to save some
  # time.
  store.modify 'googl', (googl) ->
    googl.enabled = yes
  getActiveUrlShortener()

# Background page setup
# ---------------------

ext = window.ext =

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

  # Override message displayed in notifications.  
  # This should be reset to an empty string after every copy request.
  message: ''

  # Pre-prepared HTML for the popup to be populated using.  
  # This should be updated whenever templates are changed/updated in any way as
  # this is generated to improve performance and load times of the popup frame.
  popupHtml: ''

  # Indicate whether or not the current copy request was a success.  
  # This should be reset to `false` after every copy request.
  status: no

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
    result  = no
    sandbox = $('#sandbox').val(str).select()
    result  = document.execCommand 'copy'
    sandbox.val ''
    unless hidden
      @status = result
      showNotification()

  # Attempt to retrieve the key of the template with the specified `name`.  
  # Since only the names of predefined templates are known, return a newly
  # generated key if it does not match any of their names.
  getKeyForName: (name, generate = yes) ->
    switch name
      when '_url'      then 'PREDEFINED.00001'
      when '_short'    then 'PREDEFINED.00002'
      when '_anchor'   then 'PREDEFINED.00003'
      when '_encoded'  then 'PREDEFINED.00004'
      when '_bbcode'   then 'PREDEFINED.00005'
      when '_markdown' then 'PREDEFINED.00006'
      else utils.keyGen() if generate

  # Initialize the background page.  
  # This will involve initializing the settings and adding the request
  # listeners.
  init: ->
    store.init
      anchor:        {}
      notifications: {}
      updates:       {}
    init_update()
    store.modify 'anchor', (anchor) ->
      anchor.target ?= off
      anchor.title  ?= off
    store.modify 'notifications', (notifications) ->
      notifications.duration ?= 3000
      notifications.enabled  ?= yes
    store.init
      contextMenu: on
      shortcuts:   on
    initTemplates()
    initToolbar()
    initStatistics()
    initUrlShorteners()
    # Add listener for toolbar/browser action clicks.  
    # This listener will be ignored whenever the popup is enabled.
    chrome.browserAction.onClicked.addListener (tab) ->
      onRequest
        data: key: store.get 'toolbar.key'
        type: 'popup'
    # Add listeners for internal and external requests.
    chrome.extension.onRequest.addListener onRequest
    chrome.extension.onRequestExternal.addListener (req, sender, cb) ->
      return cb?() if isBlacklisted sender
      onRequest req, sender, cb
    # Derive the browser and OS information.
    browser.version = getBrowserVersion()
    operatingSystem = getOperatingSystem()
    # It's nice knowing what version is running.
    $.getJSON chrome.extension.getURL('manifest.json'), (data) =>
      @version = data.version
      # Execute content scripts now that we know the version.
      executeScriptsInExistingWindows()

  # Determine whether or not `os` matches the user's operating system.
  isThisPlatform: (os) ->
    navigator.userAgent.toLowerCase().indexOf(os) isnt -1

  # Attempt to retrieve the contents of the system clipboard as a string.
  paste: ->
    result  = ''
    sandbox = $('#sandbox').val('').select()
    result  = sandbox.val() if document.execCommand 'paste'
    sandbox.val ''
    result

  # Retrieve the first template that passes the specified `filter`.
  queryTemplate: (filter) ->
    utils.query @templates, yes, filter

  # Retrieve the first URL shortener service that passes the specified
  # `filter`.
  queryUrlShortener: (filter) ->
    utils.query SHORTENERS, yes, filter

  # Reset the message and status associated with the current copy request.  
  # This should be called when a copy request is completed regardless of its
  # outcome.
  reset: ->
    @message = ''
    @status  = no

  # Update the statistical information.
  updateStatistics: ->
    store.modify 'stats', (stats) =>
      # Determine which template has the greatest usage.
      maxUsage = 0
      utils.query @templates, no, (template) ->
        maxUsage = template.usage if template.usage > maxUsage
        no
      popular = @queryTemplate (template) ->
        template.usage is maxUsage
      # Calculate the up-to-date statistical information.
      stats.count       = @templates.length
      stats.customCount = stats.count - DEFAULT_TEMPLATES.length
      stats.popular     = popular?.key

  # Update the local list of templates to reflect those persisted.  
  # It is very important that this is called whenever templates may have been
  # changed in order to prepare the popup HTML and optimize performance.
  updateTemplates: ->
    @templates = store.get 'templates'
    @templates.sort (a, b) ->
      a.index - b.index
    buildPopup()
    updateContextMenu()

  # Update the toolbar/browser action depending on the current settings.
  updateToolbar: ->
    image    = 'images/icon_19.png'
    key      = store.get 'toolbar.key'
    template = getTemplateWithKey key if key
    title    = i18n.get 'name'
    if not template or store.get 'toolbar.popup'
      # Use Template's details to style the browser action.
      chrome.browserAction.setIcon  path:  chrome.extension.getURL image
      chrome.browserAction.setTitle title: title
      # Show the popup when the browser action is clicked.
      chrome.browserAction.setPopup popup: 'pages/popup.html'
    else
      # Replace Template's details with that of the selected template.
      if store.get 'toolbar.style'
        image = getImagePathForTemplate template if template.image isnt 0
        title = template.title
      # Potentially change the style of the browser action.
      chrome.browserAction.setIcon  path:  chrome.extension.getURL image
      chrome.browserAction.setTitle title: title
      # Disable the popup, effectively enabling the listener for
      # `chrome.browserAction.onClicked`.
      chrome.browserAction.setPopup popup: ''