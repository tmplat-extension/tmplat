# [Template](http://neocotic.com/template)  
# (c) 2013 Alasdair Mercer  
# Freely distributable under the MIT license.  
# For all details and documentation:  
# <http://neocotic.com/template>

# Private constants
# -----------------

# Regular expression used to validate template keys.
R_VALID_KEY      = /^[A-Z0-9]*\.[A-Z0-9]*$/i
# Regular expression used to validate keyboard shortcut inputs.
R_VALID_SHORTCUT = /[A-Z0-9]/i
# Source URL of the user feedback widget script.
WIDGET_SOURCE    = "https://widget.uservoice.com/RSRS5SpMkMxvKOCs27g.js"

# Private variables
# -----------------

# Copy of template being actively modified.
activeTemplate = null
# Easily accessible reference to the extension controller.
{ext}          = chrome.extension.getBackgroundPage()
# Indicate whether or not the user feedback feature has been added to the page.
feedbackAdded  = no

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

# Bind an event of the specified `type` to the elements included by
# `selector` that, when triggered, manipulates the selected template `option`
# element via `assign`.
bindTemplateSaveEvent = (selector, type, assign, callback) ->
  log.trace()
  $(selector).on type, ->
    $this     = $ this
    key       = ''
    templates = $ '#templates'
    option    = templates.find 'option:selected'
    if option.length and templates.data('quiet') isnt 'true'
      key = $this.attr('id').match(/^template_(\S*)/)[1]
      key = key[0].toLowerCase() + key.substr 1
      assign.call $this, option, key
      callback? $this, option, key

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
  loadTemplateRows()
  # Load all of the event handlers required for managing the templates.
  loadTemplateControlEvents()
  loadTemplateImportEvents()
  loadTemplateExportEvents()

# Create an `option` element representing the `template` provided.  
# The element returned should then be inserted in to the `select` element that
# is managing the templates on the options page.
loadTemplate = (template) ->
  log.trace()
  log.debug 'Creating an option for the following template...', template
  option = $ '<option/>',
    text:  template.title
    value: template.key
  option.data 'content',  template.content
  option.data 'enabled',  "#{template.enabled}"
  option.data 'image',    template.image
  option.data 'readOnly', "#{template.readOnly}"
  option.data 'shortcut', template.shortcut
  option.data 'usage',    "#{template.usage}"
  option

# TODO: Comment and rename
# TODO: Replace `loadTemplate`
loadTemplateNew = (template, shortcutModifiers) ->
  log.trace()
  log.debug 'Creating a row for the following template...', template
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
  # TODO: Remove legacy code
  templates    = $ '#templates'
  templatesNew = $ '#templatesNew'
  # Ensure template wizard is closed if/when tabify links are clicked within
  # it.
  $('#template_wizard [tabify]').click -> closeWizard()
  $('#template_cancel_btn').click -> closeWizard()
  $('#template_reset_btn').click -> resetWizard()
  $('#template_delete_btn').click ->
    # TODO: Prompt for confirmation
    deleteTemplates [activeTemplate]
    closeWizard()
  validationErrors = []
  $('#template_wizard').on 'hide', ->
    error.hide() for error in validationErrors
  $('#template_save_btn').click ->
    # Clear all existing validation errors.
    error.hide() for error in validationErrors
    validationErrors = validateTemplateNew()
    if validationErrors.length
      error.show() for error in validationErrors
    else
      $.extend activeTemplate, deriveTemplateNew()
      saveTemplate activeTemplate
      closeWizard()
  # Open the template wizard without any context.
  $('#add_btn').click -> openWizard null
  # TODO: Handle pagination and searching
  # TODO: Remove once contents no longer needed
  $('#add_btn_TODO_REMOVE').click ->
    opt = templates.find 'option:selected'
    if opt.length
      # Template was selected; clear that selection and allow creation.
      templates.val([]).change()
      $('#template_title').focus()
    else
      # User submitted new template so check it out already.
      opt = loadTemplate
        content:  $('#template_content').val()
        enabled:  String $('#template_enabled').is ':checked'
        image:    $('#template_image option:selected').val()
        key:      utils.keyGen()
        readOnly: no
        shortcut: $('#template_shortcut').val().trim().toUpperCase()
        title:    $('#template_title').val().trim()
        usage:    0
      # Wipe any pre-existing error messages.
      clearErrors()
      # Confirm that the template meets the criteria.
      errors = validateTemplate opt, yes
      if errors.length is 0
        log.debug 'Adding the following option...', opt
        templates.append opt
        opt.attr 'selected', 'selected'
        updateToolbarTemplates()
        templates.change().focus()
        saveTemplates()
        analytics.track 'Templates', 'Added', opt.text()
      else
        # Show the error message(s) to the user.
        showErrors errors
  selectedTemplates = []
  $('#delete_con').on 'hide', ->
      selectedTemplates = []
      $('#delete_items li').remove()
  # Prompt the user to confirm removal of the selected template(s).
  $('#delete_btn').click ->
    deleteItems         = $ '#delete_items'
    predefinedTemplates = []
    selectedTemplates   = getSelectedTemplates()
    deleteItems.find('li').remove()
    for template in selectedTemplates
      predefinedTemplates.push template if template.readOnly
      deleteItems.append $ '<li/>', text: template.title
    if predefinedTemplates.length
      # TODO: Show error message
    else
      $('#delete_con').modal 'show'
  # Cancel the template removal process.
  $('.delete_no_btn').click -> $('#delete_con').modal 'hide'
  # Finalize the template removal process.
  $('.delete_yes_btn').click ->
    deleteTemplates selectedTemplates
    $('#delete_con').modal 'hide'

# Bind the event handlers required for exporting templates.
loadTemplateExportEvents = ->
  log.trace()
  templates = $ '#templates'
  # Simulate alert closing without removing alert from the DOM.
  $('.export_error .close').on 'click', ->
    $('.export_error').find('span').html('&nbsp').end().hide()
  # Restore the previous view in the export process.
  $('.export_back_btn').click ->
    log.info 'Going back to previous export stage'
    $('.export_con_stage1').show()
    $('.export_con_stage2').hide()
  # Prompt the user to selected the templates to be exported.
  $('#export_btn').click ->
    log.info 'Launching export wizard'
    list = $ '.export_con_list'
    list.find('option').remove()
    updateTemplate templates.find 'option:selected'
    templates.val([]).change()
    $('.export_yes_btn').attr 'disabled', 'disabled'
    $('.export_con_stage1').show()
    $('.export_con_stage2').hide()
    $('.export_content').val ''
    $('.export_error').find('span').html('&nbsp;').end().hide()
    templates.find('option').each ->
      opt = $ this
      list.append $ '<option/>',
        text:  opt.text()
        value: opt.val()
    $('#export_con').modal 'show'
  # Enable/disable the continue button depending on whether or not any
  # templates are currently selected.
  $('.export_con_list').change ->
    if $(this).find('option:selected').length > 0
      $('.export_yes_btn').removeAttr 'disabled'
    else
      $('.export_yes_btn').attr 'disabled', 'disabled'
  # Copy the text area contents to the system clipboard.
  $('.export_copy_btn').click (event) ->
    $this = $ this
    ext.copy $('.export_content').val(), yes
    $this.text i18n.get 'opt_export_wizard_copy_alt_button'
    $this.delay 800
    $this.queue ->
      $this.text i18n.get 'opt_export_wizard_copy_button'
      $this.dequeue()
    event.preventDefault()
  # Deselect all of the templates in the list.
  $('.export_deselect_all_btn').click ->
    $('.export_con_list option').removeAttr('selected').parent().focus()
    $('.export_yes_btn').attr 'disabled', 'disabled'
  # Cancel the export process.
  $('.export_no_btn, .export_close_btn').click (event) ->
    $('#export_con').modal 'hide'
    event.preventDefault()
  # Prompt the user to select a file location to save the exported data.
  $('.export_save_btn').click ->
    $this = $ this
    str   = $this.parents('.export_con_stage2').find('.export_content').val()
    # Export-specific error handler for dealing with the FileSystem API.
    exportErrorHandler = fileErrorHandler (message) ->
      log.error message
      $('.export_error').find('span').text(message).end().show()
    # Write the contents of the text area in to a temporary file and then
    # prompt the user to download it.
    window.webkitRequestFileSystem window.TEMPORARY, 1024 * 1024, (fs) ->
      fs.root.getFile 'export.json', create: yes, (fileEntry) ->
        fileEntry.createWriter (fileWriter) ->
          builder = new WebKitBlobBuilder()
          done    = no
          builder.append str
          fileWriter.onerror    = exportErrorHandler
          fileWriter.onwriteend = ->
            if done
              $('.export_error').find('span').html('&nbsp;').end().hide()
              window.location.href = fileEntry.toURL()
            else
              done = yes
              fileWriter.write builder.getBlob 'application/json'
          fileWriter.truncate 0
      , exportErrorHandler
    , exportErrorHandler
  # Select all of the templates in the list.
  $('.export_select_all_btn').click ->
    $('.export_con_list option').attr('selected', 'selected').parent().focus()
    $('.export_yes_btn').removeAttr 'disabled'
  # Create the exported data based on the selected templates.
  $('.export_yes_btn').click ->
    $this = $ this
    items = $this.parents('.export_con_stage1').find '.export_con_list option'
    keys  = []
    items.filter(':selected').each -> keys.push $(this).val()
    $('.export_content').val createExport keys
    $('.export_error').find('span').html('&nbsp;').end().hide()
    $('.export_con_stage1').hide()
    $('.export_con_stage2').show()

# Bind the event handlers required for importing templates.
loadTemplateImportEvents = ->
  log.trace()
  data      = null
  templates = $ '#templates'
  # Simulate alert closing without removing alert from the DOM.
  $('.import_error .close').on 'click', ->
    $('.import_error').find('span').html('&nbsp').end().hide()
  # Restore the previous view in the import process.
  $('.import_back_btn').click ->
    log.info 'Going back to previous import stage'
    $('.import_con_stage1').show()
    $('.import_con_stage2, .import_con_stage3').hide()
  # Prompt the user to input/load the data to be imported.
  $('#import_btn').click ->
    log.info 'Launching import wizard'
    updateTemplate templates.find 'option:selected'
    templates.val([]).change()
    $('.import_con_stage1').show()
    $('.import_con_stage2, .import_con_stage3').hide()
    $('.import_content').val ''
    $('.import_error').find('span').html('&nbsp;').end().hide()
    $('.import_file_btn').val ''
    $('#import_con').modal 'show'
  # Enable/disable the finalize button depending on whether or not any
  # templates are currently selected.
  $('.import_con_list').change ->
    if $(this).find('option:selected').length > 0
      $('.import_final_btn').removeAttr 'disabled'
    else
      $('.import_final_btn').attr 'disabled', 'disabled'
  # Deselect all of the templates in the list.
  $('.import_deselect_all_btn').click ->
    $('.import_con_list option').removeAttr('selected').parent().focus()
    $('.import_final_btn').attr 'disabled', 'disabled'
  # Read the contents of the loaded file in to the text area and perform simple
  # error handling.
  $('.import_file_btn').change (event) ->
    file   = event.target.files[0]
    reader = new FileReader()
    reader.onerror = fileErrorHandler (message) ->
      log.error message
      $('.import_error').find('span').text(message).end().show()
    reader.onload = (evt) ->
      result = evt.target.result
      log.debug 'Following contents were read from the file...', result
      $('.import_error').find('span').html('&nbsp;').end().hide()
      $('.import_content').val result
    reader.readAsText file
  # Finalize the import process.
  $('.import_final_btn').click ->
    $this = $ this
    list  = $this.parents('.import_con_stage2').find '.import_con_list'
    list.find('option:selected').each ->
      opt         = $ this
      existingOpt = templates.find "option[value='#{opt.val()}']"
      opt.removeAttr 'selected'
      if existingOpt.length is 0
        templates.append opt
      else
        existingOpt.replaceWith opt
    $('#import_con').modal 'hide'
    updateToolbarTemplates()
    templates.focus()
    saveTemplates yes
    if data?
      analytics.track 'Templates', 'Imported', data.version,
        data.templates.length
  # Cancel the import process.
  $('.import_no_btn, .import_close_btn').click -> $('#import_con').modal 'hide'
  # Paste the contents of the system clipboard in to the text area.
  $('.import_paste_btn').click ->
    $this = $ this
    $('.import_file_btn').val ''
    $('.import_content').val ext.paste()
    $this.text i18n.get 'opt_import_wizard_paste_alt_button'
    $this.delay 800
    $this.queue ->
      $this.text i18n.get 'opt_import_wizard_paste_button'
      $this.dequeue()
  # Select all of the templates in the list.
  $('.import_select_all_btn').click ->
    $('.import_con_list option').attr('selected', 'selected').parent().focus()
    $('.import_final_btn').removeAttr 'disabled'
  # Read the imported data and attempt to extract any valid templates and list
  # the changes to user for them to check and finalize.
  $('.import_yes_btn').click ->
    $this = $(this).attr 'disabled', 'disabled'
    list  = $ '.import_con_list'
    str   = $this.parents('.import_con_stage1').find('.import_content').val()
    $('.import_error').find('span').html('&nbsp;').end().hide()
    try
      importData = createImport str
    catch error
      log.error error
      $('.import_error').find('span').text(error).end().show()
    if importData
      data = readImport importData
      if data.templates.length is 0
        $('.import_con_stage3').show()
        $('.import_con_stage1, .import_con_stage2').hide()
      else
        list.find('option').remove()
        $('.import_count').text data.templates.length
        list.append loadTemplate template for template in data.templates
        $('.import_final_btn').attr 'disabled', 'disabled'
        $('.import_con_stage2').show()
        $('.import_con_stage1, .import_con_stage3').hide()
    $this.removeAttr 'disabled'

# TODO: Comment
loadTemplateRows = (templates = ext.templates) ->
  log.trace()
  templatesNew = $ '#templatesNew'
  # Start from a clean slate.
  templatesNew.find('tbody tr').remove()
  # Determine keyboard shortcut modifier for current system.
  shortcutModifiers = if ext.isThisPlatform 'mac'
    ext.SHORTCUT_MAC_MODIFIERS
  else
    ext.SHORTCUT_MODIFIERS
  # Create and insert rows representing each template.
  for template in templates
    templatesNew.append loadTemplateNew template, shortcutModifiers
  # TODO: Handle pagination and searching
  activateTooltips templatesNew
  activateDraggables()
  activateModifications()
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

# TODO: Comment
deleteTemplates = (templates) ->
  log.trace()
  keys = []
  list = []
  for template in templates when not template.readOnly
    keys.push template.key
    list.push template
  if keys.length
    keep = ext.queryTemplates (template) ->
      template.key not in keys
    store.set 'templates', keep
    ext.updateTemplates()
    if keys.length > 1
      log.debug "Deleted #{keys.length} templates"
      analytics.track 'Templates', 'Deleted', "Count[#{keys.length}]"
    else
      template = list[0]
      log.debug "Deleted #{template.title} template"
      analytics.track 'Templates', 'Deleted', template.title
    loadTemplateRows()
    updateToolbarTemplates()

# Reorder the templates after a drag and drop *swap* by updating their indices
# and sorting them accordingly.  
# These changes are then persisted and should be reflected throughout the
# extension.
reorderTemplates = (fromIndex, toIndex) ->
  log.trace()
  templates = store.get 'templates'
  if fromIndex? and toIndex?
    templates[fromIndex].index = toIndex
    templates[toIndex].index   = fromIndex
  templates.sort (a, b) -> a.index - b.index
  store.set 'templates', templates
  ext.updateTemplates()

# TODO: Comment
saveTemplate = (template) ->
  # TODO: Add more logging and analytics tracking
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

# Update the settings with the values from the template section of the options
# page.
saveTemplates = (updateUI) ->
  log.trace()
  # Validate all the `option` elements that represent templates.
  errors    = []
  templates = []
  # Update the settings for each template based on their corresponding options.
  $('#templates option').each ->
    $this    = $ this
    template = deriveTemplate $this
    errors   = validateTemplate template, no
    return templates.push template if errors.length is 0
    # Show the user which template failed validation.
    if updateUI
      $this.attr 'selected', 'selected'
      $('#templates').change().focus()
    no
  # Determine whether or not any validation errors were encountered.
  if errors.length is 0
    clearErrors() if updateUI
    # Ensure the data for all changes to templates are persisted.
    store.set 'templates', templates
    ext.updateTemplates()
  else
    showErrors errors if updateUI

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

# Update the specified `option` element that represents a template with the
# values taken from the available input fields.
updateTemplate = (option) ->
  log.trace()
  if option.length
    option.data 'content',  $('#template_content').val()
    option.data 'enabled',  String $('#template_enabled').is ':checked'
    option.data 'image',    $('#template_image option:selected').val()
    option.data 'shortcut', $('#template_shortcut').val().trim().toUpperCase()
    option.text $('#template_title').val().trim()
  log.debug 'Updated the following option with field values...', option
  option

# Update the selection of templates in the toolbar behaviour section to reflect
# those available in the templates section.
updateToolbarTemplates = ->
  log.trace()
  templates               = []
  toolbarKey              = store.get 'toolbar.key'
  toolbarTemplates        = $ '#toolbarKey'
  lastSelectedTemplate    = toolbarTemplates.find 'option:selected'
  lastSelectedTemplateKey = ''
  if lastSelectedTemplate.length
    lastSelectedTemplateKey = lastSelectedTemplate.val()
  toolbarTemplates.find('option').remove()
  $('#templates option').each ->
    $this    = $ this
    template =
      key:      $this.val()
      selected: no
      title:    $this.text()
    if lastSelectedTemplateKey
      template.selected = yes if template.key is lastSelectedTemplateKey
    else if template.key is toolbarKey
      template.selected = yes
    templates.push template
  for template in templates
    option = $ '<option/>',
      text:  template.title
      value: template.key
    option.attr 'selected', 'selected' if template.selected
    toolbarTemplates.append option

# Validation classes
# ------------------

# TODO: Comment
class ValidationError extends utils.Class

  # TODO: Comment
  constructor: (@id, @key) ->
    @className = 'error'

  # TODO: Comment
  hide: ->
    field = $ "##{@id}"
    field.parents('.control-group:first').removeClass @className
    field.parents('.controls:first').find('.help-block').remove()

  # TODO: Comment
  show: ->
    field = $ "##{@id}"
    field.parents('.control-group:first').addClass @className
    field.parents('.controls:first').append $ '<span/>',
      class: 'help-block'
      html:  i18n.get @key

# TODO: Comment
class ValidationWarning extends ValidationError

  # TODO: Comment
  constructor: (@id, @key) ->
    @className = 'warning'

# Validation functions
# --------------------

# Remove all validation errors from the fields.
clearErrors = (selector) ->
  log.trace()
  if selector?
    log.debug "Clearing displayed validation errors for '#{selector}'"
    group = $(selector).parents('.control-group').first()
    group.removeClass('error').find('.controls .error-message').remove()
  else
    log.debug 'Clearing all displayed validation errors'
    $('.control-group.error').removeClass 'error'
    $('.error-message').remove()

# Indicate whether or not the specified `key` is new to this instance of
# Template.
isKeyNew = (key, additionalKeys = []) ->
  log.trace()
  log.debug "Checking if template key '#{key}' is new"
  available = yes
  $('#templates option').each -> available = no if $(this).val() is key
  available and key not in additionalKeys

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

# Display all of the specified `errors` against their corresponding fields.
showErrors = (errors) ->
  log.trace()
  log.debug 'Creating an alert for the following errors...', errors
  for error in errors
    group = $(error.selector).focus().parents('.control-group').first()
    group.addClass('error').find('.controls').append $ '<p/>',
      class: 'error-message help-block'
      html:  error.message

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

# Validate the specified `object` that represents a template and return any
# validation errors that are encountered.
validateTemplate = (object, isNew) ->
  log.trace()
  errors   = []
  template = if $.isPlainObject object then object else deriveTemplate object
  log.debug 'Validating the following template...', template
  # Only validate the key and title of user-defined templates.
  unless template.readOnly
    # Only validate keys of new templates.
    if isNew and not isKeyValid template.key
      errors.push message: i18n.get 'opt_template_key_invalid'
    # Title is missing but is required.
    if template.title.length is 0
      errors.push
        message:  i18n.get 'opt_template_title_invalid'
        selector: '#template_title'
  # Validate whether or not the shortcut is valid.
  if template.shortcut and not isShortcutValid template.shortcut
    errors.push
      message:  i18n.get 'opt_template_shortcut_invalid'
      selector: '#template_shortcut'
  # Indicate whether or not any validation errors were encountered.
  log.debug 'Following validation errors were found...', errors
  errors

# Validate the template information derived from the wizard and return any
# validation errors/warnings that were encountered.
# TODO: Replace `validateTemplate`
validateTemplateNew = ->
  log.trace()
  template = deriveTemplateNew()
  isNew    = not template.key?
  errors   = []
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
  templatesNew = $ '#templatesNew'
  dragSource   = null
  draggables   = templatesNew.find '[draggable]'
  draggables.off 'dragstart dragend dragenter dragover drop'
  draggables.on 'dragstart', (e) ->
    $this      = $ this
    dragSource = this
    templatesNew.removeClass 'table-hover'
    $this.addClass 'dnd-moving'
    $this.find('[data-original-title]').tooltip 'hide'
    e.originalEvent.dataTransfer.effectAllowed = 'move'
    e.originalEvent.dataTransfer.setData 'text/html', $this.html()
  draggables.on 'dragend', (e) ->
    draggables.removeClass 'dnd-moving dnd-over'
    templatesNew.addClass 'table-hover'
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
      activateTooltips templatesNew
      activateModifications()
      activateSelections()
      reorderTemplates $dragSource.index(), $this.index()
    false

# Activate functionality to open template wizard when a row is clicked.  
# The activation is done cleanly, unbinding any associated events that have
# been previously bound.
activateModifications = ->
  log.trace()
  $('#templatesNew tbody tr td:not(:first-child)').off('click').click ->
    activeKey = $(this).parents('tr:first').find(':checkbox').val()
    openWizard ext.queryTemplate (template) -> template.key is activeKey

# Activate select all/one functionality on the templates table.  
# The activation is done cleanly, unbinding any associated events that have
# been previously bound.
activateSelections = ->
  log.trace()
  templatesNew = $ '#templatesNew'
  selectBoxes  = templatesNew.find 'tbody :checkbox'
  selectBoxes.off('change').change ->
    $this       = $ this
    messageKey  = 'opt_select_box'
    messageKey += '_checked' if $this.is ':checked'
    $this.attr 'data-original-title', i18n.get messageKey
    refreshSelectButtons()
  templatesNew.find('thead :checkbox').off('change').change ->
    $this       = $ this
    checked     = $this.is ':checked'
    messageKey  = 'opt_select_all_box'
    messageKey += '_checked' if checked
    $this.attr 'data-original-title', i18n.get messageKey
    selectBoxes.prop 'checked', checked
    refreshSelectButtons()

# Activate tooltip effects, optionally only within a specific context.  
# The activation is done cleanly, unbinding any associated events that have
# been previously bound.
activateTooltips = (selector) ->
  log.trace()
  base = if selector then $ selector else $()
  base.find('[data-original-title]').each ->
    $this = $ this
    $this.tooltip 'destroy'
    $this.attr 'title', $this.attr 'data-original-title'
    $this.removeAttr 'data-original-title'
  base.find('[title]').each ->
    $this     = $ this
    placement = $this.attr 'data-placement'
    placement = if placement? then trimToLower placement else 'top'
    $this.tooltip placement: placement

# Convenient shorthand for setting the current context to `null`.
clearContext = -> setContext null

# Clear the current context and close the template wizard.
closeWizard = ->
  clearContext()
  $('#template_wizard').modal 'hide'

# Create a JSON string to export the templates with the specified `keys`.
createExport = (keys) ->
  log.trace()
  log.debug 'Creating an export string for the following keys...', keys
  data = templates: [], version: ext.version
  for key in keys
    data.templates.push deriveTemplate $ "#templates option[value='#{key}']"
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

# Create a template with the information derived from the specified `option` 
# element.
deriveTemplate = (option) ->
  log.trace()
  log.debug 'Deriving a template from the following option...', option
  if option.length > 0
    template =
      content:  option.data 'content'
      enabled:  option.data('enabled') is 'true'
      image:    option.data 'image'
      index:    option.parent().find('option').index option
      key:      option.val()
      readOnly: option.data('readOnly') is 'true'
      shortcut: option.data 'shortcut'
      title:    option.text()
      usage:    parseInt option.data('usage'), 10
  log.debug 'Following template was derived from the option...', template
  template

# TODO: Comment
# TODO: Replace `deriveTemplate`
deriveTemplateNew = ->
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
    # Temporary workaround for Content Security Policy issues with UserVoice's
    # use of inline JavaScript.  
    # This should be removed if/when it's no longer required.
    uvwDialogClose = $ '#uvw-dialog-close[onclick]'
    uvwDialogClose.live 'hover', ->
      $(this).removeAttr 'onclick'
      uvwDialogClose.die 'hover'
    $(uvwDialogClose.selector.replace('[onclick]', '')).live 'click', (e) ->
      UserVoice.hidePopupWidget()
      e.preventDefault()
    uvTabLabel = $ '#uvTabLabel[href^="javascript:"]'
    uvTabLabel.live 'hover', ->
      $(this).removeAttr 'href'
      uvTabLabel.die 'hover'
    # Continue with normal process of loading Widget.
    window.uvOptions = {}
    uv = document.createElement 'script'
    uv.async = 'async'
    uv.src   = WIDGET_SOURCE
    script = document.getElementsByTagName('script')[0]
    script.parentNode.insertBefore uv, script
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
  $('#templatesNew tbody :checkbox:checked').each ->
    selectedKeys.push $(this).val()
  ext.queryTemplates (template) -> template.key in selectedKeys

# Open the template wizard after optionally setting the current context.
openWizard = (template) ->
  setContext template if arguments.length
  $('#template_wizard').modal 'show'

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
  data = templates: []
  keys = []
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
      if isKeyNew template.key, keys
        # Attempt to create and add the new template.
        template = addImportedTemplate template
        if template
          data.templates.push template
          keys.push template.key
      else
        # Attempt to update the previously imported template.
        for imported, i in data.templates
          if imported.key is template.key
            existing          = updateImportedTemplate template, imported
            data.templates[i] = existing
            break
        unless existing.key
          # Attempt to derive the existing template from the available options.
          existing = deriveTemplate $ "#templates
            option[value='#{template.key}']"
          # Attempt to update the derived template.
          if existing
            existing = updateImportedTemplate template, existing
            data.templates.push existing
            keys.push existing.key
  log.debug 'Following data was derived from that imported...', data
  data

# Update the state of certain buttons depending on whether any select boxes
# have been checked.
refreshSelectButtons = ->
  log.trace()
  selections = $ '#templatesNew tbody :checkbox:checked'
  $('#delete_btn, #export_btn').prop 'disabled', selections.length is 0

# TODO: Comment
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
    $('#donation').submit -> analytics.track 'Footer', 'Clicked', 'Donate'
    # Load the current option values.
    load()
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