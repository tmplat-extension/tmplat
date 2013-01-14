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

# Update the general tab with the values from the current settings.
load = ->
  log.trace()
  anchor        = store.get 'anchor'
  menu          = store.get 'menu'
  notifications = store.get 'notifications'
  shortcuts     = store.get 'shortcuts'
  toolbar       = store.get 'toolbar'
  $('#analytics').attr        'checked', 'checked' if store.get 'analytics'
  $('#anchorTarget').attr     'checked', 'checked' if anchor.target
  $('#anchorTitle').attr      'checked', 'checked' if anchor.title
  $('#menuEnabled').attr      'checked', 'checked' if menu.enabled
  $('#menuOptions').attr      'checked', 'checked' if menu.options
  $('#menuPaste').attr        'checked', 'checked' if menu.paste
  $('#shortcutsEnabled').attr 'checked', 'checked' if shortcuts.enabled
  $('#shortcutsPaste').attr   'checked', 'checked' if shortcuts.paste
  $('#notifications').attr 'checked', 'checked' if notifications.enabled
  $('#notificationDuration').val if notifications.duration > 0
    notifications.duration * .001
  else
    0
  if toolbar.popup
    $('#toolbarPopupYes').addClass 'active'
  else
    $('#toolbarPopupNo').addClass 'active'
  $('#toolbarClose').attr   'checked', 'checked' if toolbar.close
  $('#toolbarOptions').attr 'checked', 'checked' if toolbar.options
  loadControlEvents()
  loadSaveEvents()
  updateTemplates()

# Bind the event handlers required for controlling general changes.
loadControlEvents = ->
  log.trace()
  $('#menuEnabled').change( ->
    groups = $('#menuOptions').parents('.control-group').first()
    groups = groups.add $('#menuPaste').parents('.control-group').first()
    if $(this).is ':checked' then groups.slideDown() else groups.slideUp()
  ).change()
  $('#shortcutsEnabled').change( ->
    groups = $('#shortcutsPaste').parents('.control-group').first()
    if $(this).is ':checked' then groups.slideDown() else groups.slideUp()
  ).change()
  # Bind a click event to listen for changes to the button selection.
  $('#toolbarPopup .btn').click( ->
    $(".#{$(this).attr 'id'}").show().siblings().hide()
  ).filter('.active').click()

# Bind the event handlers required for persisting general changes.
loadSaveEvents = ->
  log.trace()
  $('#analytics').change ->
    enabled = $(this).is ':checked'
    log.debug "Changing analytics to '#{enabled}'"
    if enabled
      store.set 'analytics', yes
      chrome.extension.getBackgroundPage().analytics.add()
      analytics.add()
      analytics.track 'General', 'Changed', 'Analytics', 1
    else
      analytics.track 'General', 'Changed', 'Analytics', 0
      analytics.remove()
      chrome.extension.getBackgroundPage().analytics.remove()
      store.set 'analytics', no
  options.bindSaveEvent '#anchorTarget, #anchorTitle', 'change', 'anchor',
    (key) ->
      value = @is ':checked'
      log.debug "Changing anchor #{key} to '#{value}'"
      value
  , (jel, key, value) ->
    key = key[0].toUpperCase() + key.substr 1
    analytics.track 'Anchors', 'Changed', key, Number value
  options.bindSaveEvent '#menuEnabled, #menuOptions, #menuPaste', 'change',
    'menu', (key) ->
      value = @is ':checked'
      log.debug "Changing context menu #{key} to '#{value}'"
      value
  , (jel, key, value) ->
    ext.updateContextMenu()
    key = key[0].toUpperCase() + key.substr 1
    analytics.track 'Context Menu', 'Changed', key, Number value
  options.bindSaveEvent '#shortcutsEnabled, #shortcutsPaste', 'change',
    'shortcuts', (key) ->
      value = @is ':checked'
      log.debug "Changing keyboard shortcuts #{key} to '#{value}'"
      value
  , (jel, key, value) ->
    key = key[0].toUpperCase() + key.substr 1
    analytics.track 'Keyboard Shortcuts', 'Changed', key, Number value
  $('#notificationDuration').on 'input', ->
    store.modify 'notifications', (notifications) =>
      ms = $(this).val()
      ms = if ms? then parseInt(ms, 10) * 1000 else 0
      log.debug "Changing notification duration to #{ms} milliseconds"
      notifications.duration = ms
      analytics.track 'Notifications', 'Changed', 'Duration', ms
  $('#notifications').change ->
    store.modify 'notifications', (notifications) =>
      enabled = $(this).is ':checked'
      log.debug "Changing notifications to '#{enabled}'"
      notifications.enabled = enabled
      analytics.track 'Notifications', 'Changed', 'Enabled', Number enabled
  $('#toolbarPopup .btn').click ->
    popup = not $('#toolbarPopupYes').hasClass 'active'
    store.modify 'toolbar', (toolbar) -> toolbar.popup = popup
    ext.updateToolbar()
    log.debug "Toolbar popup enabled: #{popup}"
    analytics.track 'Toolbars', 'Changed', 'Behaviour', Number popup
  options.bindSaveEvent '#toolbarClose, #toolbarKey, #toolbarOptions',
    'change', 'toolbar', (key) ->
      value = if key is 'key' then @val() else @is ':checked'
      log.debug "Changing toolbar #{key} to '#{value}'"
      value
  , (jel, key, value) ->
    ext.updateToolbar()
    key = key[0].toUpperCase() + key.substr 1
    if key is 'Key'
      analytics.track 'Toolbars', 'Changed', key
    else
      analytics.track 'Toolbars', 'Changed', key, Number value

# Update the selection of templates in the toolbar behaviour section to reflect
# those on the templates tab.
updateTemplates = ->
  log.trace()
  toolbarKey              = store.get 'toolbar.key'
  toolbarTemplates        = $ '#toolbarKey'
  lastSelectedTemplate    = toolbarTemplates.find 'option:selected'
  lastSelectedTemplateKey = ''
  if lastSelectedTemplate.length
    lastSelectedTemplateKey = lastSelectedTemplate.val()
  toolbarTemplates.find('option').remove()
  for template in ext.templates
    opt = $ '<option/>',
      text:  template.title
      value: template.key
    opt.prop 'selected', template.key in [lastSelectedTemplateKey, toolbarKey]
    toolbarTemplates.append opt

# General tab setup
# -----------------

options.tab 'general', ->
  log.trace()
  log.info 'Initializing the general tab'
  $.extend options.i18nMap,
    version_definition: opt_guide_standard_version_text: ext.version
  load()
  @updateTemplates = updateTemplates