# [Template](http://neocotic.com/template)  
# (c) 2013 Alasdair Mercer  
# Freely distributable under the MIT license.  
# For all details and documentation:  
# <http://neocotic.com/template>

# Private variables
# -----------------

# Easily accessible reference to the extension controller.
{ext} = chrome.extension.getBackgroundPage()

# Private functions
# -----------------

# Update the shorteners tab with the values from the current settings.
load = ->
  log.trace()
  $('input[name="enabled_shortener"]').each ->
    $this = $ this
    $this.attr 'checked', 'checked' if store.get "#{$this.attr 'id'}.enabled"
    yes
  yourls = store.get 'yourls'
  $('#yourlsAuthentication' + (switch yourls.authentication
    when 'advanced' then 'Advanced'
    when 'basic' then 'Basic'
    else 'None'
  )).addClass 'active'
  $('#yourlsPassword').val yourls.password
  $('#yourlsSignature').val yourls.signature
  $('#yourlsUrl').val yourls.url
  $('#yourlsUsername').val yourls.username
  loadAccounts()
  loadControlEvents()
  loadSaveEvents()

# Update the accounts in the URL shorteners tab with current state of their
# OAuth objects.
loadAccounts = ->
  log.trace()
  # Retrieve all URL shortener services that use OAuth and iterate over the
  # results.
  for shortener in ext.queryUrlShorteners((shortener) -> shortener.oauth?)
    do (shortener) ->
      # Bind the event handler required for logging in and out of accounts and
      # then reflect the current login state in the button.
      button = $ "##{shortener.name}Account"
      button.click ->
        $this = $(this).blur()
        if $this.data('oauth') isnt 'true'
          $this.tooltip 'hide'
          log.debug "Attempting to authorize #{shortener.name}"
          shortener.oauth.authorize ->
            log.debug "Authorization response for #{shortener.name}...",
              arguments
            if success = shortener.oauth.hasAccessToken()
              $this.addClass('btn-danger').removeClass 'btn-success'
              $this.data 'oauth', 'true'
              $this.html i18n.get 'opt_url_shortener_logout_button'
            analytics.track 'Shorteners', 'Login', shortener.title,
              Number success
        else
          log.debug "Removing authorization for #{shortener.name}"
          shortener.oauth.clearAccessToken()
          if $this.attr('id') is 'bitlyAccount'
            shortener.oauth.clear 'apiKey'
            shortener.oauth.clear 'login'
          $this.addClass('btn-success').removeClass 'btn-danger'
          $this.data 'oauth', 'false'
          $this.html i18n.get 'opt_url_shortener_login_button'
          analytics.track 'Shorteners', 'Logout', shortener.title
      if shortener.oauth.hasAccessToken()
        button.addClass('btn-danger').removeClass 'btn-success'
        button.data 'oauth', 'true'
        button.html i18n.get 'opt_url_shortener_logout_button'
      else
        button.addClass('btn-success').removeClass 'btn-danger'
        button.data 'oauth', 'false'
        button.html i18n.get 'opt_url_shortener_login_button'

# Bind the event handlers required for controlling URL shortener configuration
# changes.
loadControlEvents = ->
  log.trace()
  # Bind a click event to listen for changes to the button selection.
  $('#yourlsAuthentication button').click( ->
    $(".#{$(this).attr 'id'}").show().siblings().hide()
  ).filter('.active').click()

# Bind the event handlers required for persisting URL shortener configuration
# changes.
loadSaveEvents = ->
  log.trace()
  $('input[name="enabled_shortener"]').change ->
    store.modify 'bitly', 'googl', 'yourls', (data, key) ->
      if data.enabled = $("##{key}").is ':checked'
        shortener = ext.queryUrlShortener (shortener) -> shortener.name is key
        log.debug "Enabling #{shortener.title} URL shortener"
        analytics.track 'Shorteners', 'Enabled', shortener.title
  $('#yourlsAuthentication button').click ->
    $this = $ this
    auth = $this.attr('id').match(/yourlsAuthentication(.*)/)[1]
    store.modify 'yourls', (yourls) ->
      yourls.authentication = if auth is 'None' then '' else auth.toLowerCase()
    log.debug "YOURLS authentication changed: #{auth}"
    analytics.track 'Shorteners', 'Changed', 'YOURLS Authentication',
      $this.index()
  options.bindSaveEvent """
    #yourlsPassword, #yourlsSignature, #yourlsUrl, #yourlsUsername
  """, 'input', 'yourls', -> @val().trim()

# URL Shorteners tab setup
# ------------------------

options.tab 'shorteners', ->
  log.trace()
  log.info 'Initializing the shorteners tab'
  $.extend options.i18nMap,
    bitlyAccount: opt_url_shortener_account_title: i18n.get 'shortener_bitly'
    googlAccount: opt_url_shortener_account_title: i18n.get 'shortener_googl'
  load()