# [Template](http://neocotic.com/template)  
# (c) 2013 Alasdair Mercer  
# Freely distributable under the MIT license.  
# For all details and documentation:  
# <http://neocotic.com/template>

# Private constants
# -----------------

# List of blacklisted extension IDs that should be prevented from sending external messages to
# Template.
BLACKLIST         = []
# Predefined templates to be used by default.
DEFAULT_TEMPLATES = [
  content:  '{url}'
  enabled:  yes
  image:    'globe'
  index:    0
  key:      'PREDEFINED.00001'
  readOnly: yes
  shortcut: 'U'
  title:    i18n.get 'default_template_url'
  usage:    0
,
  content:  '{#shorten}{url}{/shorten}'
  enabled:  yes
  image:    'tag'
  index:    1
  key:      'PREDEFINED.00002'
  readOnly: yes
  shortcut: 'S'
  title:    i18n.get 'default_template_short'
  usage:    0
,
  content:  "<a href=\"{url}\"{#anchorTarget} target=\"_blank\"{/anchorTarget}{#anchorTitle}
 title=\"{{title}}\"{/anchorTitle}>{{title}}</a>"
  enabled:  yes
  image:    'font'
  index:    2
  key:      'PREDEFINED.00003'
  readOnly: yes
  shortcut: 'A'
  title:    i18n.get 'default_template_anchor'
  usage:    0
,
  content:  '{#encode}{url}{/encode}'
  enabled:  yes
  image:    'lock'
  index:    3
  key:      'PREDEFINED.00004'
  readOnly: yes
  shortcut: 'E'
  title:    i18n.get 'default_template_encoded'
  usage:    0
,
  content:  '[url={url}]{title}[/url]'
  enabled:  no
  image:    'comment'
  index:    5
  key:      'PREDEFINED.00005'
  readOnly: yes
  shortcut: 'B'
  title:    i18n.get 'default_template_bbcode'
  usage:    0
,
  content:  '[{title}]({url})'
  enabled:  no
  image:    'asterisk'
  index:    4
  key:      'PREDEFINED.00006'
  readOnly: yes
  shortcut: 'M'
  title:    i18n.get 'default_template_markdown'
  usage:    0
,
  content:  '{selectionMarkdown}'
  enabled:  no
  image:    'italic'
  index:    6
  key:      'PREDEFINED.00007'
  readOnly: yes
  shortcut: 'I'
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
# Milliseconds before the popup automatically resets or closes, depending on user preferences.
POPUP_DELAY       = 600
# Regular expression used to extract useful information from different variations of names for tags
# that are evaluated/executed later.
R_EXPRESION_TAG   = /^(select|xpath)(all)?(\S*)?$/
# Regular expression used to detect upper case characters.
R_UPPER_CASE      = /[A-Z]+/
# Very primitive regular expression used to perform simple URL validation.
R_VALID_URL       = /^https?:\/\/\S+\.\S+/i
# Extension ID of the production version of Template.
REAL_EXTENSION_ID = 'dcjnfaoifoefmnbhhlbppaebgnccfddf'
# List of URL shortener services supported by Template.
SHORTENERS        = [
  # Setup [bitly](http://bit.ly).
  name: 'bitly'
  title: i18n.get 'shortener_bitly'
  method: 'GET'

  getHeaders: ->
    'Content-Type': 'application/x-www-form-urlencoded'

  getParameters: (url) ->
    params =
      format:  'json'
      longUrl: url
    if @oauth.hasAccessToken()
      params.access_token = @oauth.getAccessToken()
    else
      params.apiKey = ext.config.services.bitly.api_key
      params.login  = ext.config.services.bitly.login
    params

  getUsage: ->
    store.get 'bitly.usage'

  input: ->
    null

  isEnabled: ->
    store.get 'bitly.enabled'

  oauth: ->
    options = _.pick ext.config.services.bitly, 'client_id', 'client_secret'
    new OAuth2 'bitly', options

  output: (resp) ->
    JSON.parse(resp).data.url

  url: ->
    ext.config.services.bitly.url
,
  # Setup [Google URL Shortener](http://goo.gl).
  name: 'googl'
  title: i18n.get 'shortener_googl'
  method: 'POST'

  getHeaders: ->
    headers = 'Content-Type': 'application/json'
    headers.Authorization = "OAuth #{@oauth.getAccessToken()}" if @oauth.hasAccessToken()
    headers

  getParameters: ->
    unless @oauth.hasAccessToken()
      key: ext.config.services.googl.api_key

  getUsage: ->
    store.get 'googl.usage'

  input: (url) ->
    JSON.stringify longUrl: url

  isEnabled: ->
    store.get 'googl.enabled'

  oauth: ->
    options = _.pick ext.config.services.googl, 'api_scope', 'client_id', 'client_secret'
    new OAuth2 'google', options

  output: (resp) ->
    JSON.parse(resp).id

  url: ->
    ext.config.services.googl.url
,
  # Setup [YOURLS](http://yourls.org).
  name: 'yourls'
  title: i18n.get 'shortener_yourls'
  method: 'POST'

  getHeaders: ->
    'Content-Type': 'application/json'

  getParameters: (url) ->
    params =
      action: 'shorturl'
      format: 'json'
      url:    url

    {authentication, password, signature, username} = store.get 'yourls'
    switch authentication
      when 'advanced'
        params.signature = signature if signature
      when 'basic'
        params.password  = password  if password
        params.username  = username  if username

    params

  getUsage: ->
    store.get 'yourls.usage'

  input: ->
    null

  isEnabled: ->
    store.get 'yourls.enabled'

  output: (resp) ->
    JSON.parse(resp).shorturl

  url: ->
    store.get 'yourls.url'
]
# List of extensions supported by Template and used for compatibility purposes.
SUPPORT           =

  # Setup [IE Tab](http://ietab.net).
  hehijbfgiekmjfkfjpbkbammjbdenadd: (tab) ->
    if tab.title
      str       = 'IE: '
      idx       = tab.title.indexOf str
      tab.title = tab.title.substring idx + str.length if idx isnt -1

    if tab.url
      str     = 'iecontainer.html#url='
      idx     = tab.url.indexOf str
      tab.url = decodeURIComponent tab.url.substring idx + str.length if idx isnt -1

  # Setup [IE Tab Classic](http://goo.gl/u7Cau).
  miedgcmlgpmdagojnnbemlkgidepfjfi: (tab) ->
    if tab.url
      str     = 'ie.html#'
      idx     = tab.url.indexOf str
      tab.url = tab.url.substring idx + str.length if idx isnt -1

  # Setup [IE Tab Multi (Enhance)](http://iblogbox.com/chrome/ietab).
  fnfnbeppfinmnjnjhedifcfllpcfgeea: (tab) ->
    if tab.url
      str = 'navigate.html?chromeurl='
      idx = tab.url.indexOf str
      if idx isnt -1
        tab.url = tab.url.substring idx + str.length
        str     = '[escape]'
        tab.url = decodeURIComponent tab.url[str.length..] unless tab.url.indexOf str

  # Setup [Mozilla Gecko Tab](http://iblogbox.com/chrome/geckotab).
  icoloanbecehinobmflpeglknkplbfbm: (tab) ->
    if tab.url
      str = 'navigate.html?chromeurl='
      idx = tab.url.indexOf str
      if idx isnt -1
        tab.url = tab.url.substring idx + str.length
        str     = '[escape]'
        tab.url = decodeURIComponent tab.url[str.length..] unless tab.url.indexOf str

# Used by Chrome to represent an unknown language (i.e. one that it couldn't detect).
UNKNOWN_LOCALE    = 'und'

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

# Private functions
# -----------------

# Inject and execute the `content.coffee` and `install.coffee` scripts within all of the tabs
# (where valid) of each Chrome window.
executeScriptsInExistingWindows = ->
  log.trace()

  chrome.tabs.query {}, (tabs) ->
    log.info 'Checking the following tabs for content script execution...', tabs

    # Check tabs are not displaying a *protected* page (i.e. one that will cause an error if an
    # attempt is made to execute content scripts).
    for tab in tabs when not isProtectedPage tab
      chrome.tabs.executeScript tab.id, file: 'lib/content.js'
      # Only execute inline installation content script for tabs displaying a page on Template's
      # homepage domain.
      chrome.tabs.executeScript tab.id, file: 'lib/install.js' if HOMEPAGE_DOMAIN in tab.url

# Attempt to derive the current version of the user's browser.
getBrowserVersion = ->
  log.trace()

  str = navigator.userAgent
  idx = str.indexOf browser.title
  if idx isnt -1
    str = str.substring idx + browser.title.length + 1
    idx = str.indexOf ' '
    if idx is -1 then str else str[0...idx]

# Build a list of shortcuts used by enabled templates.
getHotkeys = ->
  log.trace()

  template.shortcut for template in ext.templates when template.enabled

# Derive the operating system being used by the user.
getOperatingSystem = ->
  log.trace()

  return os.title for os in OPERATING_SYSTEMS when os.substring in navigator.platform
  navigator.platform

# Attempt to retrieve the template with the specified `key`.
getTemplateWithKey = (key) ->
  log.trace()

  _.findWhere ext.templates, {key}

# Attempt to retrieve the template with the specified `menuId`.
getTemplateWithMenuId = (menuId) ->
  log.trace()

  _.findWhere ext.templates, {menuId}

# Attempt to retrieve the template with the specified keyboard `shortcut`.  
# Exclude disabled templates from this query.
getTemplateWithShortcut = (shortcut) ->
  log.trace()

  _.findWhere ext.templates, {enabled: yes, shortcut}

# Determine whether or not the identified extension is blacklisted.
isBlacklisted = (extensionId) ->
  log.trace()

  return yes for extension in BLACKLIST when extension is extensionId
  no

# Determine whether or not the specified extension is active on `tab`.
isExtensionActive = (tab, extensionId) ->
  log.trace()

  log.debug "Checking activity of supported extension '#{extensionId}'"

  isSpecialPage(tab) and extensionId in tab.url

# Determine whether or not `tab` is currently displaying a *protected* page (i.e. a page that
# content scripts cannot be executed on).
isProtectedPage = (tab) ->
  log.trace()

  isSpecialPage(tab) or isWebStore tab

# Determine whether or not `tab` is currently displaying a *special* page (i.e. a page that is
# internal to the browser).
isSpecialPage = (tab) ->
  log.trace()

  not tab.url.indexOf 'chrome'

# Determine whether or not `tab` is currently displaying a page on the Chrome Web Store.
isWebStore = (tab) ->
  log.trace()

  not tab.url.indexOf 'https://chrome.google.com/webstore'

# Ensure `null` is returned instead of `object` if it is *empty*.
nullIfEmpty = (object) ->
  log.trace()

  if _.isEmpty object then null else object

# Listener for internal messages sent to the extension.  
# External messages are also routed through here, but only after being checked that they do not
# originate from a blacklisted extension.
onMessage = (message, sender, sendResponse) ->
  log.trace()

  # Safely handle callback functionality.
  callback = utils.callback sendResponse

  # Message type is required. Informal rejection.
  return do callback unless message.type

  # Don't allow shortcut requests when shortcuts are disabled.
  return do callback if message.type is 'shortcut' and not store.get 'shortcuts.enabled'

  # Select or create a tab for the Options page.
  if message.type is 'options'
    selectOrCreateTab utils.url 'pages/options.html'
    # Close the popup if it's currently open. This *should* happen naturally but is being forced to
    # ensure consistency.
    chrome.extension.getViews(type: 'popup')[0]?.close()
    return do callback

  # Info requests are simple, just send some useful information back. Done!
  if message.type in ['info', 'version']
    return callback
      hotkeys: do getHotkeys
      id:      EXTENSION_ID
      version: ext.version

  # Variables to maintain the various states for this request.
  active       = data   = output   = template = null
  editable     = link   = shortcut = no
  id           = utils.keyGen '', null, 't', no
  placeholders = {}

  async.series [
    (done) ->
      # Find the active tab within the current window.
      chrome.tabs.query {active: yes, currentWindow: yes}, (tabs) ->
        log.debug 'Checking the following tabs for the active tab...', tabs
        active = _.first tabs
        do done

    (done) ->
      # Return a callback function to be used by a tag to indicate that it requires further
      # action.  
      # Replace the tag with the unique placeholder so that it can be rendered again later with the
      # final value.
      getCallback = (tag) ->
        (text, render) ->
          text = render text if text
          text = @url        if tag is 'shorten' and not text
          trim = text?.trim() or ''
          log.debug "Following is the contents of a #{tag} tag...", text

          # If `trim` doesn't appear to be a valid so just return the rendered `text`.
          return text if not trim or tag is 'shorten' and not R_VALID_URL.test trim

          # Search for existing placeholder to improve performance later down the line (e.g.
          # multiple URL shortener requests for the same URL).
          for own key, val of placeholders
            if val.data is trim and val.tag is tag
              placeholder = key
              break

          # Ensure the placeholder is stored correctly for later use.
          unless placeholder?
            placeholder = utils.keyGen '', null, 'c', no
            placeholders[placeholder] = {data: trim, tag}
            # Sections are re-rendered so the context must have a property for the placeholder the
            # replaces itself with itself so that it still when it comes to replacing with the
            # final value.
            this[placeholder] = "{#{placeholder}}"

          log.debug "Replacing #{tag} tag with #{placeholder} placeholder"
          "{#{placeholder}}"

      # If the popup is currently displayed, hide the template list and show a loading animation.
      updateProgress null, yes

      try
        # Attempt to derive the contextual template data.
        template = deriveMessageTempate message
        updateProgress 10

        {data, editable, link, shortcut} = deriveMessageInfo message, active, getCallback
        updateProgress 20

        do done
      catch err
        # Oops! Something went wrong so we should probably let the user know.
        log.error err

        if err instanceof AppError
          done err
        else
          done new AppError if err instanceof URIError
            'result_bad_uri_description'
          else
            'result_bad_error_description'

    (done) ->
      updateProgress 30

      # Extract additional data from the environment.
      addAdditionalData active, data, id, editable, shortcut, link, ->
        updateProgress 40

        # Ensure all properties of `data` are lower case.
        transformData data
        # To complete the data, simply extend it using `template`.
        $.extend data, {template}
        log.debug "Using the following data to render #{template.title}...", data

        # Render the initial template output based on `data`.  
        # This *may* be rendered again to replace any temporary placeholders that were inserted.
        if template.content
          output = Mustache.render template.content, data
          log.debug 'The following was generated as a result...', output

        updateProgress 60
        output ?= ''

        do done

    (done) ->
      updateProgress 70

      # Only proceed if any placeholders were inserted and replaced, as they need to be handled now
      # in order to replace any placeholders with their final values.
      return do done if _.isEmpty placeholders

      # Maps to populated with relevant data derived from their related stored placeholders.
      expressionMap = {}
      shortenMap    = {}

      for own placeholder, info of placeholders
        if info.tag is 'shorten'
          shortenMap[placeholder] = info.data
        else
          match = info.tag.match R_EXPRESION_TAG
          if match
            expressionMap[placeholder] =
              all:        match[2]?
              convertTo:  match[3]
              expression: info.data
              type:       match[1]

      async.series [
        (done) ->
          updateProgress 80

          # Only proceed if any expression (e.g. *select*, *xpath*) placeholders were used.
          return do done if _.isEmpty expressionMap

          # Evaluate all of the expressions within the `active` tab and update `expressionMap` with
          # the results.
          evaluateExpressions active, expressionMap, (err) ->
            updateProgress 85

            unless err
              log.info "#{_.size expressionMap} expression(s) were evaluated"

              # Update the corresponding placeholders with their result.
              placeholders[placeholder] = value for own placeholder, value of expressionMap

            done err

        (done) ->
          updateProgress 90

          # Only proceed if any URL shortener placeholders were used.
          return do done if _.isEmpty shortenMap

          # Call the active URL shortener service for each of the placeholders.
          callUrlShortener shortenMap, (err, response) ->
            updateProgress 95

            unless err
              log.info "URL shortener service was called #{_.size shortenMap} time(s)"

              # Update the URL shortener service's usage to ensure captured statistics are
              # accurate.
              updateUrlShortenerUsage response.service.name, response.oauth
              # Update the corresponding placeholders with their result.
              placeholders[placeholder] = value for own placeholder, value of shortenMap

            done err

      ], (err) ->
        unless err
          # Request(s) were successful so render the output again.
          output = Mustache.render output, placeholders
          log.debug 'The follow was re-generated as a result...', output

        done err

  ], (err) ->
    updateProgress 100

    # Transform message type into a more user-friendly form.
    type = utils.capitalize message.type

    analytics.track 'Requests', 'Processed', type, if shortcut then message.data.key.charCodeAt 0

    # Ensure that the user is notified if they have attempted to copy an empty string to the system
    # clipboard.
    if not err and not output
      err = new AppError 'result_bad_empty_description', template.title

    notification = ext.notification

    if err
      # Notify the user that an error occurred while processing the copy request.
      log.warn err.message

      notification.title       = i18n.get 'result_bad_title'
      notification.titleStyle  = 'color: #B94A48'
      notification.description = err.message ? i18n.get 'result_bad_description', template.title

      do showNotification
    else
      # Update the activated template's usage to ensure captured statistics accurate.
      updateTemplateUsage template.key
      do updateStatistics

      # Notify the user that the copy request was successful once it has been completed.
      notification.title       = i18n.get 'result_good_title'
      notification.titleStyle  = 'color: #468847'
      notification.description = i18n.get 'result_good_description', template.title

      ext.copy output

      # Finally, allow the copied content to be *pasted* into a field on the active tab.  
      # This action is dependant on whether the page is *protected*, the relevant option is
      # enabled, and that a field was within the context of the template's activation.
      if not isProtectedPage(active) and (editable and store.get 'menu.paste') or
          (shortcut and store.get 'shortcuts.paste')
        chrome.tabs.sendMessage active.id, {contents: output, id, type: 'paste'}

    log.debug "Finished handling a #{type} request"

# Listener for external messages sent to the extension.  
# Only messages sent from extensions/apps that have not been previously blacklisted routed to
# `onMessage`.
onMessageExternal = (message, sender, sendResponse) ->
  log.trace()

  # Safely handle callback functionality.
  callback = utils.callback sendResponse

  # Ensure blacklisted extensions/apps are blocked.
  blocked = isBlacklisted sender.id

  analytics.track 'External Requests', 'Started', sender.id, Number !blocked

  if blocked
    log.debug "Blocked external request from #{sender.id}"
    return do callback

  log.debug "Accepted external request from #{sender.id}"

  # Route message as if it was sent internally.
  onMessage message, sender, sendResponse

# Attempt to select a tab in the current window displaying a page whose location begins with
# `url`.  
# If no existing tab exists a new one is created.
selectOrCreateTab = (url, callback) ->
  log.trace()

  # Retrieve the tabs of last focused window to check for an existing one with a *matching* URL.
  chrome.windows.getLastFocused populate: yes, (win) ->
    {tabs} = win

    log.debug 'Checking the tabs of the following last focused window...', win
    log.debug 'Checking the following tabs for a matching URL...', tabs

    # Try to find an existing tab that begins with `url`.
    for tab in tabs when not tab.url.indexOf url
      existing = tab
      break

    if existing?
      # Found one! Now to select it.
      chrome.tabs.update existing.id, active: yes
      callback? existing
    else
      # Ach well, let's just create a brand-spanking new one.
      chrome.tabs.create {windowId: win.id, url, active: yes}, (tab) ->
        callback? tab

# Display a desktop notification informing the user on whether or not the copy request was
# successful.
showNotification = ->
  log.trace()

  # Ensure that `ext` is *reset* and that a notification is only displayed if the user has enabled
  # the corresponding option (enabled by default).
  if store.get 'notifications.enabled'
    webkitNotifications.createHTMLNotification(utils.url 'pages/notification.html').show()
  else
    ext.reset()

  # Reset and hide any visible progress bar on the popup, where possible.
  updateProgress null, no

# Update hotkeys stored by the `content.coffee` script within all of the tabs (where valid) of each
# Chrome window.
updateHotkeys = ->
  log.trace()

  hotkeys = do getHotkeys

  # Retrieve all open tabs (on all windows) and update their registered keyboard shortcuts.
  chrome.tabs.query {}, (tabs) ->
    log.info 'Updating the hotkeys registed in the following tabs...', tabs

    # Check tabs are not displaying a *protected* page (i.e. one that will cause an error if an
    # attempt is made to send a message to it).
    for tab in tabs when not isProtectedPage tab
      chrome.tabs.sendMessage tab.id, {hotkeys}

# Update the popup UI state to reflect the progress of the current request.  
# Ignore `percent` if `toggle` is specified; otherwise update the percentage on the progress bar
# and reset the delay timer.  
# `toggle` can be used to show the progress bar or reset/close the popup.
updateProgress = (percent, toggle) ->
  log.trace()

  popup       = $ chrome.extension.getViews(type: 'popup')[0]
  templates   = if popup.length then $ '#templates', popup[0].document else $()
  loading     = if popup.length then $ '#loading',   popup[0].document else $()
  progressBar = loading.find '.bar'

  if toggle?
    if toggle
      # Reset the progress bar to zero and ensure it's visible while the templates are hidden.
      progressBar.css 'width', '0%'
      popup.delay            POPUP_DELAY
      templates.hide().delay POPUP_DELAY
      loading.show().delay   POPUP_DELAY
    else
      if store.get 'toolbar.close'
        # Close the popup, where possible.
        popup.queue ->
          popup.dequeue()[0]?.close()
      else
        # Reset the progress bar to zero and ensure it's hidden while the templates are visibile.
        loading.queue ->
          loading.hide().dequeue()
          progressBar.css 'width', '0%'
        templates.queue ->
          templates.show().dequeue()
  else if percent?
    # Update the progress bar to display the specified `percent`.
    log.info "Updating bar progress to #{percent}%"

    popup.dequeue().delay     POPUP_DELAY
    templates.dequeue().delay POPUP_DELAY
    loading.dequeue().delay   POPUP_DELAY
    progressBar.css 'width', "#{percent}%"

# Update the statistical information.
updateStatistics = ->
  log.trace()

  log.info 'Updating statistics'

  store.init 'stats', {}
  store.modify 'stats', (stats) ->
    # Determine which template has the greatest usage.
    popular = _.max ext.templates, (template) ->
      template.usage
    # Calculate the up-to-date statistical information.
    stats.count       = ext.templates.length
    stats.customCount = stats.count - DEFAULT_TEMPLATES.length
    stats.popular     = popular?.key

# Increment the usage for the template with the specified `key` and persist the changes.
updateTemplateUsage = (key) ->
  log.trace()

  template = _.findWhere ext.templates, {key}

  if template?
    template.usage++
    store.set 'templates', ext.templates

    log.info "Used the #{template.title} template"
    analytics.track 'Templates', 'Used', template.title, Number template.readOnly

# Increment the usage for the URL shortener service with the specified `name` and persist the
# changes.
updateUrlShortenerUsage = (name, oauth) ->
  log.trace()

  shortener = _.findWhere SHORTENERS, {name}

  if shortener?
    store.modify name, (shortener) ->
      shortener.usage++

    log.info "Used the #{shortener.title} URL shortener"
    analytics.track 'Shorteners', 'Used', shortener.title, Number oauth

# Errors
# ------

# `AppError` allows easy identification of internal errors.
class AppError extends Error

  # Create a new instance of `AppError` with a localized message.
  constructor: (messageKey, substitutions...) ->
    Error.call this, if messageKey then i18n.get messageKey, substitutions

# Data functions
# --------------

# Extract additional information from `tab` and add it to `data`.
addAdditionalData = (tab, data, id, editable, shortcut, link, callback) ->
  log.trace()

  async.parallel [
    (done) ->
      # Retrieve all of the URLs from tabs contained in the same window as `tab`.
      chrome.tabs.query windowId: tab.windowId, (tabs) ->
        log.debug 'Extracting the URLs from the following tabs...',   tabs

        tabs = _.pluck tabs, 'url'

        done null, {tabs}

    (done) ->
      # Allow Chrome to attemt automatic language detection on `tab`.
      chrome.tabs.detectLanguage tab.id, (locale) ->
        log.debug "Chrome automatically detected language: #{locale}"

        locale = '' unless locale and locale isnt UNKNOWN_LOCALE

        done null, {locale}

    (done) ->
      coords = {}

      # Retrieve the geolocation from the client.
      navigator.geolocation.getCurrentPosition (position) ->
        log.debug 'Retrieved the following geolocation information...', position

        for own prop, value of position.coords
          coords[prop.toLowerCase()] = if value? then "#{value}" else ''

        done null, {coords}
      , (err) ->
        log.warn 'Ingoring error thrown when calculating geolocation', err.message

        done null, {coords}

    (done) ->
      # Retrieve all of the cookies the client has stored for the contextual URL.
      chrome.cookies.getAll url: data.url, (cookies = []) ->
        log.debug 'Found the following cookies...', cookies

        done null,
          cookie: ->
            (text, render) ->
              # Attempt to find the value for the cookie name.
              name   = render text
              cookie = _.findWhere cookies, {name}

              cookie?.value or ''
          cookies: _.chain(cookies).pluck('name').uniq().value()

    (done) ->
      # Try to prevent pages hanging because content script should not have been executed.
      return do done if isProtectedPage tab

      # Call the content script running within `tab` and request additional data to be extracted
      # from the page's DOM.  
      # The content script also takes this oppertunity to prepare for a second request that may
      # potentially be sent later instructing it to paste the result of this copy request into a
      # field within the context of the template's activation.
      chrome.tabs.sendMessage tab.id, {editable, id, link, shortcut, url: data.url}, (response) ->
        log.debug 'The following data was retrieved from the content script...', response

        # Safety mechanism for when content scripts haven't been updated along with the extension
        # so the request gets stuck. This is mainly an issue in development and not production.
        response ?= {}

        # Attempt to transform `lastModified` into a usable date.
        lastModified = if response.lastModified?
          time = Date.parse response.lastModified
          new Date time unless isNaN time

        # Sanitize the `response` so that it's data can be cleanly integrated.
        done null,
          author:         response.author         ? ''
          characterset:   response.characterSet   ? ''
          description:    response.description    ? ''
          images:         response.images         ? []
          keywords:       response.keywords       ? []
          lastmodified:   ->
            (text, render) ->
              lastModified?.format(render(text) or undefined) ? ''
          linkhtml:       response.linkHTML       ? ''
          links:          response.links          ? []
          linktext:       response.linkText       ? ''
          pageheight:     response.pageHeight     ? ''
          pagewidth:      response.pageWidth      ? ''
          referrer:       response.referrer       ? ''
          scripts:        response.scripts        ? []
          selectedimages: response.selectedImages ? []
          selectedlinks:  response.selectedLinks  ? []
          selection:      response.selection      ? ''
          selectionhtml:  response.selectionHTML  ? ''
          # Deprecated since 1.0.0, use `selectedLinks` instead.
          selectionlinks: ->
            @selectedlinks
          stylesheets:    response.styleSheets    ? []

  ], (err, results = []) ->
    log.error err if err

    # Extend the original `data` with any additional data that was retrieved successfully.
    $.extend data, result for result in results when result?

    do callback

# Creates an object containing data based on information derived from the specified tab and menu
# item data.
buildDerivedData = (tab, onClickData, getCallback) ->
  log.trace()

  info    = editable: onClickData.editable, link: no
  fakeTab =
    title: tab.title
    url:   if onClickData.linkUrl
        info.link = yes
        onClickData.linkUrl
      else if onClickData.srcUrl   then onClickData.srcUrl
      else if onClickData.frameUrl then onClickData.frameUrl
      else onClickData.pageUrl
  info.data = buildStandardData fakeTab, getCallback

  info

# Construct a data object based on information extracted from `tab`.  
# The tab information is then merged with additional information relating to the URL of the tab.  
# If a tag requires further action (e.g. call a URL shortening service) when parsing the templates
# contents later, the callback method returned by `getCallback` is called to handle this as we
# don't want to perform these expensive tasks unless it is actually required.
buildStandardData = (tab, getCallback) ->
  log.trace()

  # Create a clone of the original tab of the tab to run the compatibility scripts on.
  ctab = $.extend {}, tab
  # Check for any support extensions running on the current tab by simply checking the tabs URL.
  for own extension, handler of SUPPORT when isExtensionActive tab, extension
    log.debug "Making data compatible with #{extension}"

    handler? ctab
    break

  # Build the initial URL data.
  data = {}
  url  = $.url ctab.url

  # Create references to the base of all grouped options to improve lookup performance.
  anchor        = store.get 'anchor'
  bitly         = store.get 'bitly'
  googl         = store.get 'googl'
  menu          = store.get 'menu'
  notifications = store.get 'notifications'
  shortcuts     = store.get 'shortcuts'
  stats         = store.get 'stats'
  toolbar       = store.get 'toolbar'
  yourls        = store.get 'yourls'

  # Merge the initial data with the attributes of the [URL
  # parser](https://github.com/allmarkedup/jQuery-URL-Parser) and all of the custom Template
  # properties.  
  # All properties should be in lower case so that they can be looked up ignoring case by our
  # modified version of [mustache.js](https://github.com/janl/mustache.js).
  $.extend data, url.attr(),
    anchortarget:          anchor.target
    anchortitle:           anchor.title
    bitly:                 bitly.enabled
    bitlyaccount:          ->
      _.findWhere(SHORTENERS, name: 'bitly').oauth.hasAccessToken()
    browser:               browser.title
    browserversion:        browser.version
    capitalise:            ->
      do @capitalize
    capitalize:            ->
      (text, render) ->
        utils.capitalize render text
    # Deprecated since 1.0.0, use `menu` instead.
    contextmenu:           ->
      @menu
    cookiesenabled:        navigator.cookieEnabled
    count:                 stats.count
    customcount:           stats.customCount
    datetime:              ->
      (text, render) ->
        new Date().format(render(text) or undefined) ? ''
    decode:                ->
      (text, render) ->
        decodeURIComponent(render text) ? ''
    depth:                 screen.colorDepth
    # Deprecated since 1.0.0, use `anchortarget` instead.
    doanchortarget:        ->
      @anchortarget
    # Deprecated since 1.0.0, use `anchortitle` instead.
    doanchortitle:         ->
      @anchortitle
    encode:                ->
      (text, render) ->
        encodeURIComponent(render text) ? ''
    # Deprecated since 0.1.0.2, use `encode` instead.
    encoded:               ->
      encodeURIComponent @url
    escape:                ->
      (text, render) ->
        _.escape render text
    favicon:               ctab.favIconUrl
    fparam:                ->
      (text, render) ->
        url.fparam(render text) ? ''
    fparams:               nullIfEmpty url.fparam()
    fsegment:              ->
      (text, render) ->
        url.fsegment(parseInt render(text), 10) ? ''
    fsegments:             url.fsegment()
    googl:                 googl.enabled
    googlaccount:          ->
      _.findWhere(SHORTENERS, name: 'googl').oauth.hasAccessToken()
    # Deprecated since 1.0.0, use `googlaccount` instead.
    googloauth:            ->
      do @googlaccount
    java:                  navigator.javaEnabled()
    length:                ->
      (text, render) ->
        render(text).length
    linkmarkdown:          ->
      md @linkhtml
    lowercase:             ->
      (text, render) ->
        render(text).toLowerCase()
    menu:                  menu.enabled
    menuoptions:           menu.options
    menupaste:             menu.paste
    notifications:         notifications.enabled
    notificationduration:  notifications.duration * .001
    offline:               not navigator.onLine
    # Deprecated since 0.1.0.2, use `originalurl` instead.
    originalsource:        ->
      @originalurl
    originaltitle:         tab.title or url.attr 'source'
    originalurl:           tab.url
    os:                    operatingSystem
    param:                 ->
      (text, render) ->
        url.param(render text) ? ''
    params:                nullIfEmpty url.param()
    plugins:               _.chain(navigator.plugins).pluck('name').uniq().value()
    popular:               _.findWhere ext.templates, key: stats.popular
    screenheight:          screen.height
    screenwidth:           screen.width
    segment:               ->
      (text, render) ->
        url.segment(parseInt render(text), 10) ? ''
    segments:              url.segment()
    select:                ->
      getCallback 'select'
    selectall:             ->
      getCallback 'selectall'
    selectallhtml:         ->
      getCallback 'selectallhtml'
    selectallmarkdown:     ->
      getCallback 'selectallmarkdown'
    selecthtml:            ->
      getCallback 'selecthtml'
    selectionmarkdown:     ->
      md @selectionhtml
    selectmarkdown:        ->
      getCallback 'selectmarkdown'
    # Deprecated since 1.0.0, use `shorten` instead.
    short:                 ->
      do @shorten
    shortcuts:             shortcuts.enabled
    shortcutspaste:        shortcuts.paste
    shorten:               ->
      getCallback 'shorten'
    tidy:                  ->
      (text, render) ->
        render(text).replace(/([ \t]+)/g, ' ').trim()
    title:                 ctab.title or url.attr 'source'
    toolbarclose:          toolbar.close
    # Deprecated since 1.0.0, use the inverse of `toolbarpopup` instead.
    toolbarfeature:        ->
      not @toolbarpopup
    # Deprecated since 1.0.0, use `toolbarstyle` instead.
    toolbarfeaturedetails: ->
      @toolbarstyle
    # Deprecated since 1.0.0, use `toolbarkey` instead.
    toolbarfeaturename:    ->
      @toolbarkey
    toolbarkey:            toolbar.key
    toolbaroptions:        toolbar.options
    toolbarpopup:          toolbar.popup
    # Obsolete since 1.1.0, functionality has been removed.
    toolbarstyle:          no
    trim:                  ->
      (text, render) ->
        render(text).trim()
    trimleft:              ->
      (text, render) ->
        render(text).trimLeft()
    trimright:             ->
      (text, render) ->
        render(text).trimRight()
    unescape:              ->
      (text, render) ->
        _.unescape render text
    uppercase:             ->
      (text, render) ->
        render(text).toUpperCase()
    url:                   url.attr 'source'
    version:               ext.version
    xpath:                ->
      getCallback 'xpath'
    xpathall:             ->
      getCallback 'xpathall'
    xpathallhtml:         ->
      getCallback 'xpathallhtml'
    xpathallmarkdown:     ->
      getCallback 'xpathallmarkdown'
    xpathhtml:            ->
      getCallback 'xpathhtml'
    xpathmarkdown:        ->
      getCallback 'xpathmarkdown'
    yourls:                yourls.enabled
    yourlsauthentication:  yourls.authentication
    yourlspassword:        yourls.password
    yourlssignature:       yourls.signature
    yourlsurl:             yourls.url
    yourlsusername:        yourls.username

  data

# Derive the relevant information, including the template data, based on both `message` and `tab`.
deriveMessageInfo = (message, tab, getCallback) ->
  log.trace()

  info =
    data:     null
    editable: no
    link:     no
    shortcut: no

  $.extend info, switch message.type
    when 'menu'
      buildDerivedData tab, message.data, getCallback
    when 'popup', 'toolbar'
      data: buildStandardData tab, getCallback
    when 'shortcut'
      data:     buildStandardData tab, getCallback
      shortcut: yes
    else
      throw new AppError 'result_bad_type_description'

# Derive the relevant template based on the context of `message`.
deriveMessageTempate = (message) ->
  log.trace()

  template = switch message.type
    when 'menu'             then getTemplateWithMenuId message.data.menuItemId
    when 'popup', 'toolbar' then getTemplateWithKey message.data.key
    when 'shortcut'         then getTemplateWithShortcut message.data.key
    else throw new AppError 'result_bad_type_description'
  throw new AppError 'result_bad_template_description' unless template?

  template

# Evaluate the expressions in `map` within the content scripts in `tab` in order to obtain their
# corresponding values.  
# Expressions can be of mixed type (i.e. CSS selector, XPath expression) and contain different
# instructions depending on the tag that was used by the user.  
# `callback` will be called with the result once all of the expressions have been evaluated.
evaluateExpressions = (tab, map, callback) ->
  log.trace()

  # Since content scripts cannot be executed on *protected* pages attempting to send a message to
  # one would result in background errors being thrown, so we'll just have to make sure the
  # placeholder is removed.
  if isProtectedPage tab
    map[placeholder] = '' for own placeholder of map
    return do callback

  # Tell the content script in `tab` to evaluate all of the expressions in `map` and update it with
  # their corresponding values.
  chrome.tabs.sendMessage tab.id, expressions: map, (response) ->
    log.debug 'The following response was returned by the content script...', response

    for own placeholder, expression of response.expressions
      {convertTo, error, result} = expression

      break if error

      result or= ''
      result   = result.join '\n' if _.isArray result
      result   = md result if convertTo is 'markdown'

      map[placeholder] = result

    callback if error then new AppError 'result_bad_xpath_description'

# Ensure there is a lower case variant of all properties of `data`, optionally removing the
# original non-lower-case property.
transformData = (data, deleteOld) ->
  log.trace()

  for own prop, value of data when R_UPPER_CASE.test prop
    data[prop.toLowerCase()] = value
    delete data[prop] if deleteOld

# Configuration functions
# -----------------------

# Transform specific sections of the data loaded from `configuration.json` so that they're more
# usable and localized.
buildConfig = ->
  log.trace()

  do buildIcons

# Transform the configuration icons into usable `Icon` instances.
buildIcons = ->
  log.trace()

  for name, i in ext.config.icons.current
    ext.config.icons.current[i] = new Icon name

# HTML building functions
# -----------------------

# Build the HTML to populate the popup with to optimize popup loading times.
buildPopup = ->
  log.trace()

  # Generate the HTML for each enabled template.
  items = $()
  items = items.add buildTemplate template for template in ext.templates when template.enabled

  # Add a generic message to state the obvious... that the list is empty.
  unless items.length
    message = " #{i18n.get 'empty'}"
    items   = items.add $('<li/>', class: 'empty').append($ '<i/>', class: 'icon-').append message

  # Add a link to the options page if the user doesn't mind.
  if store.get 'toolbar.options'
    anchor = $ '<a/>',
      class:       'options'
      'data-type': 'options'
    anchor.append $ '<i/>', class: Icon.get('cog').style
    anchor.append " #{i18n.get 'options'}"

    items = items.add $ '<li/>', class: 'divider'
    items = items.add $('<li/>').append anchor

  ext.templatesHtml = $('<div/>').append(items).html()

# Create an `li` element to represent `template`.  
# The element should then be inserted in to the `ul` element in the popup page but is created here
# to optimize display times for the popup.
buildTemplate = (template) ->
  log.trace()

  log.debug "Creating popup list item for the #{template.title} template"

  anchor = $ '<a/>',
    'data-key':  template.key
    'data-type': 'popup'

  # Ensure keyboard shortcuts are displayed correctly, where appropriate.
  if template.shortcut and store.get 'shortcuts.enabled'
    anchor.append $ '<span/>',
      class: 'pull-right',
      html:  "#{ext.modifiers()}#{template.shortcut}"

  anchor.append $ '<i/>', class: Icon.get(template.image, yes).style
  anchor.append " #{template.title}"

  $('<li/>').append anchor

# Initialization functions
# ------------------------

# Handle the conversion/removal of older version of settings that may have been stored previously
# by `ext.init`.
init_update = ->
  log.trace()

  # Update the update progress indicator itself.
  if store.exists 'update_progress'
    store.modify 'updates', (updates) ->
      for own namespace, versions of store.remove 'update_progress'
        updates[namespace] = if versions?.length then versions.pop() else ''

  # Create an updater for the `settings` namespace.
  updater      = new store.Updater 'settings'
  updater.on 'update', (version) ->
    log.info "Updating general settings for #{version}"

  isNewInstall = updater.isNew

  # Define the processes for all required updates to the `settings` namespace.
  updater.update '0.1.0.0', ->
    store.rename 'settingNotification',      'notifications',        on
    store.rename 'settingNotificationTimer', 'notificationDuration', 3000
    store.rename 'settingShortcut',          'shortcuts',            on
    store.rename 'settingTargetAttr',        'doAnchorTarget',       off
    store.rename 'settingTitleAttr',         'doAnchorTitle',        off
    store.remove 'settingIeTabExtract',      'settingIeTabTitle'

  updater.update '1.0.0', ->
    if store.exists 'options_active_tab'
      optionsActiveTab = store.get 'options_active_tab'
      store.set 'options_active_tab', switch optionsActiveTab
        when 'features_nav' then 'templates_nav'
        when 'toolbar_nav' then 'general_nav'
        else optionsActiveTab

    store.modify 'anchor', (anchor) ->
      anchor.target = store.get('doAnchorTarget') ? off
      anchor.title  = store.get('doAnchorTitle')  ? off
    store.remove 'doAnchorTarget', 'doAnchorTitle'

    store.modify 'menu', (menu) ->
      menu.enabled = store.get('contextMenu') ? yes
    store.remove 'contextMenu'

    store.set 'notifications',
      duration: store.get('notificationDuration') ? 3000
      enabled:  store.get('notifications')        ? yes
    store.remove 'notificationDuration'

  updater.update '1.1.0', ->
    store.set 'shortcuts', enabled: store.get('shortcuts') ? yes

  updater.update '1.2.3', ->
    store.modify 'anchor', (anchor) ->
      delete anchor.Target
      delete anchor.Title

    store.modify 'logger', (logger) ->
      delete logger.Enabled
      delete logger.Level

    store.modify 'menu', (menu) ->
      delete menu.Enabled
      delete menu.Options
      delete menu.Paste

    store.modify 'notifications', (notifications) ->
      delete notifications.Duration
      delete notifications.Enabled

    store.modify 'shortcuts', (shortcuts) ->
      delete shortcuts.Enabled
      delete shortcuts.Paste

    store.modify 'toolbar', (toolbar) ->
      delete toolbar.Close
      delete toolbar.Key
      delete toolbar.Options

# Initialize the settings related to statistical information.
initStatistics = ->
  log.trace()

  do updateStatistics

# Initialize `template` and its properties, before adding it to `templates` to be persisted later.
initTemplate = (template, templates) ->
  log.trace()

  # Derive the index of `template` to determine whether or not it already exists.
  idx = templates.indexOf _.findWhere templates, key: template.key

  if idx is -1
    # `template` doesn't already exist so add it now.
    log.debug 'Adding the following predefined template...', template

    templates.push template
  else
    # `template` exists so modify the properties to ensure they are reliable.
    log.debug 'Ensuring following template adheres to structure...', template

    if template.readOnly
      # `template` is read-only so certain properties should always be overriden and others only
      # when they are not already available.
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
      # `template` is *not* read-only so set unavailable, but required, properties to their default
      # value.
      templates[idx].content  ?= ''
      templates[idx].enabled  ?= yes
      templates[idx].image    ?= ''
      templates[idx].index    ?= 0
      templates[idx].key      ?= template.key
      templates[idx].readOnly  = no
      templates[idx].shortcut ?= ''
      templates[idx].title    ?= '?'
      templates[idx].usage    ?= 0

    template = templates[idx]

  template

# Initialize the persisted managed templates.
initTemplates = ->
  log.trace()

  do initTemplates_update

  store.modify 'templates', (templates) ->
    # Initialize all default templates to ensure their properties are as expected.
    initTemplate template, templates for template in DEFAULT_TEMPLATES
    # Now, initialize *all* templates to ensure their properties are valid.
    initTemplate template, templates for template in templates

  ext.updateTemplates()

# Handle the conversion/removal of older version of settings that may have been stored previously
# by `initTemplates`.
initTemplates_update = ->
  log.trace()

  # Create updater for the `features` namespace and then rename it to `templates`.
  updater = new store.Updater 'features'
  updater.on 'update', (version) ->
    log.info "Updating template settings for #{version}"
  updater.rename 'templates'

  # Define the processes for all required updates to the `templates` namespace.
  updater.update '0.1.0.0', ->
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
    names = store.get('features') ? []

    for name in names when _.isString name
      store.rename "feat_#{name}_template", "feat_#{name}_content"

      image = store.get "feat_#{name}_image"

      if _.isString image
        if image in ['', 'spacer.gif', 'spacer.png']
          store.set "feat_#{name}_image", 0
        else
          for legacy, i in ext.config.icons.legacy
            if "#{legacy.name.replace /^tmpl/, 'feat'}.png" is image
              store.set "feat_#{name}_image", i + 1
              break
      else
        store.set "feat_#{name}_image", 0

  updater.update '1.0.0', ->
    names              = store.remove('features') ? []
    templates          = []

    toolbarFeatureName = store.get 'toolbarFeatureName'

    for name in names when _.isString name
      image = store.remove("feat_#{name}_image") ? 0
      image = if --image >= 0 then Icon.fromLegacy(image)?.name or '' else ''

      key = ext.getKeyForName name

      if toolbarFeatureName is name
        if store.exists 'toolbar'
          store.modify 'toolbar', (toolbar) ->
            toolbar.key = key
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
        title:    store.remove("feat_#{name}_title")    ? '?'
        usage:    0

    store.set 'templates', templates
    store.remove store.search(/^feat_.*_(content|enabled|image|index|readonly|shortcut|title)$/)...

  updater.update '1.1.0', ->
    store.modify 'templates', (templates) ->
      for template in templates
        if template.readOnly
          break for base in DEFAULT_TEMPLATES when base.key is template.key

          template.image = switch template.key
            when 'PREDEFINED.00001'
              if template.image is 'tmpl_globe' then base.image
              else Icon.fromLegacy(template.image)?.name or ''
            when 'PREDEFINED.00002'
              if template.image is 'tmpl_link' then base.image
              else Icon.fromLegacy(template.image)?.name or ''
            when 'PREDEFINED.00003'
              if template.image is 'tmpl_html' then base.image
              else Icon.fromLegacy(template.image)?.name or ''
            when 'PREDEFINED.00004'
              if template.image is 'tmpl_component' then base.image
              else Icon.fromLegacy(template.image)?.name or ''
            when 'PREDEFINED.00005'
              if template.image is 'tmpl_discussion' then base.image
              else Icon.fromLegacy(template.image)?.name or ''
            when 'PREDEFINED.00006'
              if template.image is 'tmpl_discussion' then base.image
              else Icon.fromLegacy(template.image)?.name or ''
            when 'PREDEFINED.00007'
              if template.image is 'tmpl_note' then base.image
              else Icon.fromLegacy(template.image)?.name or ''
            else base.image
        else
          template.image = Icon.fromLegacy(template.image)?.name or ''

# Initialize the settings related to the toolbar/browser action.
initToolbar = ->
  log.trace()

  do initToolbar_update

  store.modify 'toolbar', (toolbar) ->
    toolbar.close   ?= yes
    toolbar.key     ?= 'PREDEFINED.00001'
    toolbar.options ?= yes
    toolbar.popup   ?= yes

  ext.updateToolbar()

# Handle the conversion/removal of older version of settings that may have been stored previously
# by `initToolbar`.
initToolbar_update = ->
  log.trace()

  # Create updater for the `toolbar` namespace.
  updater = new store.Updater 'toolbar'
  updater.on 'update', (version) ->
    log.info "Updating toolbar settings for #{version}"

  # Define the processes for all required updates to the `toolbar` namespace.
  updater.update '1.0.0', ->
    store.modify 'toolbar', (toolbar) ->
      toolbar.popup = store.get('toolbarPopup') ? yes
      toolbar.style = store.get('toolbarFeatureDetails') ? no
    store.remove 'toolbarFeature', 'toolbarFeatureDetails', 'toolbarFeatureName', 'toolbarPopup'

  updater.update '1.1.0', ->
    store.modify 'toolbar', (toolbar) ->
      delete toolbar.style

# Initialize the settings related to the supported URL Shortener services.
initUrlShorteners = ->
  log.trace()

  store.init
    bitly:  {}
    googl:  {}
    yourls: {}

  do initUrlShorteners_update

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

# Handle the conversion/removal of older version of settings that may have been stored previously
# by `initUrlShorteners`.
initUrlShorteners_update = ->
  log.trace()

  # Create updater for the `shorteners` namespace.
  updater = new store.Updater 'shorteners'
  updater.on 'update', (version) ->
    log.info "Updating URL shortener settings for #{version}"

  # Define the processes for all required updates to the `shorteners` namespace.
  updater.update '0.1.0.0', ->
    store.rename 'bitlyEnabled',       'bitly',         yes
    store.rename 'bitlyXApiKey',       'bitlyApiKey',   ''
    store.rename 'bitlyXLogin',        'bitlyUsername', ''
    store.rename 'googleEnabled',      'googl',         no
    store.rename 'googleOAuthEnabled', 'googlOAuth',    yes

  updater.update '1.0.0', ->
    bitly = store.get 'bitly'
    store.set 'bitly',
      apiKey:    store.get('bitlyApiKey')   ? ''
      enabled:   if _.isBoolean bitly then bitly else yes
      username:  store.get('bitlyUsername') ? ''
    store.remove 'bitlyApiKey', 'bitlyUsername'

    googl = store.get 'googl'
    store.set 'googl',
      enabled: if _.isBoolean googl then googl else no
    store.remove 'googlOAuth'

    yourls = store.get 'yourls'
    store.set 'yourls',
      enabled:   if _.isBoolean yourls then yourls else no
      password:  store.get('yourlsPassword')  ? ''
      signature: store.get('yourlsSignature') ? ''
      url:       store.get('yourlsUrl')       ? ''
      username:  store.get('yourlsUsername')  ? ''
    store.remove 'yourlsPassword', 'yourlsSignature', 'yourlsUrl', 'yourlsUsername'

  updater.update '1.0.1', ->
    store.modify 'bitly', (bitly) ->
      delete bitly.apiKey
      delete bitly.username

    store.modify 'yourls', (yourls) ->
      yourls.authentication = if yourls.signature then 'advanced'
      else if yourls.password and yourls.username then 'basic'
      else ''

    store.remove store.search(/^oauth_token.*/)...

  updater.update '1.2.3', ->
    store.modify 'yourls', (yourls) ->
      delete yourls.Password
      delete yourls.Signature
      delete yourls.Url
      delete yourls.Username

# URL shortener functions
# -----------------------

# Call the active URL shortener service for each URL in `map` in order to obtain their
# corresponding short URLs.  
# `callback` will be called with the result once all URLs have been shortened or an error is
# encountered.
callUrlShortener = (map, callback) ->
  log.trace()

  service  = do getActiveUrlShortener
  endpoint = service.url()
  oauth    = no
  title    = service.title

  # Ensure the service URL exists in case it is user-defined (e.g. YOURLS).
  return callback new AppError 'shortener_config_error', title unless endpoint

  tasks = []
  _.each map, (url, placeholder) ->
    oauth = !!service.oauth?.hasAccessToken()

    tasks.push (done) ->
      async.series [
        (done) ->
          # Ensure the OAuth adapter has been authorized.
          if oauth
            service.oauth.authorize ->
              do done
          else
            do done

        (done) ->
          params    = service.getParameters url
          endpoint += "?#{$.param params}" if params?

          # Build the HTTP asynchronous request for the URL shortener service.
          xhr = new XMLHttpRequest()
          xhr.open service.method, endpoint, yes

          # Allow service to populate request headers.
          for own header, value of service.getHeaders() ? {}
            xhr.setRequestHeader header, value

          xhr.onreadystatechange = ->
            # Wait for the response and let the service handle it before passing the result back.
            if xhr.readyState is 4
              if xhr.status is 200
                map[placeholder] = service.output xhr.responseText
                do done
              else
                # Something went wrong so let's tell the user.
                done new AppError 'shortener_detailed_error', title, url

          # Finally, send the HTTP request.
          xhr.send service.input url

      ], done
  async.series tasks, (err) ->
    if err
      err.message or= i18n.get 'shortener_error', service.title
      callback err
    else
      callback null, {oauth, service}

# Retrieve the active URL shortener service.
getActiveUrlShortener = ->
  log.trace()

  # Attempt to lookup enabled URL shortener service.
  shortener = _.find SHORTENERS, (shortener) ->
    shortener.isEnabled()

  unless shortener?
    # Should never reach here but we'll return bit.ly service by default after ensuring it's the
    # active URL shortener service from now on to save some time in the future.
    store.modify 'bitly', (bitly) ->
      bitly.enabled = yes
    shortener = do getActiveUrlShortener

  log.debug "Getting details for #{shortener.title} URL shortener"

  shortener

# Background page setup
# ---------------------

ext = window.ext = new class Extension extends utils.Class

  # Public constants
  # ----------------

  # String representation of the keyboard modifiers listened to by Template on Windows/Linux
  # platforms.
  SHORTCUT_MODIFIERS: 'Ctrl+Alt+'

  # String representation of the keyboard modifiers listened to by Template on Mac platforms.
  SHORTCUT_MAC_MODIFIERS: '&#8679;&#8997;'

  # Public variables
  # ----------------

  # Configuration data loaded at runtime.
  config: {}

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

  # Reference to supported URL shortener services.
  shorteners: SHORTENERS

  # Local copy of templates being used, ordered to match that specified by the user.
  templates: []

  # Pre-prepared HTML for the popup to be populated using.  
  # This should be updated whenever templates are changed/updated in any way as this is generated
  # to improve performance and load times of the popup frame.
  templatesHtml: ''

  # Current version of Template.
  version: ''

  # Public functions
  # ----------------

  # Add `str` to the system clipboard.  
  # All successful copy requests should, at some point, call this function.  
  # If `str` is empty the contents of the system clipboard will not change.
  copy: (str, hidden) ->
    log.trace()

    sandbox = $('#sandbox').val(str).trigger 'select'
    document.execCommand 'copy'
    log.debug 'Copied the following string...', str
    sandbox.val ''

    do showNotification unless hidden

  # Attempt to retrieve the key of the template with the specified `name`.  
  # Since only the names of predefined templates are known, return a newly generated key if it does
  # not match any of their names.
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
  # This will involve initializing the settings and adding the message listeners.
  init: ->
    log.trace()

    log.info 'Initializing extension controller'

    # Add support for analytics if the user hasn't opted out.
    analytics.add() if store.get 'analytics'

    # Load the configuration data from the file.
    $.getJSON utils.url('configuration.json'), (data) =>
      # Store the configuration data and then ensure it's data is in the most usable format.
      @config = data
      do buildConfig
      # It's nice knowing what version is running.
      {@version} = chrome.runtime.getManifest()

      # Initiate OAuth for each of the applicable URL shortener services.
      shortener.oauth = shortener.oauth?() for shortener in SHORTENERS

      # Begin initialization.
      store.init
        anchor:        {}
        menu:          {}
        notifications: {}
        shortcuts:     {}
        stats:         {}
        templates:     []
        toolbar:       {}

      do init_update

      store.modify 'anchor', (anchor) ->
        anchor.target ?= off
        anchor.title  ?= off

      store.modify 'menu', (menu) ->
        menu.enabled ?= yes
        menu.options ?= yes
        menu.paste   ?= no

      store.modify 'notifications', (notifications) ->
        notifications.duration ?= 3000
        notifications.enabled  ?= yes

      store.modify 'shortcuts', (shortcuts) ->
        shortcuts.enabled ?= yes
        shortcuts.paste   ?= no

      do initTemplates
      do initToolbar
      do initStatistics
      do initUrlShorteners

      # Add listener for toolbar/browser action clicks.  
      # This listener will be ignored whenever the popup is enabled.
      chrome.browserAction.onClicked.addListener (tab) ->
        onMessage
          data: key: store.get 'toolbar.key'
          type: 'toolbar'
      # Add listeners for internal and external messages.
      chrome.extension.onMessage.addListener onMessage
      chrome.extension.onMessageExternal.addListener onMessageExternal

      # Derive the browser and OS information.
      browser.version = do getBrowserVersion
      operatingSystem = do getOperatingSystem
      analytics.track 'Installs', 'New', @version, Number isProductionBuild if isNewInstall

      # Execute content scripts now that we know the version.
      do executeScriptsInExistingWindows

  # Determine whether or not `os` matches the user's operating system.
  isThisPlatform: (os) ->
    log.trace()

    /// #{os} ///i.test navigator.platform

  # Retrieve the correct string representation of the keyboard modifiers for the user's operating
  # system.
  modifiers: ->
    log.trace()

    if @isThisPlatform 'mac' then @SHORTCUT_MAC_MODIFIERS else @SHORTCUT_MODIFIERS

  # Attempt to retrieve the contents of the system clipboard as a string.
  paste: ->
    log.trace()

    result  = ''
    sandbox = $('#sandbox').val('').trigger 'select'
    result  = sandbox.val() if document.execCommand 'paste'
    log.debug 'Pasted the following string...', result
    sandbox.val ''

    result

  # Reset the notification information associated with the current copy request.  
  # This should be called when a copy request is completed regardless of its outcome.
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
  # If the context menu option has been disabled by the user, just remove all of the existing menu
  # items.
  updateContextMenu: ->
    log.trace()

    # Ensure that any previously added context menu items are removed.
    chrome.contextMenus.removeAll =>
      # Called whenever a template menu item is clicked.  
      # Message self, passing along the available information.
      onMenuClick = (info, tab) ->
        onMessage data: info, type: 'menu'

      menu = store.get 'menu'

      # Stop now if the context menu is disabled.
      return unless menu.enabled

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

      # Indicate that no templates have been enabled.
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
          onclick:  (info, tab) ->
            onMessage type: 'options'
          parentId: parentId
          title:    i18n.get 'options'

  # Update the local list of templates to reflect those persisted.  
  # It is very important that this is called whenever templates may have been changed in order to
  # prepare the popup HTML and optimize performance.
  updateTemplates: ->
    log.trace()

    @templates = _.sortBy store.get('templates'), 'index'

    do buildPopup
    do @updateContextMenu
    do updateStatistics
    do updateHotkeys

  # Update the toolbar/browser action depending on the current settings.
  updateToolbar: ->
    log.trace()

    key      = store.get 'toolbar.key'
    template = getTemplateWithKey key if key

    do buildPopup

    if not template or store.get 'toolbar.popup'
      log.info 'Configuring toolbar to display popup'
      # Show the popup when the browser action is clicked.
      chrome.browserAction.setPopup popup: 'pages/popup.html'
    else
      log.info 'Configuring toolbar to activate specified template'
      # Disable the popup, effectively enabling the listener for `chrome.browserAction.onClicked`.
      chrome.browserAction.setPopup popup: ''

# Public classes
# --------------

# `Icon` provides common functionality for using icons throughout the extension.
ext.Icon = class Icon extends utils.Class

  # Create a new instance of `Icon` with the specified `name`.  
  # An appropriate localized message and CSS style is also derived.
  constructor: (@name) ->
    @message = i18n.get "icon_#{name?.replace(/-/g, '_') or 'none'}"
    @style   = "icon-#{name or ''}"

# Determine whether an `Icon` with the given `name` exists.
Icon.exists = (name) ->
  Icon.get(name)?

# Retrieve the `Icon` with the given `name`.  
# `safe` can be used to ensure that an `Icon` is always returned, although this will be *empty* (no
# name) if none had a matching `name`.
Icon.get = (name, safe) ->
  icon = _.findWhere ext.config.icons.current, {name}

  if not icon? and safe then new Icon() else icon

# Attempt to retrieve the replacement for the legacy icon with the given `name`.  
# If `name` is a number it will be treated as an index of the legacy icon; otherwise a simple
# lookup is performed.
Icon.fromLegacy = (name) ->
  legacy = switch typeof name
    when 'number' then ext.config.icons.legacy[name]
    when 'string' then _.findWhere ext.config.icons.legacy, {name}

  if legacy then Icon.get legacy.icon

# Initialize `ext` when the DOM is ready.
utils.ready -> ext.init()