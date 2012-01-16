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
# Default features to be used by Template.
DEFAULT_FEATURES  = [
    content:  "<a href=\"{{url}}\"{#doAnchorTarget}
 target=\"_blank\"{/doAnchorTarget}{#doAnchorTitle}
 title=\"{{title}}\"{/doAnchorTitle}>{{title}}</a>"
    enabled:  yes
    image:    11
    index:    2
    name:     '_anchor'
    readOnly: yes
    shortcut: 'A'
    title:    utils.i18n 'copy_anchor'
    usage:    0
  ,
    content:  '[url={url}]{title}[/url]'
    enabled:  no
    image:    7
    index:    5
    name:     '_bbcode'
    readOnly: yes
    shortcut: 'B'
    title:    utils.i18n 'copy_bbcode'
    usage:    0
  ,
    content:  '{#encode}{url}{/encode}'
    enabled:  yes
    image:    5
    index:    3
    name:     '_encoded'
    readOnly: yes
    shortcut: 'E'
    title:    utils.i18n 'copy_encoded'
    usage:    0
  ,
    content:  '[{title}]({url})'
    enabled:  no
    image:    7
    index:    4
    name:     '_markdown'
    readOnly: yes
    shortcut: 'M'
    title:    utils.i18n 'copy_markdown'
    usage:    0
  ,
    content:  '{short}'
    enabled:  yes
    image:    16
    index:    1
    name:     '_short'
    readOnly: yes
    shortcut: 'S'
    title:    utils.i18n 'copy_short'
    usage:    0
  ,
    content:  '{url}'
    enabled:  yes
    image:    8
    index:    0
    name:     '_url'
    readOnly: yes
    shortcut: 'U'
    title:    utils.i18n 'copy_url'
    usage:    0
]
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
    params =
      apiKey:  'R_91eabef2f32d88c07b197c9d69eed516'
      format:  'json'
      login:   'templateextension'
      longUrl: url
    if utils.get('bitlyApiKey') and utils.get 'bitlyUsername'
      params.x_apiKey = utils.get 'bitlyApiKey'
      params.x_login  = utils.get 'bitlyUsername'
    params
  input: ->
    null
  isEnabled: ->
    utils.get 'bitly'
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
    utils.get 'googl'
  isOAuthEnabled: ->
    utils.get 'googlOAuth'
  method: 'POST'
  name: 'goo.gl'
  oauth: ChromeExOAuth.initBackgroundPage
    access_url:      'https://www.google.com/accounts/OAuthGetAccessToken'
    app_name:        utils.i18n 'app_name'
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
    if utils.get('yourlsPassword') and utils.get 'yourlsUsername'
      params.password  = utils.get 'yourlsPassword'
      params.username  = utils.get 'yourlsUsername'
    else if utils.get 'yourlsSignature'
      params.signature = utils.get 'yourlsSignature'
    params
  input: ->
    null
  isEnabled: ->
    utils.get 'yourls'
  method: 'POST'
  name: 'YOURLS'
  output: (resp) ->
    JSON.parse(resp).shorturl
  url: ->
    utils.get 'yourlsUrl'
]
# List of extensions supported by Template and used for compatibility purposes.
SUPPORT           = [
  # Setup [IE Tab](http://ietab.net).
  id: 'hehijbfgiekmjfkfjpbkbammjbdenadd'
  title: (title) ->
    str = 'IE: '
    if title
      idx = title.indexOf str
      return title.substring idx + str.length if idx isnt -1
    return title
  url: (url) ->
    str = 'iecontainer.html#url='
    if url
      idx = url.indexOf str
      return decodeURIComponent url.substring idx + str.length if idx isnt -1
    return url
,
  # Setup [IE Tab Classic](http://goo.gl/u7Cau).
  id: 'miedgcmlgpmdagojnnbemlkgidepfjfi'
  title: (title) ->
    title
  url: (url) ->
    str = 'ie.html#'
    if url
      idx = url.indexOf str
      return url.substring idx + str.length if idx isnt -1
    return url
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
        return url
    return url
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
        return url
    return url
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
    return if idx is -1 then str else str.substring 0, idx

# Attempt to retrieve the feature with the specified `menuId`.
getFeatureWithMenuId = (menuId) ->
  ext.queryFeature (feature) ->
    feature.menuId is menuId

# Attempt to retrieve the feature with the specified `name`.
getFeatureWithName = (name) ->
  ext.queryFeature (feature) ->
    feature.name is name

# Attempt to retrieve the feature with the specified keyboard `shortcut`.  
# Exclude disabled features from this query.
getFeatureWithShortcut = (shortcut) ->
  ext.queryFeature (feature) ->
    feature.enabled and feature.shortcut is shortcut

# Derive the path of the image used by `feature`.
getImagePathForFeature = (feature, relative) ->
  path = ''
  for image in ext.IMAGES when image.id is feature.image
    path += '../' if relative
    path += "images/#{image.file}"
    break
  path

# Derive the operating system being used by the user.
getOperatingSystem = ->
  str = navigator.platform
  for os in OPERATING_SYSTEMS when str.indexOf(os.substring) isnt -1
    str = os.title
    break
  str

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
  if request.type is 'shortcut' and not utils.get 'shortcuts'
    return sendResponse?()
  # Version requests are simple, just send the version back. Done!
  if request.type is 'version'
    return sendResponse? version: ext.version
  chrome.windows.getCurrent (win) ->
    chrome.tabs.query
      active:   yes
      windowId: win.id
    , (tabs) ->
      data             = {}
      popup            = chrome.extension.getViews(type: 'popup')[0]
      shortCalled      = no
      shortPlaceholder = "short#{Math.floor Math.random() * 99999 + 1000}"
      tab              = tabs[0]
      # Attempt to copy `str` to the system clipboard while handling the
      # potential for failure.  
      # Finally, increment the usage of `feature` and update the statistics.
      copyOutput = (feature, str) ->
        if str
          ext.copy str
        else
          ext.message = utils.i18n 'copy_fail_empty'
          ext.status  = no
          showNotification()
        updateFeatureUsage feature.name
        ext.updateStatistics()
      # Called whenever the `short` tag is found to indicate that the URL
      # needs shortened.  
      # Replace the `short` tag with the unique placeholder so that it can be
      # rendered again later with the short URL.
      shortCallback = ->
        shortCalled = yes
        "{#{shortPlaceholder}}"
      # If the popup is currently displayed, hide the feature list and show a
      # loading animation.
      if popup
        $('#item', popup.document).hide()
        $('#loadDiv', popup.document).show()
      # Attempt to derive the contextual template data.
      try
        switch request.type
          when 'menu'
            data    = buildDerivedData tab, request.data, shortCallback
            feature = getFeatureWithMenuId request.data.menuItemId
          when 'popup'
            data    = buildStandardData tab, shortCallback
            feature = getFeatureWithName request.data.name
          when 'shortcut'
            data    = buildStandardData tab, shortCallback
            feature = getFeatureWithShortcut request.data.key
      catch error
        # Oops! Something went wrong so we should probably let the user know.
        if error instanceof URIError
          ext.message = utils.i18n 'copy_fail_uri'
        else
          ext.message = utils.i18n 'copy_fail_error'
        ext.status = no
        showNotification()
        return
      if feature
        addAdditionalData tab, data, ->
          unless feature.content
            # Display the *empty template* error message.
            copyOutput feature
            return
          output = Mustache.to_html feature.content, data
          if shortCalled
            # At least one `short` tag was found and replaced, so now we need
            # to call the URL shortener service and replace that with the
            # actual short URL.
            callUrlShortener data.source, (response) ->
              if response.success and response.shortUrl
                # Short URL was successfully returned, so get rendering.
                newData = {}
                newData[shortPlaceholder] = response.shortUrl
                copyOutput feature, Mustache.to_html output, newData
              else
                # Aw man, something went wrong. Let the user down gently.
                unless response.message
                  response.message = utils.i18n 'shortener_error',
                    response.shortener
                ext.message = response.message
                ext.status  = no
                showNotification()
          else
            copyOutput feature, output
      else
        # Close the popup if it's still open.
        popup?.close()

# Display a desktop notification informing the user on whether or not the copy
# request was successful.  
# Also ensure that `ext` is *reset* and that notifications are only displayed
# if the user has enabled the corresponding option (enabled by default).
showNotification = ->
  if utils.get 'notifications'
    webkitNotifications.createHTMLNotification(
      chrome.extension.getURL 'pages/notification.html'
    ).show()
  else
    ext.reset()
  # Close the popup if it's still open.
  chrome.extension.getViews(type: 'popup')[0]?.close()

# Update the context menu items to reflect the current enabled features.  
# If the context menu option has been disabled by the user, just remove all of
# the existing menu items.
updateContextMenu = ->
  # Ensure that any previously added context menu items are removed.
  chrome.contextMenus.removeAll = ->
    # Called whenever a menu item is clicked.  
    # Send a self request, passing along the available information.
    onMenuClick = (info, tab) ->
      onRequest
        data: info
        type: 'menu'
    if utils.get 'contextMenu'
      # Create and add the top-level Template menu.
      parentId = chrome.contextMenus.create
        contexts: ['all']
        title:    utils.i18n 'name'
      # Create and add a sub-menu item for each enabled feature.
      for feature in ext.features when feature.enabled
        menuId = chrome.contextMenus.create
          contexts: ['all']
          onclick:  onMenuClick
          parentId: parentId
          title:    feature.title
        feature.menuId = menuId

# Increment the usage for the feature with the specified `name` and persist the
# changes.
updateFeatureUsage = (name) ->
  feature.usage++ for feature in ext.features when feature.name is name
  utils.set 'features', ext.features

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
          name  = render text
          # Attempt to find the value for the cookie name.
          return cookie.value for cookie in cookies when cookie.name is name
          return ''
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
# If a shortened URL is requested when parsing the feature's content later,
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
  # Merge the initial data with the attributes of the [URL
  # parser](https://github.com/allmarkedup/jQuery-URL-Parser) and all of the
  # custom Template properties.  
  # All properties should be in lower case so that they can be looked up
  # ignoring case by our modified version of
  # [mustache.js](https://github.com/janl/mustache.js).
  $.extend data, url.attr(),
    bitly:                 utils.get 'bitly'
    bitlyapikey:           utils.get 'bitlyApiKey'
    bitlyusername:         utils.get 'bitlyUsername'
    browser:               browser.title
    browserversion:        browser.version
    contextmenu:           utils.get 'contextMenu'
    cookiesenabled:        window.navigator.cookieEnabled
    count:                 utils.get('stats').count
    customcount:           utils.get('stats').customCount
    datetime:              ->
      (text, render) ->
        new Date().format render(text) or undefined
    decode:                ->
      (text, render) ->
        decodeURIComponent render text
    doanchortarget:        utils.get 'doAnchorTarget'
    doanchortitle:         utils.get 'doAnchorTitle'
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
    googl:                 utils.get 'googl'
    googloauth:            utils.get 'googlOAuth'
    java:                  window.navigator.javaEnabled()
    notificationduration:  utils.get 'notificationDuration' * .001
    notifications:         utils.get 'notifications'
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
    popular:               ext.queryFeature (feature) ->
      feature.name is utils.get('stats').popular
    segment:               ->
      (text, render) ->
        url.segment parseInt render(text), 10
    segments:              url.segment()
    short:                 ->
      shortCallback?()
    shortcuts:             utils.get 'shortcuts'
    title:                 title or url.attr 'source'
    toolbarfeature:        utils.get 'toolbarFeature'
    toolbarfeaturedetails: utils.get 'toolbarFeatureDetails'
    toolbarfeaturename:    utils.get 'toolbarFeatureName'
    toolbarpopup:          utils.get 'toolbarPopup'
    url:                   url.attr 'source'
    version:               ext.version
    yourls:                utils.get 'yourls'
    yourlspassword:        utils.get 'yourlsPassword'
    yourlssignature:       utils.get 'yourlsSignature'
    yourlsurl:             utils.get 'yourlsUrl'
    yourlsusername:        utils.get 'yourlsUsername'
  data

# HTML building functions
# -----------------------

# Create an `li` element to represent `feature`.  
# The element should then be inserted in to the `ul` element in the popup page
# but is created here to optimize display times for the popup.
buildFeature = (feature) ->
  image   = getImagePathForFeature feature, yes
  image or= '../images/spacer.png'
  item    = $ '<li/>',
    name:    feature.name
    onclick: 'popup.sendRequest(this)'
  menu    = $ '<div/>',
    class: 'menu'
    style: "background-image: url('#{image}')"
  menu.append $ '<span/>',
    class: 'text'
    text:  feature.title
  if utils.get 'shortcuts'
    modifiers = ext.SHORTCUT_MODIFIERS
    modifiers = ext.SHORTCUT_MAC_MODIFIERS if ext.isThisPlatform 'mac'
    menu.append $ '<span/>',
      class: 'shortcut',
      html:  if feature.shortcut then modifiers + feature.shortcut else ''
  item.append menu

# Build the HTML to populate the popup with to optimize popup loading times.
buildPopup = ->
  item     = $ '<div id="item"/>'
  itemList = $ '<ul id="itemList"/>'
  loadDiv  = $ '<div id="loadDiv"/>'
  loadDiv.append [
    $ '<img src="../images/loading.gif"/>'
    $ '<div/>', text: utils.i18n 'shortening'
  ]...
  # Generate the HTML for each feature.
  for feature in ext.features when feature.enabled
    itemList.append buildFeature feature
  # Add a generic message to state the obvious... that the list is empty.
  if itemList.find('li').length is 0
    itemList.append $('<li/>').append $('<div/>',
      class: 'menu'
      style: "background-image: url('../images/spacer.png')"
    ).append $ '<span/>',
      class: 'text'
      style: 'margin-left: 0'
      text:  utils.i18n 'empty'
  item.append itemList
  ext.popupHtml = $('<div/>').append(loadDiv, item).html()

# Initialization functions
# ------------------------

# Handle the conversion/removal of older version of settings that may have
# been stored previously by `ext.init`.
init_update = ->
  update_progress = utils.get 'update_progress'
  update_progress.settings ?= []
  # Check if the settings need updated for 0.1.0.0.
  if update_progress.settings.indexOf('0.1.0.0') is -1
    # Update the settings for 0.1.0.0.
    utils.rename 'settingNotification',      'notifications',        on
    utils.rename 'settingNotificationTimer', 'notificationDuration', 3000
    utils.rename 'settingShortcut',          'shortcuts',            on
    utils.rename 'settingTargetAttr',        'doAnchorTarget',       off
    utils.rename 'settingTitleAttr',         'doAnchorTitle',        off
    utils.remove 'settingIeTabExtract'
    utils.remove 'settingIeTabTitle'
    # Ensure that settings are not updated for 0.1.0.0 again.
    update_progress.settings.push '0.1.0.0'
    utils.set 'update_progress', update_progress

# Initialize the feature, and it's properties, before adding it to `features`
# to be persisted later.
initFeature = (feature, features) ->
  # Derive the index of the feature to determine whether or not it already
  # exists.
  idx = features.indexOf utils.query features, yes, (feat) ->
    feat.name is feature.name
  if idx is -1
    # Feature doesn't already exist so add it now.
    features.push feature
  else
    # Feature exists so modify the properties to ensure they are reliable.
    if feature.readOnly
      # Feature is read-only so certain properties should always be overriden
      # and others only when they are not already available.
      features[idx].content   = feature.content
      features[idx].enabled  ?= feature.enabled
      features[idx].image    ?= feature.image
      features[idx].index    ?= feature.index
      features[idx].name      = feature.name
      features[idx].readOnly  = yes
      features[idx].shortcut ?= feature.shortcut
      features[idx].title     = feature.title
      features[idx].usage    ?= feature.usage
    else
      # Feature is *not* read-only so set unavailable, but required, properties
      # to their default value.
      features[idx].content  ?= ''
      features[idx].enabled  ?= yes
      features[idx].image    ?= 0
      features[idx].index    ?= 0
      features[idx].name     ?= feature.name
      features[idx].readOnly  = no
      features[idx].shortcut ?= ''
      features[idx].title    ?= feature.name
      features[idx].usage    ?= 0
    feature = features[idx]
  feature

# Initialize the persisted managed features.
initFeatures = ->
  utils.init 'features', []
  initFeatures_update()
  features = utils.get 'features'
  # Initialize all default features to ensure their properties are as expected.
  initFeature feature, features for feature in DEFAULT_FEATURES
  # Now, initialize *all* features to ensure their properties are valid.
  initFeature feature, features for feature in features
  utils.set 'features', features
  ext.updateFeatures()

# Handle the conversion/removal of older version of settings that may have
# been stored previously by `initFeatures`.
initFeatures_update = ->
  update_progress = utils.get 'update_progress'
  update_progress.features ?= []
  # Check if the features need updated for 0.1.0.0.
  if update_progress.features.indexOf('0.1.0.0') is -1
    # Update the features for 0.1.0.0.
    utils.rename 'copyAnchorEnabled',  'feat__anchor_enabled',  yes
    utils.rename 'copyAnchorOrder',    'feat__anchor_index',    2
    utils.rename 'copyBBCodeEnabled',  'feat__bbcode_enabled',  no
    utils.rename 'copyBBCodeOrder',    'feat__bbcode_index',    4
    utils.rename 'copyEncodedEnabled', 'feat__encoded_enabled', yes
    utils.rename 'copyEncodedOrder',   'feat__encoded_index',   3
    utils.rename 'copyShortEnabled',   'feat__short_enabled',   yes
    utils.rename 'copyShortOrder',     'feat__short_index',     1
    utils.rename 'copyUrlEnabled',     'feat__url_enabled',     yes
    utils.rename 'copyUrlOrder',       'feat__url_index',       0
    # Ensure that features are not updated for 0.1.0.0 again.
    update_progress.features.push '0.1.0.0'
    utils.set 'update_progress', update_progress
  # Check if the features need updated for 0.2.0.0.
  if update_progress.features.indexOf('0.2.0.0') is -1
    # Update the features for 0.2.0.0.
    for name in utils.get 'features'
      utils.rename "feat_#{name}_template", "feat_#{name}_content"
      image = utils.get "feat_#{name}_image"
      if typeof image is 'string'
        for img in ext.IMAGES when img.file is image
          utils.set "feat_#{name}_image", img.id
          break
      else if typeof image is 'undefined'
        utils.set "feat_#{name}_image", 0
    # Ensure that features are not updated for 0.2.0.0 again.
    update_progress.features.push '0.2.0.0'
    utils.set 'update_progress', update_progress
  # Check if the features need updated for 1.0.0.
  if update_progress.features.indexOf('1.0.0') is -1
    # Update the features for 1.0.0.
    features = []
    for name in utils.get 'features' when typeof name is 'string'
      features.push
        content:  utils.remove("feat_#{name}_content")  ? ''
        enabled:  utils.remove("feat_#{name}_enabled")  ? yes
        image:    utils.remove("feat_#{name}_image")    ? 0
        index:    utils.remove("feat_#{name}_index")    ? 0
        name:     name
        readOnly: utils.remove("feat_#{name}_readonly") ? no
        shortcut: utils.remove("feat_#{name}_shortcut") ? ''
        title:    utils.remove("feat_#{name}_title")    ? name
        usage:    0
    utils.set 'features', features
    # Ensure that features are not updated for 1.0.0 again.
    update_progress.features.push '1.0.0'
    utils.set 'update_progress', update_progress

# Initialize the settings related to statistical information.
initStatistics = ->
  utils.init 'stats', {}
  ext.updateStatistics()

# Initialize the settings related to the toolbar/browser action.
initToolbar = ->
  utils.init 'toolbarPopup',          on
  utils.init 'toolbarFeature',        off
  utils.init 'toolbarFeatureDetails', off
  utils.init 'toolbarFeatureName',    ''
  ext.updateToolbar()

# Initialize the settings related to the supported URL Shortener services.
initUrlShorteners = ->
  initUrlShorteners_update()
  utils.init 'bitly',           off
  utils.init 'bitlyApiKey',     ''
  utils.init 'bitlyUsername',   ''
  utils.init 'googl',           on
  utils.init 'googlOAuth',      on
  utils.init 'yourls',          off
  utils.init 'yourlsPassword',  ''
  utils.init 'yourlsSignature', ''
  utils.init 'yourlsUrl',       ''
  utils.init 'yourlsUsername',  ''

# Handle the conversion/removal of older version of settings that may have
# been stored previously by `initUrlShorteners`.
initUrlShorteners_update = ->
  update_progress = utils.get 'update_progress'
  update_progress.shorteners ?= []
  # Check if the URL shorteners need updated for 0.1.0.0.
  if update_progress.shorteners.indexOf('0.1.0.0') is -1
    # Update the URL shorteners for 0.1.0.0.
    utils.rename 'bitlyEnabled',       'bitly',         off
    utils.rename 'bitlyXApiKey',       'bitlyApiKey',   ''
    utils.rename 'bitlyXLogin',        'bitlyUsername', ''
    utils.rename 'googleEnabled',      'googl',         on
    utils.rename 'googleOAuthEnabled', 'googlOAuth',    on
    # Ensure that URL shorteners are not updated for 0.1.0.0 again.
    update_progress.shorteners.push '0.1.0.0'
    utils.set 'update_progress', update_progress

# URL shortener functions
# -----------------------

# Call the active URL shortener service for `url` in order to obtain the
# relevant short URL.  
# `callback` will be called with the result once it has been received from the
# URL shortener service.
callUrlShortener = (url, callback) ->
  callUrlShortenerHelper url, (url, service) ->
    name = service.name
    sUrl = service.url()
    unless sUrl
      # Should never happen... Really just a sanity check.
      callback?(
        message:   utils.i18n 'shortener_config_error', name
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
          callback?(
            shortUrl:  service.output req.responseText
            shortener: name
            success:   yes
          )
      # Finally, send the HTTP request.
      req.send service.input url
    catch error
      # Aw snap! Notify the user via `callback`.
      console.log error.message or error
      callback?(
        message:   utils.i18n 'shortener_error', name
        shortener: name
        success:   no
      )

# Determine when `callback` is called depending on whether or not the active
# URL Shortener supports [OAuth](http://oauth.net).
callUrlShortenerHelper = (url, callback) ->
  service = getActiveUrlShortener()
  if service.oauth and service.isOAuthEnabled()
    service.oauth.authorize ->
      callback? url, service
  else
    callback? url, service

# Retrieve the active URL shortener service.
getActiveUrlShortener = ->
  # Attempt to lookup enabled URL shortener service.
  shortener = ext.queryUrlShortener (shortener) ->
    shortener.isEnabled()
  return shortener if shortener?
  # Should never reach here but we'll return goo.gl service by default after
  # ensuring it's the active URL shortener service from now on to save some
  # time.
  utils.set 'googl', yes
  getActiveUrlShortener()

# Background page setup
# ---------------------

ext = window.ext =

  # Public constants
  # ----------------

  # List of images available as feature icons.
  IMAGES: [
    file:     'spacer.gif'
    id:       0
    name:     utils.i18n 'feat_none'
    separate: yes
  ,
    file: 'feat_auction.png'
    id:   1
    name: utils.i18n 'feat_auction'
  ,
    file: 'feat_bug.png'
    id:   2
    name: utils.i18n 'feat_bug'
  ,
    file: 'feat_clipboard.png'
    id:   3
    name: utils.i18n 'feat_clipboard'
  ,
    file: 'feat_clipboard_empty.png'
    id:   4
    name: utils.i18n 'feat_clipboard_empty'
  ,
    file: 'feat_component.png'
    id:   5
    name: utils.i18n 'feat_component'
  ,
    file: 'feat_cookies.png'
    id:   6
    name: utils.i18n 'feat_cookies'
  ,
    file: 'feat_discussion.png'
    id:   7
    name: utils.i18n 'feat_discussion'
  ,
    file: 'feat_globe.png'
    id:   8
    name: utils.i18n 'feat_globe'
  ,
    file: 'feat_google.png'
    id:   9
    name: utils.i18n 'feat_google'
  ,
    file: 'feat_heart.png'
    id:   10
    name: utils.i18n 'feat_heart'
  ,
    file: 'feat_html.png'
    id:   11
    name: utils.i18n 'feat_html'
  ,
    file: 'feat_key.png'
    id:   12
    name: utils.i18n 'feat_key'
  ,
    file: 'feat_lightbulb.png'
    id:   13
    name: utils.i18n 'feat_lightbulb'
  ,
    file: 'feat_lighthouse.png'
    id:   14
    name: utils.i18n 'feat_lighthouse'
  ,
    file: 'feat_lightning.png'
    id:   15
    name: utils.i18n 'feat_lightning'
  ,
    file: 'feat_link.png'
    id:   16
    name: utils.i18n 'feat_link'
  ,
    file: 'feat_linux.png'
    id:   17
    name: utils.i18n 'feat_linux'
  ,
    file: 'feat_mail.png'
    id:   18
    name: utils.i18n 'feat_mail'
  ,
    file: 'feat_newspaper.png'
    id:   19
    name: utils.i18n 'feat_newspaper'
  ,
    file: 'feat_note.png'
    id:   20
    name: utils.i18n 'feat_note'
  ,
    file: 'feat_page.png'
    id:   21
    name: utils.i18n 'feat_page'
  ,
    file: 'feat_plugin.png'
    id:   22
    name: utils.i18n 'feat_plugin'
  ,
    file: 'feat_rss.png'
    id:   23
    name: utils.i18n 'feat_rss'
  ,
    file: 'feat_script.png'
    id:   24
    name: utils.i18n 'feat_script'
  ,
    file: 'feat_scull.png'
    id:   25
    name: utils.i18n 'feat_scull'
  ,
    file: 'feat_sign.png'
    id:   26
    name: utils.i18n 'feat_sign'
  ,
    file: 'feat_siren.png'
    id:   27
    name: utils.i18n 'feat_siren'
  ,
    file: 'feat_star.png'
    id:   28
    name: utils.i18n 'feat_star'
  ,
    file: 'feat_support.png'
    id:   29
    name: utils.i18n 'feat_support'
  ,
    file: 'feat_tag.png'
    id:   30
    name: utils.i18n 'feat_tag'
  ,
    file: 'feat_tags.png'
    id:   31
    name: utils.i18n 'feat_tags'
  ,
    file: 'feat_thumb_down.png'
    id:   32
    name: utils.i18n 'feat_thumb_down'
  ,
    file: 'feat_thumb_up.png'
    id:   33
    name: utils.i18n 'feat_thumb_up'
  ,
    file: 'feat_tools.png'
    id:   34
    name: utils.i18n 'feat_tools'
  ]

  # String representation of the keyboard modifiers listened to by Template on
  # Windows/Linux platforms.
  SHORTCUT_MODIFIERS: 'Ctrl+Alt+'

  # String representation of the keyboard modifiers listened to by Template on
  # Mac platforms.
  SHORTCUT_MAC_MODIFIERS: '&#8679;&#8997;'

  # Public variables
  # ----------------

  # List of copy request features being used by Template, ordered to match that
  # specified by the user.
  features: []

  # Override message displayed in notifications.  
  # This should be reset to an empty string after every copy request.
  message: ''

  # Pre-prepared HTML for the popup to be populated using.  
  # This should be updated whenever feature are changed/updated in any way as
  # this is generated to improve performance and load times of the popup frame.
  popupHtml: ''

  # Indicate whether or not the current copy request was a success.  
  # This should be reset to `false` after every copy request.
  status: no

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
      ext.status = result
      showNotification()

  # Initialize the background page.  
  # This will involve initializing the settings and adding the request
  # listeners.
  init: ->
    utils.init 'update_progress', {}
    init_update()
    utils.init 'contextMenu', on
    utils.init 'notifications', on
    utils.init 'notificationDuration', 3000
    utils.init 'shortcuts', on
    utils.init 'doAnchorTarget', off
    utils.init 'doAnchorTitle', off
    initFeatures()
    initToolbar()
    initStatistics()
    initUrlShorteners()
    # Add listener for toolbar/browser action clicks.  
    # This listener will be ignored whenever the popup is enabled.
    chrome.browserAction.onClicked.addListener (tab) ->
      onRequest
        data: name: utils.get 'toolbarFeatureName'
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
    $.getJSON chrome.extension.getURL('manifest.json'), (data) ->
      ext.version = data.version
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

  # Retrieve the first feature that passes the specified `filter`.
  queryFeature: (filter) ->
    utils.query ext.features, yes, filter

  # Retrieve the first URL shortener service that passes the specified
  # `filter`.
  queryUrlShortener: (filter) ->
    utils.query SHORTENERS, yes, filter

  # Reset the message and status associated with the current copy request.  
  # This should be called when a copy request is completed regardless of its
  # outcome.
  reset: ->
    ext.message = ''
    ext.status  = no

  # Update the local list of features to reflect that persisted.  
  # It is very important that this is called whenever features may have changed
  # in order to prepare the popup HTML and optimize performance.
  updateFeatures: ->
    ext.features = utils.get 'features'
    ext.features.sort (a, b) ->
      a.index - b.index
    buildPopup()
    updateContextMenu()

  # Update the statistical information.
  updateStatistics: ->
    stats = utils.get 'stats'
    # Determine which feature has the greatest usage.
    maxUsage = 0
    utils.query ext.features, no, (feature) ->
      maxUsage = feature.usage if feature.usage > maxUsage
      no
    popFeature = ext.queryFeature (feature) ->
      feature.usage is maxUsage
    # Calculate the up-to-date statistical information.
    stats.count       = ext.features.length
    stats.customCount = stats.count - DEFAULT_FEATURES.length
    stats.popular     = popFeature?.name
    utils.set 'stats', stats

  # Update the toolbar/browser action depending on the current settings.
  updateToolbar: ->
    featureName = utils.get 'toolbarFeatureName'
    image       = 'images/icon_19.png'
    title       = utils.i18n 'name'
    feature = getFeatureWithName featureName if featureName
    if utils.get('toolbarPopup') or not feature
      # Use Template's details to style the browser action.
      chrome.browserAction.setIcon  path:  chrome.extension.getURL image
      chrome.browserAction.setTitle title: title
      # Show the popup when the browser action is clicked.
      chrome.browserAction.setPopup popup: 'pages/popup.html'
    else
      # Replace Template's details with that of the selected feature.
      if utils.get 'toolbarFeatureDetails'
        image = getImagePathForFeature feature if feature.image isnt 0
        title = feature.title
      # Potentially change the style of the browser action.
      chrome.browserAction.setIcon  path:  chrome.extension.getURL image
      chrome.browserAction.setTitle title: title
      # Disable the popup, effectively enabling the listener for
      # `chrome.browserAction.onClicked`.
      chrome.browserAction.setPopup popup: ''