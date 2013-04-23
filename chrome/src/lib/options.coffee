# [Template](http://neocotic.com/template)  
# (c) 2013 Alasdair Mercer  
# Freely distributable under the MIT license.  
# For all details and documentation:  
# <http://neocotic.com/template>

# Private constants
# -----------------

# Regular expression used to sanitize search queries.
R_CLEAN_QUERY    = /[^\w\s]/g
# Regular expression used to validate template keys.
R_VALID_KEY      = /^[A-Z0-9]*\.[A-Z0-9]*$/i
# Regular expression used to validate keyboard shortcut inputs.
R_VALID_SHORTCUT = /[A-Z0-9]/i
# Regular expression used to identify whitespace.
R_WHITESPACE     = /\s+/

# Private variables
# -----------------

# Copy of template being actively modified.
activeTemplate = null
# Easily accessible reference to the extension controller.
{ext}          = chrome.extension.getBackgroundPage()
# Indicate whether or not the user feedback feature has been added to the page.
feedbackAdded  = no
# Templates matching the current search query.
searchResults  = null

# Load functions
# --------------

# Bind an event of the specified `type` to the elements included by
# `selector` that, when triggered, modifies the underlying `option` with the
# value returned by `evaluate`.
bindSaveEvent = (selector, type, option, evaluate, callback) ->
  log.trace()
  $(selector).on type, ->
    $this = $ this
    key   = ''
    value = null
    store.modify option, (data) ->
      key = $this.attr('id').match(new RegExp("^#{option}(\\S*)"))[1]
      key = key[0].toLowerCase() + key.substr 1
      data[key] = value = evaluate.call $this, key
    callback? $this, key, value

# Update the options page with the values from the current settings.
load = ->
  log.trace()
  anchor    = store.get 'anchor'
  menu      = store.get 'menu'
  shortcuts = store.get 'shortcuts'
  $('#analytics').attr        'checked', 'checked' if store.get 'analytics'
  $('#anchorTarget').attr     'checked', 'checked' if anchor.target
  $('#anchorTitle').attr      'checked', 'checked' if anchor.title
  $('#menuEnabled').attr      'checked', 'checked' if menu.enabled
  $('#menuOptions').attr      'checked', 'checked' if menu.options
  $('#menuPaste').attr        'checked', 'checked' if menu.paste
  $('#shortcutsEnabled').attr 'checked', 'checked' if shortcuts.enabled
  $('#shortcutsPaste').attr   'checked', 'checked' if shortcuts.paste
  loadControlEvents()
  loadSaveEvents()
  loadImages()
  loadTemplates()
  loadNotifications()
  loadToolbar()
  loadUrlShorteners()
  loadDeveloperTools()

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

# Update the developer tools section of the options page with the current
# settings.
loadDeveloperTools = ->
  log.trace()
  loadLogger()

# Create an `option` element for each available template image.  
# Each element is inserted in to the `select` element containing template
# images on the options page.
loadImages = ->
  log.trace()
  imagePreview = $ '#template_image_preview'
  images       = $ '#template_image'
  images.append $ '<option/>',
    text:  icons.getMessage()
    value: ''
  images.append $ '<option/>',
    disabled: 'disabled'
    text:     '---------------'
  for image in icons.ICONS
    images.append $ '<option/>',
      text:  image.getMessage()
      value: image.name
  images.change ->
    opt = images.find 'option:selected'
    imagePreview.attr 'class', icons.getClass opt.val()
  images.change()

# Update the logging section of the options page with the current settings.
loadLogger = ->
  log.trace()
  logger = store.get 'logger'
  $('#loggerEnabled').attr 'checked', 'checked' if logger.enabled
  loggerLevel = $ '#loggerLevel'
  loggerLevel.find('option').remove()
  for level in log.LEVELS
    option = $ '<option/>',
      text:  i18n.get "opt_logger_level_#{level.name}_text"
      value: level.value
    option.attr 'selected', 'selected' if level.value is logger.level
    loggerLevel.append option
  # Ensure debug level is selected if configuration currently matches none.
  unless loggerLevel.find('option[selected]').length
    loggerLevel.find("option[value='#{log.DEBUG}']").attr 'selected',
      'selected'
  loadLoggerSaveEvents()

# Bind the event handlers required for persisting logging changes.
loadLoggerSaveEvents = ->
  log.trace()
  bindSaveEvent '#loggerEnabled, #loggerLevel', 'change', 'logger', (key) ->
    value = if key is 'level' then @val() else @is ':checked'
    log.debug "Changing logging #{key} to '#{value}'"
    value
  , (jel, key, value) ->
    logger = store.get 'logger'
    chrome.extension.getBackgroundPage().log.config = log.config = logger
    analytics.track 'Logging', 'Changed', key[0].toUpperCase() + key.substr(1),
      Number value

# Update the notification section of the options page with the current
# settings.
loadNotifications = ->
  log.trace()
  notifications = store.get 'notifications'
  $('#notifications').attr 'checked', 'checked' if notifications.enabled
  $('#notificationDuration').val if notifications.duration > 0
    notifications.duration * .001
  else
    0
  loadNotificationSaveEvents()

# Bind the event handlers required for persisting notification changes.
loadNotificationSaveEvents = ->
  log.trace()
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
  bindSaveEvent '#anchorTarget, #anchorTitle', 'change', 'anchor', (key) ->
    value = @is ':checked'
    log.debug "Changing anchor #{key} to '#{value}'"
    value
  , (jel, key, value) ->
    key = key[0].toUpperCase() + key.substr 1
    analytics.track 'Anchors', 'Changed', key, Number value
  bindSaveEvent '#menuEnabled, #menuOptions, #menuPaste', 'change', 'menu',
    (key) ->
      value = @is ':checked'
      log.debug "Changing context menu #{key} to '#{value}'"
      value
  , (jel, key, value) ->
    ext.updateContextMenu()
    key = key[0].toUpperCase() + key.substr 1
    analytics.track 'Context Menu', 'Changed', key, Number value
  bindSaveEvent '#shortcutsEnabled, #shortcutsPaste', 'change', 'shortcuts',
    (key) ->
      value = @is ':checked'
      log.debug "Changing keyboard shortcuts #{key} to '#{value}'"
      value
  , (jel, key, value) ->
    key = key[0].toUpperCase() + key.substr 1
    analytics.track 'Keyboard Shortcuts', 'Changed', key, Number value

# Update the templates section of the options page with the current settings.
loadTemplates = ->
  log.trace()
  # Load all of the event handlers required for managing the templates.
  loadTemplateControlEvents()
  loadTemplateImportEvents()
  loadTemplateExportEvents()
  # Load the template data into the table.
  loadTemplateRows()

# Create a `tr` element representing the `template` provided.  
# The element returned should then be inserted in to the table that is
# displaying the templates.
loadTemplate = (template, shortcutModifiers) ->
  log.trace()
  log.debug 'Creating a row for the following template...', template
  shortcutModifiers ?= if ext.isThisPlatform 'mac'
      ext.SHORTCUT_MAC_MODIFIERS
    else
      ext.SHORTCUT_MODIFIERS
  row = $ '<tr/>', draggable: yes
  alignCenter = css: 'text-align': 'center'
  row.append $('<td/>', alignCenter).append $ '<input/>',
    title: i18n.get 'opt_select_box'
    type:  'checkbox'
    value: template.key
  row.append $('<td/>').append $ '<span/>',
    html:  """
      <i class="#{icons.getClass template.image}"></i> #{template.title}
    """
    title: i18n.get 'opt_template_modify_title', template.title
  row.append $ '<td/>', html: "#{shortcutModifiers}#{template.shortcut}"
  enabledIcon = if template.enabled then 'ok' else 'remove'
  row.append $('<td/>', alignCenter).append $ '<i/>',
    class: "icon-#{enabledIcon}"
  row.append $('<td/>').append $ '<span/>',
    text:  template.content
    title: template.content
  row.append $('<td/>').append $ '<span/>',
    class: 'muted'
    text:  '::::'
    title: i18n.get 'opt_template_move_title', template.title
  row

# Bind the event handlers required for controlling the templates.
loadTemplateControlEvents = ->
  log.trace()
  # Ensure template wizard is closed if/when tabify links are clicked within
  # it.
  $('#template_wizard [tabify]').click -> closeWizard()
  $('#template_cancel_btn').click -> closeWizard()
  $('#template_reset_btn').click -> resetWizard()
  # Support search functionality for templates.
  filter = $ '#template_filter'
  filter.find('option').remove()
  for limit in ext.config.options.limits
    filter.append $ '<option/>', text: limit
  filter.append $ '<option/>',
    disabled: 'disabled'
    text:     '-----'
  filter.append $ '<option/>',
    text:  i18n.get 'opt_show_all_text'
    value: 0
  store.init 'options_limit', parseInt $('#template_filter').val()
  limit = store.get 'options_limit'
  $('#template_filter option').each ->
    $this = $ this
    $this.prop 'selected', limit is parseInt $this.val()
  $('#template_filter').change ->
    store.set 'options_limit', parseInt $(this).val()
    loadTemplateRows searchResults ? ext.templates
  $('#template_search :reset').click ->
    $('#template_search :text').val ''
    searchTemplates()
  $('#template_controls').submit ->
    searchTemplates $('#template_search :text').val()
  # Ensure user confirms deletion of template.
  $('#template_delete_btn').click ->
    $(this).hide()
    $('#template_confirm_delete').css 'display', 'inline-block'
  $('#template_undo_delete_btn').click ->
    $('#template_confirm_delete').hide()
    $('#template_delete_btn').show()
  $('#template_confirm_delete_btn').click ->
    $('#template_confirm_delete').hide()
    $('#template_delete_btn').show()
    deleteTemplates [activeTemplate]
    closeWizard()
  validationErrors = []
  $('#template_wizard').on 'hide', ->
    error.hide() for error in validationErrors
  $('#template_save_btn').click ->
    template = deriveTemplate()
    # Clear all existing validation errors.
    error.hide() for error in validationErrors
    validationErrors = validateTemplate template
    if validationErrors.length
      error.show() for error in validationErrors
    else
      validationErrors = []
      $.extend activeTemplate, template
      saveTemplate activeTemplate
      $('#template_search :reset').hide()
      $('#template_search :text').val ''
      closeWizard()
  $('#disable_btn, #enable_btn').click ->
    enableTemplates getSelectedTemplates(), $(this).is '#enable_btn'
  # Open the template wizard without any context.
  $('#add_btn').click -> openWizard null
  selectedTemplates = []
  $('#delete_wizard').on 'hide', ->
    selectedTemplates = []
    $('#delete_items li').remove()
  # Prompt the user to confirm removal of the selected template(s).
  warningMsg = null
  $('#delete_btn').click ->
    deleteItems         = $ '#delete_items'
    predefinedTemplates = $ '<ul/>'
    selectedTemplates   = getSelectedTemplates()
    deleteItems.find('li').remove()
    # Create list items for each template and allocate them accordingly.
    for template in selectedTemplates
      item = $ '<li/>', text: template.title
      if template.readOnly
        predefinedTemplates.append item
      else
        deleteItems.append item
    # Show warning message if user attempted to delete predefined template(s);
    # otherwise begin the removal process by showing the dialog.
    predefinedCount = predefinedTemplates.find('li').length
    if predefinedCount
      warningMsg?.hide()
      div = $ '<div/>'
      div.append $ '<p/>', html: i18n.get if predefinedCount is 1
        'opt_template_delete_predefined_error_1'
      else
        'opt_template_delete_multiple_predefined_error_1'
      div.append predefinedTemplates
      div.append $ '<p/>', html: i18n.get if predefinedCount is 1
        'opt_template_delete_predefined_error_2'
      else
        'opt_template_delete_multiple_predefined_error_2'
      warningMsg = new WarningMessage yes
      warningMsg.message = div.html()
      warningMsg.show()
    else
      $('#delete_wizard').modal 'show'
  # Cancel the template removal process.
  $('#delete_cancel_btn, #delete_no_btn').click ->
    $('#delete_wizard').modal 'hide'
  # Finalize the template removal process.
  $('#delete_yes_btn').click ->
    deleteTemplates selectedTemplates
    $('#delete_wizard').modal 'hide'

# Bind the event handlers required for exporting templates.
loadTemplateExportEvents = ->
  log.trace()
  # Simulate alert closing without removing alert from the DOM.
  $('#export_error .close').click ->
    $(this).next().html('&nbsp').parent().hide()
  $('#export_wizard').on 'hide', ->
    $('#export_content').val ''
    $('#export_save_btn').attr 'href', '#'
    $('#export_error').find('span').html('&nbsp;').end().hide()
  # Show the wizard and create the exported data based on the selected
  # templates.
  $('#export_btn').click ->
    log.info 'Launching export wizard'
    str  = createExport getSelectedTemplates()
    $('#export_content').val str
    blob = new Blob [str], type: 'application/json'
    URL  = window.URL or window.webkitURL
    $('#export_save_btn').attr 'href', URL.createObjectURL blob
    $('#export_wizard').modal 'show'
  # Cancel the export process and hide the export wizard.
  $('#export_close_btn').click -> $('#export_wizard').modal 'hide'
  # Copy the JSON string into the system clipboard.
  $('#export_copy_btn').click ->
    $this = $ this
    ext.copy $('#export_content').val(), yes
    $this.text i18n.get 'opt_export_wizard_copy_alt_button'
    $this.delay(800).queue ->
      $this.text i18n.get 'opt_export_wizard_copy_button'
      $this.dequeue()

# Bind the event handlers required for importing templates.
loadTemplateImportEvents = ->
  log.trace()
  data = null
  # Simulate alert closing without removing alert from the DOM.
  $('#import_error .close').click ->
    $(this).next().html('&nbsp').parent().hide()
  $('#import_wizard').on 'hide', ->
    $('#import_final_btn').prop 'disabled', yes
    $('#import_wizard_stage2, #import_back_btn, #import_final_btn').hide()
    $('#import_wizard_stage1, #import_continue_btn').show()
    $('#import_content, #import_file_btn').val ''
    $('#import_file_btn').val ''
    $('#import_error').find('span').html('&nbsp;').end().hide()
  # Restore the previous view in the import process.
  $('#import_back_btn').click ->
    log.info 'Going back to previous import stage'
    $('#import_wizard_stage2, #import_back_btn, #import_final_btn').hide()
    $('#import_wizard_stage1, #import_continue_btn').show()
  # Prompt the user to input/load the data to be imported.
  $('#import_btn').click ->
    log.info 'Launching import wizard'
    $('#import_wizard').modal 'show'
  # Enable/disable the finalize button depending on whether or not any
  # templates are currently selected.
  $('#import_items').change ->
    $('#import_final_btn').prop 'disabled',
      not $(this).find(':selected').length
  # Select all of the templates in the list.
  $('#import_select_all_btn').click ->
    $('#import_items option').prop('selected', yes).parent().focus()
    $('#import_final_btn').prop 'disabled', no
  # Deselect all of the templates in the list.
  $('#import_deselect_all_btn').click ->
    $('#import_items option').prop('selected', no).parent().focus()
    $('#import_final_btn').prop 'disabled', yes
  # Read the contents of the loaded file in to the text area and perform simple
  # error handling.
  $('#import_file_btn').change (e) ->
    file   = e.target.files[0]
    reader = new FileReader()
    reader.onerror = fileErrorHandler (message) ->
      log.error message
      $('#import_error').find('span').text(message).end().show()
    reader.onload = (e) ->
      result = e.target.result
      log.debug 'Following contents were read from the file...', result
      $('#import_error').find('span').html('&nbsp;').end().hide()
      $('#import_content').val result
    reader.readAsText file
  # Finalize the import process.
  $('#import_final_btn').click ->
    if data?
      for template in data.templates
        if $("#import_items option[value='#{template.key}']").is ':selected'
          existingFound = no
          for existing, i in ext.templates when existing.key is template.key
            existingFound    = yes
            template.index   = i
            ext.templates[i] = template
          unless existingFound
            template.index = ext.templates.length
            ext.templates.push template
      store.set 'templates', ext.templates
      ext.updateTemplates()
      loadTemplateRows()
      updateToolbarTemplates()
      analytics.track 'Templates', 'Imported', data.version,
        data.templates.length
    $('#import_wizard').modal 'hide'
    $('#template_search :reset').hide()
    $('#template_search :text').val ''
  # Cancel the import process.
  $('#import_close_btn').click -> $('#import_wizard').modal 'hide'
  # Paste the contents of the system clipboard in to the textarea.
  $('#import_paste_btn').click ->
    $this = $ this
    $('#import_file_btn').val ''
    $('#import_content').val ext.paste()
    $this.text i18n.get 'opt_import_wizard_paste_alt_button'
    $this.delay(800).queue ->
      $this.text i18n.get 'opt_import_wizard_paste_button'
      $this.dequeue()
  # Read the imported data and attempt to extract any valid templates and list
  # the changes to user for them to check and finalize.
  $('#import_continue_btn').click ->
    $this = $(this).prop 'disabled', yes
    list  = $ '#import_items'
    str   = $('#import_content').val()
    $('#import_error').find('span').html('&nbsp;').end().hide()
    list.find('option').remove()
    try
      importData = createImport str
    catch error
      log.error error
      $('#import_error').find('span').text(error).end().show()
    if importData
      data = readImport importData
      if data.templates.length
        $('#import_count').text data.templates.length
        for template in data.templates
          list.append $ '<option/>',
            text:  template.title
            value: template.key
        $('#import_final_btn').prop 'disabled', yes
        $('#import_wizard_stage1, #import_continue_btn').hide()
        $('#import_wizard_stage2, #import_back_btn, #import_final_btn').show()
    $this.prop 'disabled', no

# Load the `templates` into the table to be displayed to the user.  
# Optionally, pagination can be disabled but this should only really be used
# internally by the pagination process.
loadTemplateRows = (templates = ext.templates, pagination = yes) ->
  log.trace()
  table = $ '#templates'
  # Start from a clean slate.
  table.find('tbody tr').remove()
  if templates.length
    # Determine keyboard shortcut modifier for current system.
    shortcutModifiers = if ext.isThisPlatform 'mac'
      ext.SHORTCUT_MAC_MODIFIERS
    else
      ext.SHORTCUT_MODIFIERS
    # Create and insert rows representing each template.
    for template in templates
      table.append loadTemplate template, shortcutModifiers
    paginate templates if pagination
    activateTooltips table
    activateDraggables()
    activateModifications()
  else
    # Show single row to indicate no templates were found.
    table.find('tbody').append $('<tr/>').append $ '<td/>',
      colspan: table.find('thead th').length
      html:    i18n.get 'opt_no_templates_found_text'
  activateSelections()

# Update the toolbar behaviour section of the options page with the current
# settings.
loadToolbar = ->
  log.trace()
  toolbar = store.get 'toolbar'
  if toolbar.popup
    $('#toolbarPopupYes').addClass 'active'
  else
    $('#toolbarPopupNo').addClass 'active'
  $('#toolbarClose').attr   'checked', 'checked' if toolbar.close
  $('#toolbarOptions').attr 'checked', 'checked' if toolbar.options
  updateToolbarTemplates()
  loadToolbarControlEvents()
  loadToolbarSaveEvents()

# Bind the event handlers required for controlling toolbar behaviour changes.
loadToolbarControlEvents = ->
  log.trace()
  # Bind a click event to listen for changes to the button selection.
  $('#toolbarPopup .btn').click( ->
    $(".#{$(this).attr 'id'}").show().siblings().hide()
  ).filter('.active').click()

# Bind the event handlers required for persisting toolbar behaviour changes.
loadToolbarSaveEvents = ->
  log.trace()
  $('#toolbarPopup .btn').click ->
    popup = not $('#toolbarPopupYes').hasClass 'active'
    store.modify 'toolbar', (toolbar) -> toolbar.popup = popup
    ext.updateToolbar()
    log.debug "Toolbar popup enabled: #{popup}"
    analytics.track 'Toolbars', 'Changed', 'Behaviour', Number popup
  bindSaveEvent '#toolbarClose, #toolbarKey, #toolbarOptions', 'change',
   'toolbar', (key) ->
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

# Update the URL shorteners section of the options page with the current
# settings.
loadUrlShorteners = ->
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
  loadUrlShortenerAccounts()
  loadUrlShortenerControlEvents()
  loadUrlShortenerSaveEvents()

# Update the accounts in the URL shorteners section of the options pages with
# current state of their OAuth objects.
loadUrlShortenerAccounts = ->
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
loadUrlShortenerControlEvents = ->
  log.trace()
  # Bind a click event to listen for changes to the button selection.
  $('#yourlsAuthentication button').click( ->
    $(".#{$(this).attr 'id'}").show().siblings().hide()
  ).filter('.active').click()

# Bind the event handlers required for persisting URL shortener configuration
# changes.
loadUrlShortenerSaveEvents = ->
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
  bindSaveEvent "#yourlsPassword, #yourlsSignature, #yourlsUrl
   , #yourlsUsername", 'input', 'yourls', -> @val().trim()

# Save functions
# --------------

# Delete all of the `templates` provided.  
# A check is performed to ensure that no predefined templates are removed.
deleteTemplates = (templates) ->
  log.trace()
  keys = []
  list = []
  for template in templates when not template.readOnly
    keys.push template.key
    list.push template
  if keys.length
    keep = []
    for template, i in ext.templates when template.key not in keys
      template.index = i
      keep.push template
    store.set 'templates', keep
    ext.updateTemplates()
    if keys.length > 1
      log.debug "Deleted #{keys.length} templates"
      analytics.track 'Templates', 'Deleted', "Count[#{keys.length}]"
    else
      template = list[0]
      log.debug "Deleted #{template.title} template"
      analytics.track 'Templates', 'Deleted', template.title
    loadTemplateRows searchResults ? ext.templates
    updateToolbarTemplates()

# Enable/disable all of the `templates` provided.
enableTemplates = (templates, enable = yes) ->
  log.trace()
  keys = (template.key for template in templates)
  if keys.length
    stored = store.get 'templates'
    for template in stored when template.key in keys
      template.enabled = enable
    store.set 'templates', stored
    ext.updateTemplates()
    action = if enable then 'Enabled' else 'Disabled'
    if keys.length > 1
      log.debug "#{action} #{keys.length} templates"
      analytics.track 'Templates', action, "Count[#{keys.length}]"
    else
      template = templates[0]
      log.debug "#{action} #{template.title} template"
      analytics.track 'Templates', action, template.title
    loadTemplateRows searchResults ? ext.templates

# Reorder the templates after a drag and drop *swap* by updating their indices
# and sorting them accordingly.  
# These changes are then persisted and should be reflected throughout the
# extension.
reorderTemplates = (fromIndex, toIndex) ->
  log.trace()
  templates = ext.templates
  if fromIndex? and toIndex?
    templates[fromIndex].index = toIndex
    templates[toIndex].index   = fromIndex
  store.set 'templates', templates
  ext.updateTemplates()
  updateToolbarTemplates()

# Update and persist the `template` provided.  
# Any required validation should be performed perior to calling this method.
saveTemplate = (template) ->
  log.trace()
  log.debug 'Saving the following template...', template
  isNew     = not template.key?
  templates = store.get 'templates'
  if isNew
    template.key = utils.keyGen()
    templates.push template
  else
    for temp, i in templates when temp.key is template.key
      templates[i] = template
      break
  store.set 'templates', templates
  ext.updateTemplates()
  loadTemplateRows()
  updateToolbarTemplates()
  action = if isNew then 'Added' else 'Saved'
  analytics.track 'Templates', action, template.title
  template

# Update the existing template with information extracted from the imported
# template provided.  
# `template` should not be altered in any way and the properties of `existing`
# should only be changed if the replacement values are valid.  
# Protected properties will only be updated if `existing` is not read-only and
# the replacement value is valid.
updateImportedTemplate = (template, existing) ->
  log.trace()
  log.debug 'Updating existing template with the following imported data...',
    template
  # Ensure that read-only templates are protected.
  unless existing.readOnly
    existing.content = template.content
    # Only allow valid titles.
    existing.title = template.title if 0 < template.title.length <= 32
  existing.enabled = template.enabled
  # Only allow existing images or *None*.
  if template.image is '' or icons.exists template.image
    existing.image = template.image
  # Only allow valid keyboard shortcuts or *empty*.
  if template.shortcut is '' or isShortcutValid template.shortcut
    existing.shortcut = template.shortcut
  existing.usage = template.usage
  log.debug 'Updated the following template...', existing
  existing

# Update the selection of templates in the toolbar behaviour section to reflect
# those available in the templates section.
updateToolbarTemplates = ->
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

# Validation classes
# ------------------

# `ValidationError` allows easy management and display of validation error
# messages that are associated with specific fields.
class ValidationError extends utils.Class

  # Create a new instance of `ValidationError`.
  constructor: (@id, @key) ->
    @className = 'error'

  # Hide any validation messages currently displayed for the associated field.
  hide: ->
    field = $ "##{@id}"
    field.parents('.control-group:first').removeClass @className
    field.parents('.controls:first').find('.help-block').remove()

  # Display the validation message for the associated field.
  show: ->
    field = $ "##{@id}"
    field.parents('.control-group:first').addClass @className
    field.parents('.controls:first').append $ '<span/>',
      class: 'help-block'
      html:  i18n.get @key

# `ValidationWarning` allows easy management and display of validation warning
# messages that are associated with specific fields.
class ValidationWarning extends ValidationError

  # Create a new instance of `ValidationWarning`.
  constructor: (@id, @key) ->
    @className = 'warning'

# Validation functions
# --------------------

# Indicate whether or not the specified `key` is valid.
isKeyValid = (key) ->
  log.trace()
  log.debug "Validating template key '#{key}'"
  R_VALID_KEY.test key

# Indicate whether or not the specified keyboard `shortcut` is valid for use by
# a template.
isShortcutValid = (shortcut) ->
  log.trace()
  log.debug "Validating keyboard shortcut '#{shortcut}'"
  R_VALID_SHORTCUT.test shortcut

# Indicate whether or not `template` contains the required fields of the
# correct types.
# Perform a *soft* validation without validating the values themselves, instead
# only their existence.
validateImportedTemplate = (template) ->
  log.trace()
  log.debug 'Validating property types of the following template...', template
  'object'  is typeof template          and
  'string'  is typeof template.content  and
  'boolean' is typeof template.enabled  and
  'string'  is typeof template.image    and
  'string'  is typeof template.key      and
  'string'  is typeof template.shortcut and
  'string'  is typeof template.title    and
  'number'  is typeof template.usage

# Validate the `template` and return any validation errors/warnings that were
# encountered.
validateTemplate = (template) ->
  log.trace()
  isNew  = not template.key?
  errors = []
  log.debug 'Validating the following template...', template
  unless template.readOnly
    # Title is missing but is required.
    unless template.title
      errors.push new ValidationError 'template_title',
        'opt_template_title_invalid'
  # Validate whether or not the shortcut is valid.
  if template.shortcut and not isShortcutValid template.shortcut
    errors.push new ValidationError 'template_shortcut',
      'opt_template_shortcut_invalid'
  # Indicate whether or not any validation errors were encountered.
  log.debug 'Following validation errors were found...', errors
  errors

# Miscellaneous classes
# ---------------------

# `Message` allows simple management and display of alert messages.
class Message extends utils.Class

  # Create a new instance of `Message`.
  constructor: (@block) ->
    @className = 'alert-info'
    @headerKey = 'opt_message_header'

  # Hide this `Message` if it has previously been displayed.
  hide: -> @alert?.alert 'close'

  # Display this `Message` at the top of the current tab.
  show: ->
    @header  = i18n.get @headerKey if @headerKey and not @header?
    @message = i18n.get @messageKey if @messageKey and not @message?
    @alert   = $ '<div/>', class: "alert #{@className}"
    @alert.addClass 'alert-block' if @block
    @alert.append $ '<button/>',
      class:          'close'
      'data-dismiss': 'alert'
      html:           '&times;'
      type:           'button'
    if @header
      @alert.append $ "<#{if @block then 'h4' else 'strong'}/>", html: @header
    if @message
      @alert.append if @block then @message else " #{@message}"
    @alert.prependTo $ $('#navigation li.active a').attr 'tabify'

# `ErrorMessage` allows simple management and display of error messages.
class ErrorMessage extends Message

  # Create a new instance of `ErrorMessage`.
  constructor: (@block) ->
    @className = 'alert-error'
    @headerKey = 'opt_message_error_header'

# `SuccessMessage` allows simple management and display of success messages.
class SuccessMessage extends Message

  # Create a new instance of `SuccessMessage`.
  constructor: (@block) ->
    @className = 'alert-success'
    @headerKey = 'opt_message_success_header'

# `WarningMessage` allows simple management and display of warning messages.
class WarningMessage extends Message

  # Create a new instance of `WarningMessage`.
  constructor: (@block) ->
    @className = ''
    @headerKey = 'opt_message_warning_header'

# Miscellaneous functions
# -----------------------

# Create a template from the information from the imported `template` provided.  
# `template` is not altered in any way and the new template is only created if
# `template` has a valid key.  
# Other than the key, any invalid fields will not be copied to the new template
# which will instead use the preferred default value for those fields.
addImportedTemplate = (template) ->
  log.trace()
  log.debug 'Creating a new template with the following details...', template
  if isKeyValid template.key
    newTemplate =
      content:  template.content
      enabled:  template.enabled
      image:    ''
      key:      template.key
      readOnly: no
      shortcut: ''
      title:    i18n.get 'untitled'
      usage:    template.usage
    # Only allow existing images.
    newTemplate.image = template.image if icons.exists template.image
    # Only allow valid keyboard shortcuts.
    if isShortcutValid template.shortcut
      newTemplate.shortcut = template.shortcut
    # Only allow valid titles.
    newTemplate.title = template.title if 0 < template.title.length <= 32
  log.debug 'Following template was created...', newTemplate
  newTemplate

# Activate drag and drop functionality for reordering templates.  
# The activation is done cleanly, unbinding any associated events that have
# been previously bound.
activateDraggables = ->
  log.trace()
  table      = $ '#templates'
  dragSource = null
  draggables = table.find '[draggable]'
  draggables.off 'dragstart dragend dragenter dragover drop'
  draggables.on 'dragstart', (e) ->
    $this      = $ this
    dragSource = this
    table.removeClass 'table-hover'
    $this.addClass 'dnd-moving'
    $this.find('[data-original-title]').tooltip 'hide'
    e.originalEvent.dataTransfer.effectAllowed = 'move'
    e.originalEvent.dataTransfer.setData 'text/html', $this.html()
  draggables.on 'dragend', (e) ->
    draggables.removeClass 'dnd-moving dnd-over'
    table.addClass 'table-hover'
    dragSource = null
  draggables.on 'dragenter', (e) ->
    $this = $ this
    draggables.not($this).removeClass 'dnd-over'
    $this.addClass 'dnd-over'
  draggables.on 'dragover', (e) ->
    e.preventDefault()
    e.originalEvent.dataTransfer.dropEffect = 'move'
    false
  draggables.on 'drop', (e) ->
    $dragSource = $ dragSource
    e.stopPropagation()
    if dragSource isnt this
      $this = $ this
      $dragSource.html $this.html()
      $this.html e.originalEvent.dataTransfer.getData 'text/html'
      activateTooltips table
      activateModifications()
      activateSelections()
      fromIndex = $dragSource.index()
      toIndex   = $this.index()
      if searchResults?
        fromIndex = searchResults[fromIndex].index
        toIndex   = searchResults[toIndex].index
      reorderTemplates fromIndex, toIndex
    false

# Activate functionality to open template wizard when a row is clicked.  
# The activation is done cleanly, unbinding any associated events that have
# been previously bound.
activateModifications = ->
  log.trace()
  $('#templates tbody tr td:not(:first-child)').off('click').click ->
    activeKey = $(this).parents('tr:first').find(':checkbox').val()
    openWizard ext.queryTemplate (template) -> template.key is activeKey

# Activate select all/one functionality on the templates table.  
# The activation is done cleanly, unbinding any associated events that have
# been previously bound.
activateSelections = ->
  log.trace()
  table       = $ '#templates'
  selectBoxes = table.find 'tbody :checkbox'
  selectBoxes.off('change').change ->
    $this       = $ this
    messageKey  = 'opt_select_box'
    messageKey += '_checked' if $this.is ':checked'
    $this.attr 'data-original-title', i18n.get messageKey
    refreshSelectButtons()
  table.find('thead :checkbox').off('change').change ->
    $this       = $ this
    checked     = $this.is ':checked'
    messageKey  = 'opt_select_all_box'
    messageKey += '_checked' if checked
    $this.attr 'data-original-title', i18n.get messageKey
    selectBoxes.prop 'checked', checked
    refreshSelectButtons()
  refreshSelectButtons()

# Activate tooltip effects, optionally only within a specific context.  
# The activation is done cleanly, unbinding any associated events that have
# been previously bound.
activateTooltips = (selector) ->
  log.trace()
  base = $ selector or document
  base.find('[data-original-title]').each ->
    $this = $ this
    $this.tooltip 'destroy'
    $this.attr 'title', $this.attr 'data-original-title'
    $this.removeAttr 'data-original-title'
  base.find('[title]').each ->
    $this     = $ this
    placement = $this.attr 'data-placement'
    placement = if placement? then trimToLower placement else 'top'
    $this.tooltip
      container: $this.attr('data-container') ? 'body'
      placement: placement

# Convenient shorthand for setting the current context to `null`.
clearContext = -> setContext null

# Clear the current context and close the template wizard.
closeWizard = ->
  clearContext()
  $('#template_wizard').modal 'hide'

# Create a JSON string to export the specified `templates`.
createExport = (templates = []) ->
  log.trace()
  log.debug 'Creating an export string for the following templates...',
    templates
  data = templates: templates[..], version: ext.version
  delete template.menuId for template in data.templates
  if data.templates.length
    analytics.track 'Templates', 'Exported', ext.version, data.templates.length
  log.debug 'Following export data has been created...', data
  JSON.stringify data

# Create a JSON object from the imported string specified.
createImport = (str) ->
  log.trace()
  log.debug 'Parsing the following import string...', str
  try
    data = JSON.parse str
  catch error
    throw i18n.get 'error_import_data'
  if not $.isArray(data.templates) or data.templates.length is 0 or
      typeof data.version isnt 'string'
    throw i18n.get 'error_import_invalid'
  log.debug 'Following data was created from the string...', data
  data

# Create a template based on the current context and the information derived
# from the wizard fields.
deriveTemplate = ->
  log.trace()
  readOnly = activeTemplate.readOnly ? no
  template =
    content:  if readOnly
      activeTemplate.content
    else
      $('#template_content').val()
    enabled:  $('#template_enabled').is ':checked'
    image:    $('#template_image').val()
    index:    activeTemplate.index ? ext.templates.length
    key:      activeTemplate.key
    readOnly: readOnly
    shortcut: trimToUpper $('#template_shortcut').val()
    title:    if readOnly
      activeTemplate.title
    else
      $('#template_title').val().trim()
    usage:    activeTemplate.usage ? 0
  log.debug 'Following template was derived...', template
  template

# Add the user feedback feature to the page.
feedback = ->
  log.trace()
  unless feedbackAdded
    # Load the UserVoice widget.
    uv       = document.createElement 'script'
    uv.async = 'async'
    uv.src   = """
      https://widget.uservoice.com/#{ext.config.options.userVoice.id}.js
    """
    script = document.getElementsByTagName('script')[0]
    script.parentNode.insertBefore uv, script
    # Configure the widget as it's loading.
    UserVoice = window.UserVoice or= []
    UserVoice.push [
      'showTab'
      'classic_widget'
      {
        mode:          'full'
        primary_color: '#333'
        link_color:    '#08c'
        default_mode:  'feedback'
        forum_id:      ext.config.options.userVoice.forum
        tab_label:     i18n.get 'opt_feedback_button'
        tab_color:     '#333'
        tab_position:  'middle-left'
        tab_inverted:  yes
      }
    ]
    feedbackAdded = yes

# Error handler to be used when dealing with the FileSystem API that passes a
# localized error message to `callback`.
fileErrorHandler = (callback) ->
  (e) ->
    callback i18n.get switch e.code
      when FileError.NOT_FOUND_ERR then 'error_file_not_found'
      when FileError.ABORT_ERR then 'error_file_aborted'
      else 'error_file_default'

# Retrieve all currently selected templates.
getSelectedTemplates = ->
  selectedKeys      = []
  $('#templates tbody :checkbox:checked').each ->
    selectedKeys.push $(this).val()
  ext.queryTemplates (template) -> template.key in selectedKeys

# Open the template wizard after optionally setting the current context.
openWizard = (template) ->
  setContext template if arguments.length
  $('#template_wizard').modal 'show'

# Update the pagination UI for the specified `templates`.
paginate = (templates) ->
  log.trace()
  limit      = parseInt $('#template_filter').val()
  pagination = $ '#pagination'
  if templates.length > limit > 0
    children = pagination.find 'ul li'
    pages    = Math.ceil templates.length / limit
    # Refresh the pagination link states based on the new `page`.
    refreshPagination = (page = 1) ->
      # Select and display the desired templates subset.
      start = limit * (page - 1)
      end   = start + limit
      loadTemplateRows templates[start...end], no
      # Ensure the *previous* link is only enabled when a previous page exists.
      pagination.find('ul li:first-child').each ->
        $this = $ this
        if page is 1
          $this.addClass 'disabled'
        else
          $this.removeClass 'disabled'
      # Ensure only the active page is highlighted.
      pagination.find('ul li:not(:first-child, :last-child)').each ->
        $this = $ this
        if page is parseInt $this.text()
          $this.addClass 'active'
        else
          $this.removeClass 'active'
      # Ensure the *next* link is only enabled when a next page exists.
      pagination.find('ul li:last-child').each ->
        $this = $ this
        if page is pages
          $this.addClass 'disabled'
        else
          $this.removeClass 'disabled'
    # Create and insert pagination links.
    if pages isnt children.length - 2
      children.remove()
      list = pagination.find 'ul'
      list.append $('<li/>').append $ '<a>&laquo;</a>'
      for page in [1..pages]
        list.append $('<li/>').append $ "<a>#{page}</a>"
      list.append $('<li/>').append $ '<a>&raquo;</a>'
    # Bind event handlers to manage navigating pages.
    pagination.find('ul li').off 'click'
    pagination.find('ul li:first-child').click ->
      unless $(this).hasClass 'disabled'
        refreshPagination pagination.find('ul li.active').index() - 1
    pagination.find('ul li:not(:first-child, :last-child)').click ->
      $this = $ this
      unless $this.hasClass 'active'
        refreshPagination $this.index()
    pagination.find('ul li:last-child').click ->
      unless $(this).hasClass 'disabled'
        refreshPagination pagination.find('ul li.active').index() + 1
    refreshPagination()
    pagination.show()
  else
    # Hide the pagination and remove all links as the results fit on a single
    # page.
    pagination.hide().find('ul li').remove()

# Read the imported data created by `createImport` and extract all of the
# imported templates that appear to be valid.  
# When overwriting an existing template, only the properties with valid values
# will be transferred with the exception of protected properties (i.e. on
# read-only templates).  
# When creating a new template, any invalid properties will be replaced with
# their default values.
readImport = (importData) ->
  log.trace()
  log.debug 'Importing the following data...', importData
  data       = templates: []
  keys       = []
  storedKeys = (template.key for template in ext.templates)
  for template in importData.templates
    existing = {}
    # Ensure templates imported from previous versions are valid for 1.0.0+.
    if importData.version < '1.0.0'
      template.image = if template.image > 0
        icons.fromLegacy(template.image - 1)?.name or ''
      else
        ''
      template.key   = ext.getKeyForName template.name
      template.usage = 0
    else if importData.version < '1.1.0'
      template.image = icons.fromLegacy(template.image)?.name or ''
    if validateImportedTemplate template
      if template.key not in storedKeys and template.key not in keys
        # Attempt to create and add the new template.
        template = addImportedTemplate template
        if template
          template.index = storedKeys.length + keys.length
          data.templates.push template
          keys.push template.key
      else
        # Attempt to update the previously imported template.
        for imported, i in data.templates when imported.key is template.key
          existing          = updateImportedTemplate template, imported
          data.templates[i] = existing
          break
        unless existing.key
          # Attempt to locate the existing template and clone it.
          existing = $.extend yes, {}, ext.queryTemplate (temp) ->
            temp.key is template.key
          # Attempt to update the derived template.
          if existing and not $.isEmptyObject existing
            existing = updateImportedTemplate template, existing
            data.templates.push existing
            keys.push existing.key
  log.debug 'Following data was derived from that imported...', data
  data

# Update the state of the reset button depending on the current search input.
refreshResetButton = ->
  log.trace()
  container = $ '#template_search'
  resetBtn  = container.find ':reset'
  if container.find(':text').val()
    container.addClass 'input-prepend'
    resetBtn.show()
  else
    resetBtn.hide()
    container.removeClass 'input-prepend'

# Update the state of certain buttons depending on whether any select boxes
# have been checked.
refreshSelectButtons = ->
  log.trace()
  buttons    = $ '#delete_btn, #disable_btn, #enable_btn, #export_btn'
  selections = $ '#templates tbody :checkbox:checked'
  buttons.prop 'disabled', selections.length is 0

# Reset the wizard field values based on the current context.
resetWizard = ->
  log.trace()
  activeTemplate ?= {}
  $('#template_wizard .modal-header h3').html if activeTemplate.key?
    i18n.get 'opt_template_modify_title', activeTemplate.title
  else
    i18n.get 'opt_template_new_header'
  # Assign values to their respective fields.
  $('#template_content').val activeTemplate.content or ''
  $('#template_enabled').prop 'checked', activeTemplate.enabled ? yes
  $('#template_shortcut').val activeTemplate.shortcut or ''
  $('#template_title').val activeTemplate.title or ''
  # Update the fields and controls to reflect selected option.
  imgOpt = $ "#template_image option[value='#{activeTemplate.image}']"
  if imgOpt.length is 0
    $('#template_image option:first-child').attr 'selected', 'selected'
  else
    imgOpt.attr 'selected', 'selected'
  $('#template_image').change()
  # Disable appropriate fields for predefined templates.
  $('#template_content, #template_title').prop 'disabled',
    !!activeTemplate.readOnly
  $('#template_delete_btn').each ->
    $this = $ this
    $this.prop 'disabled', !!activeTemplate.readOnly
    if activeTemplate.key? then $this.show() else $this.hide()

# Search the templates for the specified `query` and filter those displayed.
searchTemplates = (query = '') ->
  log.trace()
  keywords = query.replace(R_CLEAN_QUERY, '').split R_WHITESPACE
  if keywords.length
    expression    = ///
      #{(keyword for keyword in keywords when keyword).join '|'}
    ///i
    searchResults = ext.queryTemplates (template) ->
      expression.test "#{template.content} #{template.title}"
  else
    searchResults = null
  loadTemplateRows searchResults ? ext.templates
  refreshResetButton()

# Set the current context of the template wizard.
setContext = (template = {}) ->
  log.trace()
  activeTemplate = {}
  $.extend activeTemplate, template
  resetWizard()

# Convenient shorthand for safely trimming a string to lower case.
trimToLower = (str = '') ->
  str.trim().toLowerCase()

# Convenient shorthand for safely trimming a string to upper case.
trimToUpper = (str = '') ->
  str.trim().toUpperCase()

# Options page setup
# ------------------

options = window.options = new class Options extends utils.Class

  # Public functions
  # ----------------

  # Initialize the options page.  
  # This will involve inserting and configuring the UI elements as well as
  # loading the current settings.
  init: ->
    log.trace()
    log.info 'Initializing the options page'
    # Add support for analytics if the user hasn't opted out.
    analytics.add() if store.get 'analytics'
    # Add the user feedback feature to the page.
    feedback()
    # Begin initialization.
    i18n.init
      bitlyAccount: opt_url_shortener_account_title: i18n.get 'shortener_bitly'
      googlAccount: opt_url_shortener_account_title: i18n.get 'shortener_googl'
      version_definition: opt_guide_standard_version_text: ext.version
    $('.year-repl').html "#{new Date().getFullYear()}"
    # Bind tab selection event to all tabs.
    initialTabChange = yes
    $('a[tabify]').click ->
      target  = $(this).attr 'tabify'
      nav     = $ "#navigation a[tabify='#{target}']"
      parent  = nav.parent 'li'
      unless parent.hasClass 'active'
        parent.siblings().removeClass 'active'
        parent.addClass 'active'
        $(target).show().siblings('.tab').hide()
        store.set 'options_active_tab', id = nav.attr 'id'
        unless initialTabChange
          id = id.match(/(\S*)_nav$/)[1]
          id = id[0].toUpperCase() + id.substr 1
          log.debug "Changing tab to #{id}"
          analytics.track 'Tabs', 'Changed', id
        initialTabChange = no
        $(document.body).scrollTop 0
    # Reflect the persisted tab.
    store.init 'options_active_tab', 'general_nav'
    optionsActiveTab = store.get 'options_active_tab'
    $("##{optionsActiveTab}").click()
    log.debug "Initially displaying tab for #{optionsActiveTab}"
    # Bind Developer Tools wizard events to their corresponding elements.
    $('#tools_nav').click -> $('#tools_wizard').modal 'show'
    $('.tools_close_btn').click -> $('#tools_wizard').modal 'hide'
    # Ensure that form submissions don't reload the page.
    $('form:not([target="_blank"])').submit -> no
    # Bind analytical tracking events to key footer buttons and links.
    $('footer a[href*="neocotic.com"]').click -> analytics.track 'Footer',
      'Clicked', 'Homepage'
    # Setup and configure the donation button in the footer.
    $('#donation input[name="hosted_button_id"]').val ext.config.options.payPal
    $('#donation').submit -> analytics.track 'Footer', 'Clicked', 'Donate'
    # Load the current option values.
    load()
    # Ensure first enabled input field in modals get focus when opened.
    $('.modal').on 'shown', ->
      $(this).find(':input:enabled:first').focus()
    # Apply OS-specific keyboard shortcut modifiers.
    $('#template_shortcut_modifier').html if ext.isThisPlatform 'mac'
      ext.SHORTCUT_MAC_MODIFIERS
    else
      ext.SHORTCUT_MODIFIERS
    # Initialize all popovers, tooltips and *go-to* links.
    $('[popover]').each ->
      $this     = $ this
      placement = $this.attr 'data-placement'
      placement = if placement? then trimToLower placement else 'right'
      trigger   = $this.attr 'data-trigger'
      trigger   = if trigger? then trimToLower trigger else 'hover'
      $this.popover
        content:   -> i18n.get $this.attr 'popover'
        html:      yes
        placement: placement
        trigger:   trigger
      if trigger is 'manual'
        $this.click -> $this.popover 'toggle'
    activateTooltips()
    navHeight = $('.navbar').height()
    $('[data-goto]').click ->
      goto = $ $(this).attr 'data-goto'
      pos  = goto.position()?.top or 0
      pos -= navHeight if pos and pos >= navHeight
      log.debug "Relocating view to include '#{goto.selector}' at #{pos}"
      $(window).scrollTop pos

# Initialize `options` when the DOM is ready.
utils.ready -> options.init()