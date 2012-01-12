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
  ,
    content:  '[url={url}]{title}[/url]'
    enabled:  yes
    image:    7
    index:    5
    name:     '_bbcode'
    readOnly: yes
    shortcut: 'B'
    title:    utils.i18n 'copy_bbcode'
  ,
    content:  '{#encode}{url}{/encode}'
    enabled:  yes
    image:    5
    index:    3
    name:     '_encoded'
    readOnly: yes
    shortcut: 'E'
    title:    utils.i18n 'copy_encoded'
  ,
    content:  '[{title}]({url})'
    enabled:  yes
    image:    7
    index:    4
    name:     '_markdown'
    readOnly: yes
    shortcut: 'M'
    title:    utils.i18n 'copy_markdown'
  ,
    content:  '{short}'
    enabled:  yes
    image:    16
    index:    1
    name:     '_short'
    readOnly: yes
    shortcut: 'S'
    title:    utils.i18n 'copy_short'
  ,
    content:  '{url}'
    enabled:  yes
    image:    8
    index:    0
    name:     '_url'
    readOnly: yes
    shortcut: 'U'
    title:    utils.i18n 'copy_url'
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
    # TODO: Create a new account and eliminate used of `forchoon`.
    params =
      apiKey:  'R_2371fda46305d0ec3065972f5e72800e'
      format:  'json'
      login:   'forchoon'
      longUrl: url
    if utils.get('bitlyApiKey') and utils.get 'bitlyUsername'
      params.x_apiKey = utils.get 'bitlyApiKey'
      params.x_login  = utils.get 'bitlyUsername'
    return params
  input: ->
    return null
  isEnabled: ->
    return utils.get 'bitly'
  method: 'GET'
  name: 'bit.ly'
  output: (resp) ->
    return JSON.parse(resp).data.url
  url: ->
    return 'http://api.bitly.com/v3/shorten'
,
  # Setup [Google URL Shortener](http://goo.gl).
  contentType: 'application/json'
  getParameters: ->
    return key: 'AIzaSyD504IwHeL3V2aw6ZGYQRgwWnJ38jNl2MY'
  input: (url) ->
    return JSON.stringify longUrl: url
  isEnabled: ->
    return utils.get 'googl'
  isOAuthEnabled: ->
    return utils.get 'googlOAuth'
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
  output: (resp) ->
    return JSON.parse(resp).id
  url: ->
    return 'https://www.googleapis.com/urlshortener/v1/url'
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
    return params
  input: ->
    return null
  isEnabled: ->
    return utils.get 'yourls'
  method: 'POST'
  name: 'YOURLS'
  output: (resp) ->
    return JSON.parse(resp).shorturl
  url: ->
    return utils.get 'yourlsUrl'
]
# List of extensions supported by Template and used for compatibility purposes.
SUPPORT           = [
  # Setup IE Tab.
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
  # Setup IE Tab Classic.
  id: 'miedgcmlgpmdagojnnbemlkgidepfjfi'
  title: (title) ->
    return title
  url: (url) ->
    str = 'ie.html#'
    if url
      idx = url.indexOf str
      return url.substring idx + str.length if idx isnt -1
    return url
,
  # Setup IE Tab Multi (Enhance).
  id: 'fnfnbeppfinmnjnjhedifcfllpcfgeea'
  title: (title) ->
    return title
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
  # Setup Mozilla Gecko Tab.
  id: 'icoloanbecehinobmflpeglknkplbfbm'
  title: (title) ->
    return title
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
    if ext.isProtectedPage tab
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

# Add the feature `name` to the list stored in `localStorage`.  
# `name` will only be added if it doesn't already exist.  
addFeatureName = (name) ->
  features = utils.get 'features'
  if features.indexOf(name) is -1
    features.push name
    utils.set 'features', features
    return yes
  return no

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
  return buildStandardData data, shortCallback

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
  return item.append menu

# Build the HTML to populate the popup with to optimize popup loading times.
buildPopup = ->
  item     = $ '<div id="item"/>'
  itemList = $ '<ul id="itemList"/>'
  loadDiv  = $ '<div id="loadDiv"/>'
  $.prototype.append.apply loadDiv [
    $ '<img src="../images/loading.gif"/>'
    $ '<div/>', text: utils.i18n 'shortening'
  ]
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
  for extension in SUPPORT when ext.isExtensionActive tab, extension.id
    title = extension.title tab.title
    url = $.url extension.url tab.url
    compatibility = yes
    break
  unless compatibility
    title = tab.title
    url   = $.url tab.url
  $.extend data, url.attr(),
    bitly: utils.get 'bitly'
    bitlyapikey: utils.get 'bitlyApiKey'
    bitlyusername: utils.get 'bitlyUsername'
    browser: browser.title
    browserversion: browser.version
    contextmenu: utils.get 'contextMenu'
    cookiesenabled: window.navigator.cookieEnabled
    datetime: ->
      (text, render) ->
        new Date().format render(text) or undefined
    decode: ->
      (text, render) ->
        decodeURIComponent render text
    doanchortarget: utils.get 'doAnchorTarget'
    doanchortitle: utils.get 'doAnchorTitle'
    encode: ->
      (text, render) ->
        encodeURIComponent render text
    # Deprecated since 0.1.0.2, use `encode` instead.
    encoded: encodeURIComponent url.attr 'source'
    favicon: tab.favIconUrl
    fparam: ->
      (text, render) ->
        url.fparam render text
    fparams: url.fparam()
    fsegment: ->
      (text, render) ->
        url.fsegment parseInt render(text), 10
    fsegments: url.fsegment()
    googl: utils.get 'googl'
    googloauth: utils.get 'googlOAuth'
    java: window.navigator.javaEnabled()
    notificationduration: utils.get 'notificationDuration' * .001
    notifications: utils.get 'notifications'
    offline: not window.navigator.onLine
    # Deprecated since 0.1.0.2, use `originalUrl` instead.
    originalsource: tab.url
    originaltitle: tab.title or url.attr 'source'
    originalurl: tab.url
    os: operatingSystem
    param: ->
      (text, render) ->
        url.param render text
    params: url.param()
    segment: ->
      (text, render) ->
        url.segment parseInt render(text), 10
    segments: url.segment()
    'short': ->
      shortCallback?()
    shortcuts: utils.get 'shortcuts'
    title: title or url.attr 'source'
    toolbarfeature: utils.get 'toolbarFeature'
    toolbarfeaturedetails: utils.get 'toolbarFeatureDetails'
    toolbarfeaturename: utils.get 'toolbarFeatureName'
    toolbarpopup: utils.get 'toolbarPopup'
    url: url.attr 'source'
    version: ext.version
    yourls: utils.get 'yourls'
    yourlspassword: utils.get 'yourlsPassword'
    yourlssignature: utils.get 'yourlsSignature'
    yourlsurl: utils.get 'yourlsUrl'
    yourlsusername: utils.get 'yourlsUsername'
  return data

# Call the active URL shortener service for `url` in order to obtain the
# relevant short URL.  
# `callback` will be called with the result once it has been received from the
# URL shortener service.
callUrlShortener = (url, callback) ->
  callUrlShortenerHelper url, (url, service) ->
    name = service.name
    sUrl = service.url()
    unless sUrl
      callback?(
        message:   utils.i18n 'shortener_config_error', name
        shortener: name
        success:   no
      )
      return
    try
      params = service.getParameters(url) or {}
      req = new XMLHttpRequest()
      req.open service.method, "#{sUrl}?#{$.param params}", yes
      req.setRequestHeader 'Content-Type', service.contentType
      if service.oauth and service.isOAuthEnabled()
        req.setRequestHeader 'Authorization',
          service.oauth.getAuthorizationHeader sUrl, service.method, params
      req.onreadystatechange = ->
        if req.readyState is 4
          callback?(
            shortUrl:  service.output req.responseText
            shortener: name
            success:   yes
          )
      req.send service.input url
    catch error
      console.log error.message or error
      callback?(
        message:   utils.i18n 'shortener_error', name
        shortener: name
        success:   no
      )

# Determine when `callback` is called depending on whether or not the active
# URL Shortener supports [OAuth](http://oauth.net).
callUrlShortenerHelper = (url, callback) ->
  service = ext.getUrlShortener()
  if service.oauth and service.isOAuthEnabled()
    service.oauth.authorize ->
      callback? url, service
  else
    callback? url, service

# Delete the stored values for the feature with the specified `name`.
deleteFeature = (name) ->
  utils.remove "feat_#{name}_content"
  utils.remove "feat_#{name}_enabled"
  utils.remove "feat_#{name}_image"
  utils.remove "feat_#{name}_index"
  utils.remove "feat_#{name}_readonly"
  utils.remove "feat_#{name}_shortcut"
  utils.remove "feat_#{name}_title"

# Inject and execute the `content.coffee` and `install.coffee` scripts within
# all of the tabs (where valid) of each Chrome window.
executeScriptsInExistingWindows = ->
  chrome.windows.getAll null, (windows) ->
    for win in windows
      # Retrieve all tabs open in `win`.
      chrome.tabs.query windowId: win.id, (tabs) ->
        # Check tabs are not displaying a *protected* page (i.e. one that will
        # cause an error if an attempt is made to execute content scripts).
        for tab in tabs when not ext.isProtectedPage tab
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
  queryFeature (feature) ->
    feature.menuId is menuId

# Attempt to retrieve the feature with the specified `name`.
getFeatureWithName = (name) ->
  queryFeature (feature) ->
    feature.name is name

# Attempt to retrieve the feature with the specified keyboard `shortcut`.  
# Exclude disabled features from this query.
getFeatureWithShortcut = (shortcut) ->
  queryFeature (feature) ->
    feature.enabled and feature.shortcut is shortcut

# Derive the path of the image used by `feature`.
getImagePathForFeature = (feature, relative) ->
  path = ''
  for image in ext.IMAGES when image.id is feature.image
    path += '../' if relative
    path += "images/#{image.file}"
    break
  return path

# Derive the operating system being used by the user.
getOperatingSystem = ->
  str = navigator.platform
  for os in OPERATING_SYSTEMS when str.indexOf(os.substring) isnt -1
    str = os.title
    break
  return str

# Retrieve the active URL shortener service.
getUrlShortener = ->
  # Attempt to lookup enabled URL shortener service.
  return shortener for shortener in SHORTENERS when shortener.isEnabled()
  # Should never reach here but we'll return goo.gl service by default after
  # ensuring it's the active URL shortener service from now on to save some
  # time.
  utils.set 'googl', yes
  return SHORTENERS[1]

# Handle the conversion/removal of older version of settings that may have
# been stored previously by `ext.init`.
init_update = ->
  update_progress = utils.get 'update_progress'
  update_progress.settings ?= []
  # Check if the settings need updated for 0.1.0.0.
  if update_progress.settings.indexOf('0.1.0.0') is -1
    # Update the settings for 0.1.0.0.
    utils.rename 'settingNotification', 'notifications', on
    utils.rename 'settingNotificationTimer', 'notificationDuration', 3000
    utils.rename 'settingShortcut', 'shortcuts', on
    utils.rename 'settingTargetAttr', 'doAnchorTarget', off
    utils.rename 'settingTitleAttr', 'doAnchorTitle', off
    utils.remove 'settingIeTabExtract'
    utils.remove 'settingIeTabTitle'
    # Ensure that settings are not updated for 0.1.0.0 again.
    update_progress.settings.push '0.1.0.0'
    utils.set 'update_progress', update_progress

# Initilaize the settings for `feature`.  
# Store the name of the `feature` in the persisted list of managed features.
initFeature = (feature) ->
  utils.set "feat_#{feature.name}_content", feature.content
  utils.init "feat_#{feature.name}_enabled", feature.enabled
  utils.init "feat_#{feature.name}_image", feature.image
  utils.init "feat_#{feature.name}_index", feature.index
  utils.set "feat_#{feature.name}_readonly", feature.readOnly
  utils.init "feat_#{feature.name}_shortcut", feature.shortcut
  utils.set "feat_#{feature.name}_title", feature.title
  addFeatureName feature.name
  return feature

# Initialize the persisted managed features.
initFeatures = ->
  utils.init 'features', []
  initFeatures_update()
  initFeature feature for feature in DEFAULT_FEATURES
  ext.updateFeatures()

# Handle the conversion/removal of older version of settings that may have
# been stored previously by `initFeatures`.
initFeatures_update = ->
  update_progress = utils.get 'update_progress'
  update_progress.features ?= []
  # Check if the features need updated for 0.1.0.0.
  if update_progress.features.indexOf('0.1.0.0') is -1
    # Update the features for 0.1.0.0.
    utils.rename 'copyAnchorEnabled', 'feat__anchor_enabled', yes
    utils.rename 'copyAnchorOrder', 'feat__anchor_index', 2
    utils.rename 'copyBBCodeEnabled', 'feat__bbcode_enabled', no
    utils.rename 'copyBBCodeOrder', 'feat__bbcode_index', 4
    utils.rename 'copyEncodedEnabled', 'feat__encoded_enabled', yes
    utils.rename 'copyEncodedOrder', 'feat__encoded_index', 3
    utils.rename 'copyShortEnabled', 'feat__short_enabled', yes
    utils.rename 'copyShortOrder', 'feat__short_index', 1
    utils.rename 'copyUrlEnabled', 'feat__url_enabled', yes
    utils.rename 'copyUrlOrder', 'feat__url_index', 0
    # Ensure that features are not updated for 0.1.0.0 again.
    update_progress.features.push '0.1.0.0'
    utils.set 'update_progress', update_progress
  # Check if the features need updated for 0.2.0.0.
  if update_progress.features.indexOf('0.2.0.0') is -1
    # Update the features for 0.2.0.0.
    names = utils.get 'features'
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

# Initialize the settings related to the toolbar/browser action.
initToolbar = ->
  utils.init 'toolbarPopup', on
  utils.init 'toolbarFeature', off
  utils.init 'toolbarFeatureDetails', off
  utils.init 'toolbarFeatureName', ''
  ext.updateToolbar()

# Initialize the settings related to the supported URL Shortener services.
initUrlShorteners = ->
  initUrlShorteners_update()
  utils.init 'bitly', off
  utils.init 'bitlyApiKey', ''
  utils.init 'bitlyUsername', ''
  utils.init 'googl', on
  utils.init 'googlOAuth', on
  utils.init 'yourls', off
  utils.init 'yourlsPassword', ''
  utils.init 'yourlsSignature', ''
  utils.init 'yourlsUrl', ''
  utils.init 'yourlsUsername', ''

# Handle the conversion/removal of older version of settings that may have
# been stored previously by `initUrlShorteners`.
initUrlShorteners_update = ->
  update_progress = utils.get 'update_progress'
  update_progress.shorteners ?= []
  # Check if the URL shorteners need updated for 0.1.0.0.
  if update_progress.shorteners.indexOf('0.1.0.0') is -1
    # Update the URL shorteners for 0.1.0.0.
    utils.rename 'bitlyEnabled', 'bitly', off
    utils.rename 'bitlyXApiKey', 'bitlyApiKey', ''
    utils.rename 'bitlyXLogin', 'bitlyUsername', ''
    utils.rename 'googleEnabled', 'googl', on
    utils.rename 'googleOAuthEnabled', 'googlOAuth', on
    # Ensure that URL shorteners are not updated for 0.1.0.0 again.
    update_progress.shorteners.push '0.1.0.0'
    utils.set 'update_progress', update_progress

# Determine whether or not `sender` is a blacklisted extension.
isBlacklisted = (sender) ->
  return yes for extension in BLACKLIST when extension is sender.id
  return no

# Retrieve the first feature that passes the specified `filter`.
queryFeature = (filter) ->
  if typeof filter is 'function'
    return feature for feature in ext.features when filter feature

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

  # Clipboard functions
  # -------------------

  # Add `str` to the system clipboard.  
  # All successful copy requests should, at some point, call this function.  
  # If `str` is empty the contents of the system clipboard will not change.
  copy: (str, hidden) ->
    result = no
    sandbox = $('#sandbox').val(str).select()
    result  = document.execCommand 'copy'
    sandbox.val ''
    unless hidden
      ext.status = result
      ext.showNotification()

  # Attempt to retrieve the contents of the system clipboard as a string.
  paste: ->
    result  = ''
    sandbox = $('#sandbox').val('').select()
    result = sandbox.val() if document.execCommand 'paste'
    sandbox.val ''
    return result

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
    initUrlShorteners()
    chrome.browserAction.onClicked.addListener ext.onClick
    chrome.extension.onRequest.addListener ext.onRequest
    chrome.extension.onRequestExternal.addListener ext.onExternalRequest
    # Derive the browser and OS information.
    browser.version = getBrowserVersion()
    operatingSystem = getOperatingSystem()
    # It's nice knowing what version is running.
    $.getJSON chrome.extension.getURL('manifest.json'), (data) ->
      ext.version = data.version
      # Execute content scripts now that we know the version.
      executeScriptsInExistingWindows()

  /**
   * <p>Returns whether or not the extension with the specified identifier is
   * active on the tab provided.</p>
   * @param {Tab} tab The tab to be tested.
   * @param {String} extensionId The identifier of the extension to be
   * tested.
   * @returns {Boolean} <code>true</code> if the extension is active on the
   * tab provided; otherwise <code>false</code>.
   * @since 0.1.1.1
   * @private
   */
  isExtensionActive: function (tab, extensionId) {
      return (ext.isSpecialPage(tab) && tab.url.indexOf(extensionId) !== -1);
  },

  /**
   * <p>Determines whether or not the tab provided is currently displaying a
   * page on the Chrome Extension Gallery (i.e. Web Store).</p>
   * @param {Tab} tab The tab to be tested.
   * @returns {Boolean} <code>true</code> if displaying a page on the Chrome
   * Extension Gallery; otherwise <code>false</code>.
   * @since 0.2.1.0
   */
  isExtensionGallery: function (tab) {
      return tab.url.indexOf('https://chrome.google.com/webstore') === 0;
  },

  /**
   * <p>Determines whether or not the tab provided is currently display a
   * <em>protected</em> page (i.e. a page that content scripts cannot be
   * executed on).</p>
   * @param {Tab} tab The tab to be tested.
   * @returns {Boolean} <code>true</code> if displaying a <em>protected</em>
   * page; otherwise <code>false</code>.
   * @since 0.2.1.0
   */
  isProtectedPage: function (tab) {
      return ext.isSpecialPage(tab) || ext.isExtensionGallery(tab);
  },

  /**
   * <p>Determines whether or not the tab provided is currently displaying a
   * <em>special</em> page (i.e. a page that is internal to the browser).</p>
   * @param {Tab} tab The tab to be tested.
   * @returns {Boolean} <code>true</code> if displaying a <em>special</em>
   * page; otherwise <code>false</code>.
   */
  isSpecialPage: function (tab) {
      return tab.url.indexOf('chrome') === 0;
  },

  /**
   * <p>Determines whether or not the user's OS matches that provided.</p>
   * @param {String} os The operating system to be tested.
   * @returns {Boolean} <code>true</code> if the user's OS matches that
   * specified; otherwise <code>false</code>.
   */
  isThisPlatform: function (os) {
      return navigator.userAgent.toLowerCase().indexOf(os) !== -1;
  },

  /**
   * <p>Loads the values of the feature with the specified name from their
   * respective locations.</p>
   * @param {String} name The name of the feature whose values are to be
   * fetched.
   * @returns {Object} The feature for the name provided.
   * @since 0.1.0.0
   * @private
   */
  loadFeature: function (name) {
      return {
          content: utils.get('feat_' + name + '_content'),
          enabled: utils.get('feat_' + name + '_enabled'),
          image: utils.get('feat_' + name + '_image'),
          index: utils.get('feat_' + name + '_index'),
          name: name,
          readOnly: utils.get('feat_' + name + '_readonly'),
          shortcut: utils.get('feat_' + name + '_shortcut'),
          title: utils.get('feat_' + name + '_title')
      };
  },

  /**
   * <p>Loads the values of each stored feature from their respective
   * locations.</p>
   * <p>The array returned is sorted based on the index of each feature.</p>
   * @returns {Object[]} The array of the features loaded.
   * @since 0.1.0.0
   */
  loadFeatures: function () {
      var features = [],
          names = utils.get('features');
      for (var i = 0; i < names.length; i++) {
          features.push(ext.loadFeature(names[i]));
      }
      features.sort(function (a, b) {
          return a.index - b.index;
      });
      return features;
  },

  /**
   * <p>Listener for toolbar/browser action clicks.</p>
   * @param {Tab} tab The tab active when clicked.
   * @since 0.3.0.0
   * @private
   */
  onClick: function (tab) {
      ext.onRequest({
          data: {
              name: utils.get('toolbarFeatureName')
          },
          type: 'popup'
      });
  },

  /**
   * <p>Listener for external requests to the extension.</p>
   * <p>This function only serves the request if the originating extension is
   * not blacklisted.</p>
   * @param {Object} request The request sent by the calling script.
   * @param {Object} request.data The data for the copy request feature to be
   * served.
   * @param {KeyEvent} [request.data.e] The DOM <code>KeyEvent</code>
   * responsible for generating the copy request. Only used if type is
   * "shortcut".
   * @param {String} [request.data.feature] The name of the feature on which
   * to execute the copy request.
   * @param {String} [request.data.key] The character of the final key
   * responsible for firing the <code>KeyEvent</code>. Only used if type is
   * "shortcut".
   * @param {String} request.type The type of request being made.
   * @param {MessageSender} [sender] An object containing information about
   * the script context that sent a message or request.
   * @param {function} [sendResponse] Function to call when you have a
   * response. The argument should be any JSON-ifiable object, or undefined
   * if there is no response.
   * @private
   */
  onExternalRequest: function (request, sender, sendResponse) {
      if (!isBlacklisted(sender)) {
          ext.onRequest(request, sender, sendResponse);
      }
  },

  /**
   * <p>Listener for internal requests to the extension.</p>
   * <p>If the request originated from a keyboard shortcut this function only
   * serves that request if the keyboard shortcuts have been enabled by the
   * user (or by default).</p>
   * @param {Object} request The request sent by the calling script.
   * @param {Object} request.data The data for the copy request feature to be
   * served.
   * @param {KeyEvent} [request.data.e] The DOM <code>KeyEvent</code>
   * responsible for generating the copy request. Only used if type is
   * "shortcut".
   * @param {String} [request.data.feature] The name of the feature on which
   * to execute the copy request.
   * @param {String} [request.data.key] The character of the final key
   * responsible for firing the <code>KeyEvent</code>. Only used if type is
   * "shortcut".
   * @param {String} request.type The type of request being made.
   * @param {MessageSender} [sender] An object containing information about
   * the script context that sent a message or request.
   * @param {function} [sendResponse] Function to call when you have a
   * response. The argument should be any JSON-ifiable object, or undefined
   * if there is no response.
   * @private
   */
  onRequest: function (request, sender, sendResponse) {
      if (request.type !== 'shortcut' || utils.get('shortcuts')) {
          ext.onRequestHelper(request, sender, sendResponse);
      }
  },

  /**
   * <p>Helper function for the internal/external request listeners.</p>
   * <p>This function will handle the request based on its type and the data
   * provided.</p>
   * @param {Object} request The request sent by the calling script.
   * @param {Object} request.data The data for the copy request feature to be
   * served.
   * @param {KeyEvent} [request.data.e] The DOM <code>KeyEvent</code>
   * responsible for generating the copy request. Only used if type is
   * "shortcut".
   * @param {String} [request.data.feature] The name of the feature on which
   * to execute the copy request.
   * @param {String} [request.data.key] The character of the final key
   * responsible for firing the <code>KeyEvent</code>. Only used if type is
   * "shortcut".
   * @param {String} request.type The type of request being made.
   * @param {MessageSender} [sender] An object containing information about
   * the script context that sent a message or request.
   * @param {function} [sendResponse] Function to call when you have a
   * response. The argument should be any JSON-ifiable object, or undefined
   * if there is no response.
   * @private
   */
  onRequestHelper: function (request, sender, sendResponse) {
      if (request.type === 'version') {
          if (typeof sendResponse === 'function') {
              sendResponse({version: ext.version});
          }
          return;
      }
      chrome.windows.getCurrent(function (win) {
          chrome.tabs.query({
              active: true,
              windowId: win.id
          }, function (tabs) {
              var data = {},
                  feature,
                  popup = chrome.extension.getViews({type: 'popup'})[0],
                  shortCalled = false,
                  shortPlaceholder = 'short' +
                          (Math.floor(Math.random() * 99999 + 1000)),
                  tab = tabs[0];
              function copyOutput(str) {
                  if (str) {
                      ext.copy(str);
                  } else {
                      ext.message = utils.i18n('copy_fail_empty');
                      ext.status = false;
                      ext.showNotification();
                  }
              }
              function shortCallback() {
                  shortCalled = true;
                  return '{' + shortPlaceholder + '}';
              }
              if (popup) {
                  $('#item', popup.document).hide();
                  $('#loadDiv', popup.document).show();
              }
              try {
                  switch (request.type) {
                  case 'menu':
                      data = buildDerivedData(tab, request.data, shortCallback);
                      feature = getFeatureWithMenuId(request.data.menuItemId);
                      break;
                  case 'popup':
                      // Should be cheaper than searching ext.features...
                      data = buildStandardData(tab, shortCallback);
                      feature = ext.loadFeature(request.data.name);
                      break;
                  case 'shortcut':
                      data = buildStandardData(tab, shortCallback);
                      feature = getFeatureWithShortcut(request.data.key);
                      break;
                  }
              } catch (e) {
                  if (e instanceof URIError) {
                      ext.message = utils.i18n('copy_fail_uri');
                  } else {
                      ext.message = utils.i18n('copy_fail_error');
                  }
                  ext.status = false;
                  ext.showNotification();
                  return;
              }
              if (feature) {
                  addAdditionalData(tab, data, function () {
                      if (!feature.content) {
                          // Displays empty template error message
                          copyOutput();
                          return;
                      }
                      var output = Mustache.to_html(feature.content, data);
                      if (shortCalled) {
                          callUrlShortener(data.source, function (response) {
                              if (response.success && response.shortUrl) {
                                  var newData = {};
                                  newData[shortPlaceholder] = response.shortUrl;
                                  copyOutput(Mustache.to_html(output, newData));
                              } else {
                                  if (!response.message) {
                                      response.message = utils.i18n(
                                              'shortener_error',
                                              response.shortener);
                                  }
                                  ext.message = response.message;
                                  ext.status = false;
                                  ext.showNotification();
                              }
                          });
                      } else {
                          copyOutput(output);
                      }
                  });
              } else {
                  if (popup) {
                      popup.close();
                  }
              }
          });
      });
  },

  /**
   * <p>Removes the specified feature name from those stored in
   * localStorage.</p>
   * @param {String} name The feature name to be removed.
   * @since 0.1.0.0
   * @private
   */
  removeFeatureName: function (name) {
      var features = utils.get('features'),
          idx = features.indexOf(name);
      if (idx !== -1) {
          features.splice(idx, 1);
          utils.set('features', features);
      }
  },

  /**
   * <p>Resets the message and status associated with the current copy
   * request.</p>
   * <p>This function should be called on the completion of a copy request
   * regardless of its outcome.</p>
   */
  reset: function () {
      ext.message = '';
      ext.status = false;
  },

  /**
   * <p>Stores the values of the specified feature in to their respective
   * locations.</p>
   * @param {Object} feature The feature whose values are to be saved.
   * @param {String} feature.content The mustache template for the feature.
   * @param {Boolean} feature.enabled <code>true</code> if the feature is
   * enabled; otherwise <code>false</code>.
   * @param {Integer} feature.image The identifier of the feature's image.
   * @param {Integer} feature.index The index representing the feature's
   * display order.
   * @param {String} feature.name The unique name of the feature.
   * @param {Boolean} feature.readOnly <code>true</code> if the feature is
   * read-only and certain values cannot be editted by the user; otherwise
   * <code>false</code>.
   * @param {String} feature.shortcut The keyboard shortcut assigned to the
   * feature.
   * @param {String} feature.title The title of the feature.
   * @returns {Object} The feature provided.
   * @since 0.1.0.0
   * @private
   */
  saveFeature: function (feature) {
      var name = feature.name;
      utils.set('feat_' + name + '_content', feature.content);
      utils.set('feat_' + name + '_enabled', feature.enabled);
      utils.set('feat_' + name + '_image', feature.image);
      utils.set('feat_' + name + '_index', feature.index);
      utils.set('feat_' + name + '_readonly', feature.readOnly);
      utils.set('feat_' + name + '_shortcut', feature.shortcut);
      utils.set('feat_' + name + '_title', feature.title);
      return feature;
  },

  /**
   * <p>Stores the values of each of the speciifed features in to their
   * respective locations.</p>
   * <p>Any features no longer in use are removed from localStorage in an
   * attempt to keep capacity under control.</p>
   * @param {Object[]} features The features whose values are to be saved.
   * @returns {Object[]} The array of features provided.
   * @since 0.1.0.0
   */
  saveFeatures: function (features) {
      var names = [],
          oldNames = utils.get('features');
      for (var i = 0; i < features.length; i++) {
          names.push(features[i].name);
          ext.saveFeature(features[i]);
      }
      // Ensures any features no longer used are removed from localStorage
      for (var j = 0; j < oldNames.length; j++) {
          if (names.indexOf(oldNames[j]) === -1) {
              deleteFeature(oldNames[j]);
          }
      }
      utils.set('features', names);
      return features;
  },

  /**
   * <p>Displays a Chrome notification to inform the user on whether or not
   * the copy request was successful.</p>
   * <p>This function ensures that {@link ext} is reset and that
   * notifications are only displayed if specified by the user (or by
   * default).</p>
   * @see ext.reset
   */
  showNotification: function () {
      var popup = chrome.extension.getViews({type: 'popup'})[0];
      if (utils.get('notifications')) {
          webkitNotifications.createHTMLNotification(
              chrome.extension.getURL('pages/notification.html')
          ).show();
      } else {
          ext.reset();
      }
      if (popup) {
          popup.close();
      }
  },

  /**
   * <p>Updates the context menu items to reflect respective features.</p>
   * @since 0.1.0.0
   * @private
   */
  updateContextMenu: function () {
      // Ensures any previously added context menu items are removed
      chrome.contextMenus.removeAll(function () {
          function onMenuClick(info, tab) {
              ext.onRequestHelper({
                  data: info,
                  type: 'menu'
              });
          }
          if (utils.get('contextMenu')) {
              var menuId,
                  parentId = chrome.contextMenus.create({
                      contexts: ['all'],
                      title: utils.i18n('name')
                  });
              for (var i = 0; i < ext.features.length; i++) {
                  if (ext.features[i].enabled) {
                      menuId = chrome.contextMenus.create({
                          contexts: ['all'],
                          onclick: onMenuClick,
                          parentId: parentId,
                          title: ext.features[i].title
                      });
                      ext.features[i].menuId = menuId;
                  }
              }
          }
      });
  },

  /**
   * <p>Updates the list of features stored locally to reflect that stored
   * in localStorage.</p>
   * <p>It is important that this function is called whenever features might
   * of changed as this also updates the prepared popup HTML.</p>
   */
  updateFeatures: function () {
      ext.features = ext.loadFeatures();
      buildPopup();
      ext.updateContextMenu();
  },

  /**
   * <p>Updates the toolbar/browser action depending on the current
   * settings.</p>
   * @since 0.3.0.0
   */
  updateToolbar: function () {
      var feature,
          featureName = utils.get('toolbarFeatureName'),
          image = 'images/icon_19.png',
          title = utils.i18n('name');
      if (featureName) {
          feature = getFeatureWithName(featureName);
      }
      if (utils.get('toolbarPopup') || !feature) {
          chrome.browserAction.setIcon({
              path: chrome.extension.getURL(image)
          });
          chrome.browserAction.setTitle({title: title});
          chrome.browserAction.setPopup({popup: 'pages/popup.html'});
      } else {
          if (utils.get('toolbarFeatureDetails')) {
              if (feature.image !== 0) {
                  image = getImagePathForFeature(feature);
              }
              title = feature.title;
          }
          chrome.browserAction.setIcon({
              path: chrome.extension.getURL(image)
          });
          chrome.browserAction.setTitle({title: title});
          chrome.browserAction.setPopup({popup: ''});
      }
  }