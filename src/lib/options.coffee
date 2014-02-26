# [Template](http://template-extension.org)  
# (c) 2013 Alasdair Mercer  
# Freely distributable under the MIT license:  
# <http://template-extension.org/license>

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
# Easily accessible reference to the extension controller as well as it's `Icon` class.
{ext}          = chrome.extension.getBackgroundPage()
{Icon}         = ext
# Indicate whether or not the user feedback feature has been added to the page.
feedbackAdded  = no
# Templates matching the current search query.
searchResults  = null

# Load functions
# --------------

# Bind an event of the specified `type` to the elements included by `selector` that, when
# triggered, modifies the underlying `option` with the value returned by `evaluate`.
bindSaveEvent = (selector, type, option, evaluate, callback) ->
  log.trace()

  $(selector).on type, ->
    $this = $ this
    key   = ''
    value = null

    store.modify option, (data) ->
      key = $this.attr('id').match(new RegExp("^#{option}(\\S*)"))[1]
      key = key[0].toLowerCase() + key[1..]

      data[key] = value = evaluate.call $this, key

    callback? $this, key, value

# Update the options page with the values from the current settings.
load = ->
  log.trace()

  links     = store.get 'links'
  markdown  = store.get 'markdown'
  menu      = store.get 'menu'
  shortcuts = store.get 'shortcuts'

  $('#analytics').prop        'checked', store.get 'analytics'
  $('#linksTarget').prop      'checked', links.target
  $('#linksTitle').prop       'checked', links.title
  $('#markdownInline').prop   'checked', markdown.inline
  $('#menuEnabled').prop      'checked', menu.enabled
  $('#menuOptions').prop      'checked', menu.options
  $('#menuPaste').prop        'checked', menu.paste
  $('#shortcutsEnabled').prop 'checked', shortcuts.enabled
  $('#shortcutsPaste').prop   'checked', shortcuts.paste

  do loadControlEvents
  do loadSaveEvents
  do loadImages
  do loadTemplates
  do loadNotifications
  do loadToolbar
  do loadUrlShorteners
  do loadDeveloperTools

# Bind the event handlers required for controlling general changes.
loadControlEvents = ->
  log.trace()

  $('#menuEnabled').on('change', ->
    groups = $('#menuOptions').parents('.control-group').first()
    groups = groups.add $('#menuPaste').parents('.control-group').first()

    if $(this).is ':checked' then groups.slideDown() else groups.slideUp()
  ).trigger 'change'

  $('#shortcutsEnabled').on('change', ->
    groups = $('#shortcutsPaste').parents('.control-group').first()

    if $(this).is ':checked' then groups.slideDown() else groups.slideUp()
  ).trigger 'change'

# Update the developer tools section of the options page with the current settings.
loadDeveloperTools = ->
  log.trace()

  do loadLogger

# Create an `option` element for each available template image.  
# Each element is inserted in to the `select` element containing template images on the options
# page.
loadImages = ->
  log.trace()

  images = $ '#template_image'

  # Add an option for when no icon is to be associated with the template.
  images.append $ '<option/>',
    text:  new Icon().message
    value: ''

  images.append $ '<option/>',
    disabled: 'disabled'
    text:     '---------------'

  # Add options for each of the available template images.
  for icon in ext.config.icons.current
    images.append $ '<option/>',
      text:  icon.message
      value: icon.name

  # Update the icon preview initially and whenever the user changes the selection.
  images.on('change', ->
    selectedIcon = Icon.get $(this).find('option:selected').val(), yes

    $('#template_image_preview').attr 'class', selectedIcon.style
  ).trigger 'change'

# Update the logging section of the options page with the current settings.
loadLogger = ->
  log.trace()

  logger = store.get 'logger'
  $('#loggerEnabled').prop 'checked', logger.enabled
  loggerLevel = $ '#loggerLevel'
  loggerLevel.find('option').remove()

  # Add options for each of the available levels of logging.
  for level in log.LEVELS
    option = $ '<option/>',
      text:  i18n.get "opt_logger_level_#{level.name}_text"
      value: level.value
    option.prop 'selected', level.value is logger.level
    loggerLevel.append option

  # Ensure debug level is selected if configuration currently matches none.
  unless loggerLevel.find('option[selected]').length
    loggerLevel.find("option[value='#{log.DEBUG}']").prop 'selected', yes

  do loadLoggerSaveEvents

# Bind the event handlers required for persisting logging changes.
loadLoggerSaveEvents = ->
  log.trace()

  bindSaveEvent '#loggerEnabled, #loggerLevel', 'change', 'logger', (key) ->
    value = if key is 'level' then @val() else @is ':checked'

    log.debug "Changing logging #{key} to '#{value}'"

    value
  , (jel, key, value) ->
    chrome.extension.getBackgroundPage().log.config = log.config = store.get 'logger'

    analytics.track 'Logging', 'Changed', utils.capitalize(key), Number value

# Update the notification section of the options page with the current settings.
loadNotifications = ->
  log.trace()

  {enabled} = store.get 'notifications'

  $('#notifications').prop 'checked', enabled

  do loadNotificationSaveEvents

# Bind the event handlers required for persisting notification changes.
loadNotificationSaveEvents = ->
  log.trace()

  $('#notifications').on 'change', ->
    enabled = $(this).is ':checked'

    log.debug "Changing notifications to '#{enabled}'"

    store.modify 'notifications', (notifications) ->
      notifications.enabled = enabled

      analytics.track 'Notifications', 'Changed', 'Enabled', Number enabled

# Bind the event handlers required for persisting general changes.
loadSaveEvents = ->
  log.trace()

  $('#analytics').on 'change', ->
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

  bindSaveEvent '#linksTarget, #linksTitle', 'change', 'links', (key) ->
    value = @is ':checked'

    log.debug "Changing links #{key} to '#{value}'"

    value
  , (jel, key, value) ->
    analytics.track 'Links', 'Changed', utils.capitalize(key), Number value

  bindSaveEvent '#markdownInline', 'change', 'markdown', (key) ->
    value = @is ':checked'

    log.debug "Changing markdown #{key} to '#{value}'"

    value
  , (jel, key, value) ->
    analytics.track 'Markdown', 'Changed', utils.capitalize(key), Number value

  bindSaveEvent '#menuEnabled, #menuOptions, #menuPaste', 'change', 'menu', (key) ->
    value = @is ':checked'

    log.debug "Changing context menu #{key} to '#{value}'"

    value
  , (jel, key, value) ->
    ext.updateContextMenu()

    analytics.track 'Context Menu', 'Changed', utils.capitalize(key), Number value

  bindSaveEvent '#shortcutsEnabled, #shortcutsPaste', 'change', 'shortcuts', (key) ->
    value = @is ':checked'

    log.debug "Changing keyboard shortcuts #{key} to '#{value}'"

    value
  , (jel, key, value) ->
    analytics.track 'Keyboard Shortcuts', 'Changed', utils.capitalize(key), Number value

# Update the templates section of the options page with the current settings.
loadTemplates = ->
  log.trace()

  # Load all of the event handlers required for managing the templates.
  do loadTemplateControlEvents
  do loadTemplateImportEvents
  do loadTemplateExportEvents
  # Load the template data into the table.
  do loadTemplateRows

# Create a `tr` element representing the `template` provided.  
# The element returned should then be inserted in to the table that is displaying the templates.
loadTemplate = (template, modifiers) ->
  log.trace()

  modifiers ?= ext.modifiers()

  log.debug 'Creating a row for the following template...', template

  row         = $ '<tr/>', draggable: yes
  alignCenter = css: 'text-align': 'center'

  # Add a column containing a checkbox allowing the user to select multiple templates for bulk
  # operations.
  row.append $('<td/>', alignCenter).append $ '<input/>',
    title: i18n.get 'opt_select_box'
    type:  'checkbox'
    value: template.key

  # Add a column to display the key details to allow the user to easily identify the template.
  row.append $('<td/>').append $ '<span/>',
    html:  """<i class="#{Icon.get(template.image, yes).style}"></i> #{template.title}"""
    title: i18n.get 'opt_template_modify_title', template.title

  # Add a column to indicate the keyboard shortcut, if specified.
  row.append $ '<td/>',
    html: if template.shortcut then "#{modifiers}#{template.shortcut}" else '&nbsp;'

  # Add a column to clearly indicate whether the template is enabled.
  row.append $('<td/>', alignCenter).append $ '<i/>',
    class: "icon-#{if template.enabled then 'ok' else 'remove'}"

  # Add a column containing the template content which will be truncated if they overflow. Hovering
  # over the content will display the full version in within a tooltip.
  row.append $('<td/>').append $ '<span/>',
    text:  template.content
    title: template.content

  # Finally, add a column to provide visual clues that drag & drop functionality is available for
  # reordering the templates.
  row.append $('<td/>').append $ '<span/>',
    class: 'muted'
    text:  '::::'
    title: i18n.get 'opt_template_move_title', template.title

# Bind the event handlers required for controlling the templates.
loadTemplateControlEvents = ->
  log.trace()

  # Ensure saved templates are properly validated before being persisted.
  validationErrors = []

  # Ensure template wizard is closed if/when tabify links are clicked within it.
  $('#template_wizard [tabify], #template_cancel_btn').on 'click', ->
    do closeWizard
  $('#template_reset_btn').on 'click', ->
    error.hide() for error in validationErrors

    do resetWizard

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

  # Ensure that the *best* default limit is selected initially.
  store.init 'options_limit', parseInt $('#template_filter').val()
  limit = store.get 'options_limit'
  $('#template_filter option').each ->
    $this = $ this
    $this.prop 'selected', limit is parseInt $this.val()

  # Update the visible templates whenever the display limit is changed.
  $('#template_filter').on 'change', ->
    store.set 'options_limit', parseInt $(this).val()
    loadTemplateRows searchResults ? ext.templates

  # Reset the filtered templates and the search input when the reset button is clicked.
  $('#template_search :reset').on 'click', ->
    $('#template_search :text').val ''
    do searchTemplates

  # Search for all of the templates that *match* the input query.
  $('#template_controls').on 'submit', ->
    searchTemplates $('#template_search :text').val()

  # Ensure user confirms deletion of template.
  $('#template_delete_btn').on 'click', ->
    $this = $ this

    return if $this.hasClass 'disabled'

    $this.hide()
    $('#template_confirm_delete').css 'display', 'inline-block'

  $('#template_undo_delete_btn').on 'click', ->
    $('#template_confirm_delete').hide()
    $('#template_delete_btn').show()

  $('#template_confirm_delete_btn').on 'click', ->
    $('#template_confirm_delete').hide()
    $('#template_delete_btn').show()
    deleteTemplates [activeTemplate]
    do closeWizard

  # Clear all existing validation errors when the wizard is closed.
  $('#template_wizard').on 'hide', ->
    error.hide() for error in validationErrors

  # Validate and persist the template data when the save button is clicked.
  $('#template_save_btn').on 'click', ->
    # Derive the template data from the input fields.
    template = do deriveTemplate

    # Clear all existing validation errors before validating the derived template data.
    error.hide() for error in validationErrors
    validationErrors = validateTemplate template

    if validationErrors.length
      # Show all validation errors that were found.
      error.show() for error in validationErrors
    else
      # Update the *active* template with the derived data before persisting it in `localStorage`.
      saveTemplate $.extend activeTemplate, template

      # Ensure any search criteria is cleared before closing the wizard and updating the templates
      # displayed in the table.
      $('#template_search :reset').hide()
      $('#template_search :text').val ''
      do closeWizard

  # Enable/disable all selected templates when the corresponding buttons are clicked.
  $('#disable_btn, #enable_btn').on 'click', ->
    $this = $ this

    return if $this.hasClass 'disabled'

    enableTemplates do getSelectedTemplates, $this.is '#enable_btn'

  # Open the template wizard without any context when creating a new template.
  $('#add_btn').on 'click', ->
    return if $(this).hasClass 'disabled'

    openWizard null

  # Ensure confirmation is granted before deleting any templates and that no predefined templates
  # are deleted at all.
  selectedTemplates = []

  # Clear all selected templates from memory when the wizard is closed.
  $('#delete_wizard').on 'hide', ->
    selectedTemplates = []
    $('#delete_items li').remove()

  # Ensure that only a single deletion warning can be displayed at any one time.
  warningMsg = null

  # Prompt the user to confirm removal of the selected template(s).
  $('#delete_btn').on 'click', ->
    return if $(this).hasClass 'disabled'

    warningMsg?.hide()

    deleteItems         = $ '#delete_items'
    predefinedTemplates = $ '<ul/>'
    selectedTemplates   = do getSelectedTemplates

    deleteItems.find('li').remove()

    # Create list items for each selected template and allocate them accordingly.
    for template in selectedTemplates
      list = if template.readOnly then predefinedTemplates else deleteItems
      list.append $ '<li/>', text: template.title

    predefinedCount = predefinedTemplates.find('li').length
    if predefinedCount
      # Show warning message to inform the user that they have attempted to delete predefined
      # template(s).
      div = $ '<div/>'

      if predefinedCount is 1
        div.append $ '<p/>', html: i18n.get 'opt_template_delete_predefined_error_1'
        div.append predefinedTemplates
        div.append $ '<p/>', html: i18n.get 'opt_template_delete_predefined_error_2'
      else
        div.append $ '<p/>', html: i18n.get 'opt_template_delete_multiple_predefined_error_1'
        div.append predefinedTemplates
        div.append $ '<p/>', html: i18n.get 'opt_template_delete_multiple_predefined_error_2'

      warningMsg = new WarningMessage yes
      warningMsg.message = div.html()
      warningMsg.show()
    else if selectedTemplates.length
      # Begin the removal process by showing the wizard.
      $('#delete_wizard').modal 'show'

  # Cancel the template removal process and hide the wizard.
  $('#delete_cancel_btn, #delete_no_btn').on 'click', ->
    $('#delete_wizard').modal 'hide'

  # Complete the template removal process and hide the wizard.
  $('#delete_yes_btn').on 'click', ->
    deleteTemplates selectedTemplates

    $('#delete_wizard').modal 'hide'

# Bind the event handlers required for exporting templates.
loadTemplateExportEvents = ->
  log.trace()

  # Simulate an alert closing without actually removing it from the DOM.
  $('#export_error .close').on 'click', ->
    $(this).next().html('&nbsp').parent().hide()

  # Ensure that the export wizard cleans up after itself when it's closed.
  $('#export_wizard').on 'hide', ->
    $('#export_content').val ''
    $('#export_save_btn').attr 'href', '#'
    $('#export_error').find('span').html('&nbsp;').end().hide()

  # Show the export wizard and create the exported data based on the selected templates.
  $('#export_btn').on 'click', ->
    return if $(this).hasClass 'disabled'

    selectedTemplates = do getSelectedTemplates

    if selectedTemplates.length
      log.info 'Launching export wizard'

      str  = createExport selectedTemplates
      $('#export_content').val str

      blob = new Blob [str], type: 'application/json'
      URL  = window.URL or window.webkitURL
      $('#export_save_btn').attr 'href', URL.createObjectURL blob

      $('#export_wizard').modal 'show'

  # Cancel the export process and hide the wizard.
  $('#export_close_btn').on 'click', ->
    $('#export_wizard').modal 'hide'

  # Copy the JSON string into the system clipboard.
  $('#export_copy_btn').on 'click', ->
    ext.copy $('#export_content').val(), yes

    # Briefly change the copy button's text to indicate that the contents were copied.
    $(this).text(i18n.get 'opt_export_wizard_copy_alt_button').delay(800).queue ->
      $(this).text(i18n.get 'opt_export_wizard_copy_button').dequeue()

# Bind the event handlers required for importing templates.
loadTemplateImportEvents = ->
  log.trace()

  data = null

  # Simulate an alert closing without actually removing it from the DOM.
  $('#import_error .close').on 'click', ->
    $(this).next().html('&nbsp').parent().hide()

  # Ensure that the export wizard cleans up after itself when it's closed.
  $('#import_wizard').on 'hide', ->
    data = null
    $('#import_final_btn').prop 'disabled', yes
    $('#import_wizard_stage2, #import_back_btn, #import_final_btn').hide()
    $('#import_wizard_stage1, #import_continue_btn').show()
    $('#import_content, #import_file_btn').val ''
    $('#import_file_btn').val ''
    $('#import_error').find('span').html('&nbsp;').end().hide()

  # Restore the previous view in the import process when the back button is clicked.
  $('#import_back_btn').on 'click', ->
    log.info 'Going back to previous import stage'

    $('#import_wizard_stage2, #import_back_btn, #import_final_btn').hide()
    $('#import_wizard_stage1, #import_continue_btn').show()

  # Show the import wizard to prompt the user to input/load the data to be imported.
  $('#import_btn').on 'click', ->
    return if $(this).hasClass 'disabled'

    log.info 'Launching import wizard'

    $('#import_wizard').modal 'show'

  # Enable/disable the finalize button depending on whether any templates are currently selected.
  $('#import_items').on 'change', ->
    $('#import_final_btn').prop 'disabled', not $(this).find(':selected').length

  # Select all of the detected templates in the list.
  $('#import_select_all_btn').on 'click', ->
    $('#import_items option').prop('selected', yes).parent().focus()
    $('#import_final_btn').prop 'disabled', no

  # Deselect all of the detected templates in the list.
  $('#import_deselect_all_btn').on 'click', ->
    $('#import_items option').prop('selected', no).parent().focus()
    $('#import_final_btn').prop 'disabled', yes

  # Read the contents of the loaded file in to the text area and perform simple error handling.
  $('#import_file_btn').on 'change', (e) ->
    file   = e.target.files[0]
    reader = new FileReader()

    # Gracefully handle any file system errors that occur.
    reader.onerror = (err) ->
      message = i18n.get switch err.code
        when FileError.NOT_FOUND_ERR then 'error_file_not_found'
        when FileError.ABORT_ERR then 'error_file_aborted'
        else 'error_file_default'

      log.warn 'The following error was caught when loading the imported file...', err

      $('#import_error').find('span').text(message).end().show()

    # Load the contents of the file and insert them into the text area.
    reader.onload = (e) ->
      result = e.target.result

      log.debug 'The following contents were read from the file...', result

      $('#import_error').find('span').html('&nbsp;').end().hide()
      $('#import_content').val result

    # Read the file safely as plain text and allow the event handlers to do the rest of the work.
    reader.readAsText file

  # Complete the import process once the data has been successfully imported.
  $('#import_final_btn').on 'click', ->
    return unless data?

    # Merge all selected imported templates into the existing templates.
    for template in data.templates
      continue unless $("#import_items option[value='#{template.key}']").is ':selected'

      matched = no

      for existing, index in ext.templates when existing.key is template.key
        matched              = yes
        template.index       = index
        ext.templates[index] = template

      unless matched
        template.index = ext.templates.length
        ext.templates.push template

    store.set 'templates', ext.templates
    ext.updateTemplates()
    do loadTemplateRows
    do updateToolbarTemplates

    analytics.track 'Templates', 'Imported', data.version, data.templates.length

    # Ensure any search criteria is cleared before closing the wizard.
    $('#import_wizard').modal 'hide'
    $('#template_search :reset').hide()
    $('#template_search :text').val ''

  # Cancel the import process and hide the wizard.
  $('#import_close_btn').on 'click', ->
    $('#import_wizard').modal 'hide'

  # Paste the contents of the system clipboard in to the textarea.
  $('#import_paste_btn').on 'click', ->
    $('#import_file_btn').val ''
    $('#import_content').val ext.paste()

    $(this).text(i18n.get 'opt_import_wizard_paste_alt_button').delay(800).queue ->
      $(this).text(i18n.get 'opt_import_wizard_paste_button').dequeue()

  # Read the imported data and attempt to extract any valid templates and list the changes to user
  # for them to check and finalize.
  $('#import_continue_btn').on 'click', ->
    $this = $(this).prop 'disabled', yes
    data  = null
    list  = $ '#import_items'
    str   = $('#import_content').val()

    $('#import_error').find('span').html('&nbsp;').end().hide()
    list.find('option').remove()

    try
      # Attempt to parse and read the imported contents.
      data = readImport createImport str

      if data.templates.length
        $('#import_count').text data.templates.length

        for template in data.templates
          list.append $ '<option/>',
            text:  template.title
            value: template.key

        # Show the final stage of the import wizard and allow the user to select which, if any,
        # detected templates they would like to import.
        $('#import_final_btn').prop 'disabled', yes
        $('#import_wizard_stage1, #import_continue_btn').hide()
        $('#import_wizard_stage2, #import_back_btn, #import_final_btn').show()
    catch error
      log.warn 'The following error occurred when parsing the imported data', error

      $('#import_error').find('span').text(error).end().show()

    $this.prop 'disabled', no

# Load the `templates` into the table to be displayed to the user.  
# Optionally, pagination can be disabled but this should only really be used internally by the
# pagination process.
loadTemplateRows = (templates = ext.templates, pagination = yes) ->
  log.trace()

  table = $ '#templates'

  # Best to start from a clean slate so remove all existing rows.
  table.find('tbody tr').remove()

  if templates.length
    # Retrieve the keyboard shortcut modifier(s) for current operating system once for a slight
    # performance boost.
    modifiers = ext.modifiers()

    # Create and insert rows representing each template.
    table.append loadTemplate template, modifiers for template in templates

    # Apply pagination and other UI fanciness to the populated table and it's new rows.
    paginate templates if pagination
    activateTooltips table
    do activateDraggables
    do activateModifications
  else
    # Show a single row to indicate that no templates were found.
    table.find('tbody').append $('<tr/>').append $ '<td/>',
      colspan: table.find('thead th').length
      html:    i18n.get 'opt_no_templates_found_text'

  # Uncheck the "Select All" checkbox before (re-)binding the click events for all "Select"
  # checkboxes.
  table.find('thead :checkbox').prop 'checked', no

  do activateSelections

# Update the toolbar behaviour section of the options page with the current settings.
loadToolbar = ->
  log.trace()

  {close, popup, options} = store.get 'toolbar'

  if popup then $('#toolbarPopupYes').addClass 'active'
  else          $('#toolbarPopupNo').addClass  'active'

  $('#toolbarClose').prop   'checked', close
  $('#toolbarOptions').prop 'checked', options

  do updateToolbarTemplates
  do loadToolbarControlEvents
  do loadToolbarSaveEvents

# Bind the event handlers required for controlling toolbar behaviour changes.
loadToolbarControlEvents = ->
  log.trace()

  # Bind a click event to listen for changes to the button selection.
  $('#toolbarPopup .btn').on('click', ->
    $(".#{$(this).attr 'id'}").show().siblings().hide()
  ).filter('.active').trigger 'click'

# Bind the event handlers required for persisting toolbar behaviour changes.
loadToolbarSaveEvents = ->
  log.trace()

  $('#toolbarPopup .btn').on 'click', ->
    popup = not $('#toolbarPopupYes').hasClass 'active'

    store.modify 'toolbar', (toolbar) -> toolbar.popup = popup
    ext.updateToolbar()

    log.debug "Toolbar popup enabled: #{popup}"
    analytics.track 'Toolbars', 'Changed', 'Behaviour', Number popup

  bindSaveEvent '#toolbarClose, #toolbarKey, #toolbarOptions', 'change', 'toolbar', (key) ->
    value = if key is 'key' then @val() else @is ':checked'

    log.debug "Changing toolbar #{key} to '#{value}'"

    value
  , (jel, key, value) ->
    ext.updateToolbar()

    analytics.track 'Toolbars', 'Change', utils.capitalize(key), if key is 'key' then Number value

# Update the URL shorteners section of the options page with the current settings.
loadUrlShorteners = ->
  log.trace()

  # Ensure that the active URL shortener service is checked.
  $('input[name="enabled_shortener"]').each ->
    $this = $ this
    $this.prop 'checked', store.get "#{$this.attr 'id'}.enabled"
    # Return `true` to break the iteration.
    true

  # YOURLS settings require special preparation since they're unique.
  yourls = store.get 'yourls'
  $('#yourlsAuthentication' + (switch yourls.authentication
    when 'advanced' then 'Advanced'
    when 'basic'    then 'Basic'
    else 'None'
  )).addClass 'active'

  $('#yourlsPassword').val  yourls.password
  $('#yourlsSignature').val yourls.signature
  $('#yourlsUrl').val       yourls.url
  $('#yourlsUsername').val  yourls.username

  do loadUrlShortenerAccounts
  do loadUrlShortenerControlEvents
  do loadUrlShortenerSaveEvents

# Update the accounts in the URL shorteners section of the options pages with current state of
# their OAuth objects.
loadUrlShortenerAccounts = ->
  log.trace()

  # Retrieve all URL shortener services that use OAuth and iterate over the results.
  shorteners = _.filter ext.shorteners, (shortener) ->
    shortener.oauth?

  for shortener in shorteners
    do (shortener) ->
      button = $ "##{shortener.name}Account"

      # Bind the event handler required for logging in and out of accounts and then reflect the
      # current login state in the button.
      button.on 'click', ->
        $this = $(this).blur()

        if $this.data('oauth') isnt 'true'
          # Application isn't yet authorized to use the service on the user's behalf, so the user
          # must want to do this now. Good for them!
          $this.tooltip 'hide'

          log.debug "Attempting to authorize #{shortener.name}"

          # Attempt to authorize this application with the service on behalf of the user.  
          # This steps asynchronous as it may require user confirmation (i.e. open a new tab and
          # redirect them to the OAuth permissions page - after authenticating themselves).
          shortener.oauth.authorize ->
            log.debug "Authorization response for #{shortener.name}...", arguments

            success = shortener.oauth.hasAccessToken()

            if success
              # This application has been successfully authorized so we'll update the button to
              # reflect this new state.
              $this.addClass('btn-danger').removeClass 'btn-success'
              $this.data 'oauth', 'true'
              $this.html i18n.get 'opt_url_shortener_logout_button'

            analytics.track 'Shorteners', 'Login', shortener.title, Number success
        else
          # Since this application is already authorized to use the service the user must want to
          # undo this, on this end at least.
          log.debug "Removing authorization for #{shortener.name}"

          shortener.oauth.clearAccessToken()

          # bitly requires some extra clearing.
          if $this.attr('id') is 'bitlyAccount'
            shortener.oauth.clear 'apiKey'
            shortener.oauth.clear 'login'

          # Update the button to show that the user has *logged out* of the service.
          $this.addClass('btn-success').removeClass 'btn-danger'
          $this.data 'oauth', 'false'
          $this.html i18n.get 'opt_url_shortener_login_button'

          analytics.track 'Shorteners', 'Logout', shortener.title

      # Apply a visual indication of the service's current authentication state to the button.
      if shortener.oauth.hasAccessToken()
        button.addClass('btn-danger').removeClass 'btn-success'
        button.data 'oauth', 'true'
        button.html i18n.get 'opt_url_shortener_logout_button'
      else
        button.addClass('btn-success').removeClass 'btn-danger'
        button.data 'oauth', 'false'
        button.html i18n.get 'opt_url_shortener_login_button'

# Bind the event handlers required for controlling URL shortener configuration changes.
loadUrlShortenerControlEvents = ->
  log.trace()

  # Bind a click event to listen for changes to the button selection.
  $('#yourlsAuthentication button').on('click', ->
    $(".#{$(this).attr 'id'}").show().siblings().hide()
  ).filter('.active').trigger 'click'

# Bind the event handlers required for persisting URL shortener configuration changes.
loadUrlShortenerSaveEvents = ->
  log.trace()

  # Update each URL shortener whenever the user switches between them.
  $('input[name="enabled_shortener"]').on 'change', ->
    store.modify 'bitly', 'googl', 'yourls', (data, key) ->
      enabled = data.enabled = $("##{key}").is ':checked'

      if enabled
        shortener = _.findWhere ext.shorteners, name: key

        log.debug "Enabling #{shortener.title} URL shortener"

        analytics.track 'Shorteners', 'Enabled', shortener.title

  # Update the YOURLS authentication mechanism when the user switches modes.
  $('#yourlsAuthentication button').on 'click', ->
    $this = $ this
    auth  = $this.attr('id').match(/yourlsAuthentication(.*)/)[1]

    store.modify 'yourls', (yourls) ->
      yourls.authentication = if auth is 'None' then '' else auth.toLowerCase()

    log.debug "YOURLS authentication changed: #{auth}"
    analytics.track 'Shorteners', 'Changed', 'YOURLS Authentication', $this.index()

  # All YOURLS fields should be trimmed before being persisted when changed.
  yourlsFields = '#yourlsPassword, #yourlsSignature, #yourlsUrl, #yourlsUsername'
  bindSaveEvent yourlsFields, 'input', 'yourls', ->
    @val().trim()

# Save functions
# --------------

# Delete all of the `templates` provided.
deleteTemplates = (templates) ->
  log.trace()

  keys = []
  list = []

  # Ensure that no predefined templates are removed.
  for template in templates when not template.readOnly
    keys.push template.key
    list.push template

  # No user-created templates were provided so go no further.
  return unless keys.length

  retain = []

  # Retain only templates whose keys have not been specified for removal.
  for template, i in ext.templates when template.key not in keys
    template.index = retain.length
    retain.push template

  store.set 'templates', retain
  ext.updateTemplates()

  if keys.length > 1
    log.debug "Deleted #{keys.length} templates"
    analytics.track 'Templates', 'Deleted', "Count[#{keys.length}]"
  else
    template = list[0]
    log.debug "Deleted #{template.title} template"
    analytics.track 'Templates', 'Deleted', template.title

  loadTemplateRows searchResults ? ext.templates
  do updateToolbarTemplates

# Enable/disable all of the `templates` provided.
enableTemplates = (templates, enable = yes) ->
  log.trace()

  keys = _.pluck templates, 'key'

  # No templates were provided so we can stop here.
  return unless keys.length

  # Enable/disable only templates whose keys were specified.
  template.enabled = enable for template in ext.templates when template.key in keys

  store.set 'templates', ext.templates
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

# Reorder the templates after a drag and drop *swap* by updating their indices and sorting them
# accordingly.  
# These changes are then persisted and should be reflected throughout the extension.
reorderTemplates = (fromIndex, toIndex) ->
  log.trace()

  if fromIndex? and toIndex?
    ext.templates[fromIndex].index = toIndex
    ext.templates[toIndex].index   = fromIndex

  store.set 'templates', ext.templates
  ext.updateTemplates()
  do updateToolbarTemplates

# Update and persist the `template` provided.  
# Any required validation should be performed perior to calling this method.
saveTemplate = (template) ->
  log.trace()

  log.debug 'Saving the following template...', template

  isNew     = not template.key?
  templates = store.get 'templates'

  if isNew
    # Simply add new templates to the end.
    template.index = templates.length
    template.key   = utils.keyGen()
    templates.push template
  else
    # Replace the existing template with the same key as the updated template.
    for temp, i in templates when temp.key is template.key
      templates[i] = template
      break

  store.set 'templates', templates
  ext.updateTemplates()
  do loadTemplateRows
  do updateToolbarTemplates

  action = if isNew then 'Added' else 'Saved'
  analytics.track 'Templates', action, template.title

  template

# Update the existing template with information extracted from the imported template provided.  
# `template` should not be altered in any way and the properties of `existing` should only be
# changed if the replacement values are valid.  
# Protected properties will only be updated if `existing` is not read-only and the replacement
# value is valid.
updateImportedTemplate = (template, existing) ->
  log.trace()

  log.debug 'Updating an existing template with the following imported data...', template

  existing.enabled = template.enabled
  existing.usage   = template.usage

  # Ensure that certain fields of read-only templates are protected.
  unless existing.readOnly
    existing.content = template.content
    # Only allow valid titles.
    existing.title   = template.title if 0 < template.title.length <= 32

  # Only allow existing images or *None*.
  if template.image is '' or Icon.exists template.image
    existing.image = template.image

  # Only allow valid keyboard shortcuts or *empty*.
  if template.shortcut is '' or isShortcutValid template.shortcut
    existing.shortcut = template.shortcut

  log.debug 'Updated the following template...', existing

  existing

# Update the selection of templates in the toolbar behaviour section to reflect those available in
# the templates section.
updateToolbarTemplates = ->
  log.trace()

  toolbarKey              = store.get 'toolbar.key'
  toolbarTemplates        = $ '#toolbarKey'
  lastSelectedTemplate    = toolbarTemplates.find 'option:selected'
  lastSelectedTemplateKey = if lastSelectedTemplate.length then lastSelectedTemplate.val() else ''

  toolbarTemplates.find('option').remove()

  for template in ext.templates
    opt = $ '<option/>',
      text:  template.title
      value: template.key
    opt.prop 'selected', template.key in [lastSelectedTemplateKey, toolbarKey]
    toolbarTemplates.append opt

# Validation classes
# ------------------

# `ValidationError` allows easy management and display of validation error messages that are
# associated with specific fields.
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

# `ValidationWarning` allows easy management and display of validation warning messages that are
# associated with specific fields.
class ValidationWarning extends ValidationError

  # Create a new instance of `ValidationWarning`.
  constructor: (@id, @key) ->
    @className = 'warning'

# Validation functions
# --------------------

# Indicate whether or not the specified `key` is valid.
isKeyValid = (key) ->
  log.trace()

  R_VALID_KEY.test key

# Indicate whether or not the specified keyboard `shortcut` is valid for use by a template.
isShortcutValid = (shortcut) ->
  log.trace()

  R_VALID_SHORTCUT.test shortcut

# Indicate whether or not `template` contains the required fields of the correct types.  
# Perform a *soft* validation without validating the values themselves, instead only their
# existence.
validateImportedTemplate = (template) ->
  log.trace()

  log.debug 'Validating property types of the following imported template...', template

  'object'  is typeof template          and
  'string'  is typeof template.content  and
  'boolean' is typeof template.enabled  and
  'string'  is typeof template.image    and
  'string'  is typeof template.key      and
  'string'  is typeof template.shortcut and
  'string'  is typeof template.title    and
  'number'  is typeof template.usage

# Validate the `template` and return any validation errors/warnings that were encountered.  
# Any validation errors that are encountered will be returned as a result.
validateTemplate = (template) ->
  log.trace()

  isNew  = not template.key?
  errors = []

  log.debug 'Validating the following template...', template

  # Title is required for all user-created templates.
  if not template.readOnly and not template.title
    errors.push new ValidationError 'template_title', 'opt_template_title_invalid'

  # Keyboard shortcuts must be valid when used.
  if template.shortcut and not isShortcutValid template.shortcut
    errors.push new ValidationError 'template_shortcut', 'opt_template_shortcut_invalid'

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
  hide: ->
    @alert?.alert 'close'

  # Display this `Message` at the top of the current tab.
  show: ->
    @header  = i18n.get @headerKey  if @headerKey  and not @header?
    @message = i18n.get @messageKey if @messageKey and not @message?

    # Create the alert based on this `Message`.
    @alert = $ '<div/>', class: "alert #{@className}"
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
# `template` is not altered in any way and the new template is only created if `template` has a
# valid key.  
# Other than the key, any invalid fields will not be copied to the new template which will instead
# use the preferred default value for those fields.
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
    newTemplate.image    = template.image    if Icon.exists template.image
    # Only allow valid keyboard shortcuts.
    newTemplate.shortcut = template.shortcut if isShortcutValid template.shortcut
    # Only allow valid titles.
    newTemplate.title    = template.title    if 0 < template.title.length <= 32

  log.debug 'Following template was created...', newTemplate

  newTemplate

# Activate drag and drop functionality for reordering templates.  
# The activation is done cleanly, unbinding any associated events that have been previously bound.
activateDraggables = ->
  log.trace()

  table      = $ '#templates'
  dragSource = null
  draggables = table.find '[draggable]'

  # Remove all previous bound *DnD* events.
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
    dragSource = null

    draggables.removeClass 'dnd-moving dnd-over'
    table.addClass 'table-hover'

  draggables.on 'dragenter', (e) ->
    $this = $ this

    draggables.not($this).removeClass 'dnd-over'
    $this.addClass 'dnd-over'

  draggables.on 'dragover', (e) ->
    e.originalEvent.dataTransfer.dropEffect = 'move'
    e.preventDefault()
    # Return `false` to ensure default behaviour is prevented.
    false

  draggables.on 'drop', (e) ->
    $dragSource = $ dragSource

    e.stopPropagation()

    if dragSource isnt this
      $this = $ this

      $dragSource.html $this.html()
      $this.html e.originalEvent.dataTransfer.getData 'text/html'

      activateTooltips table
      do activateModifications
      do activateSelections

      fromIndex = $dragSource.index()
      toIndex   = $this.index()

      if searchResults?
        fromIndex = searchResults[fromIndex].index
        toIndex   = searchResults[toIndex].index

      reorderTemplates fromIndex, toIndex

    # Return `false` to ensure default behaviour is prevented.
    false

# Activate functionality to open template wizard when a row is clicked.  
# The activation is done cleanly, unbinding any associated events that have been previously bound.
activateModifications = ->
  log.trace()

  $('#templates tbody tr td:not(:first-child)').off('click').on 'click', ->
    key = $(this).parents('tr:first').find(':checkbox').val()

    openWizard _.findWhere ext.templates, {key}

# Activate select all/one functionality on the templates table.  
# The activation is done cleanly, unbinding any associated events that have been previously bound.
activateSelections = ->
  log.trace()

  table       = $ '#templates'
  selectBoxes = table.find 'tbody :checkbox'

  # Refresh bulk operation buttons when individual row select boxes are checked/unchecked.
  selectBoxes.off('change').on 'change', ->
    $this       = $ this
    messageKey  = 'opt_select_box'
    messageKey += '_checked' if $this.is ':checked'
    $this.attr 'data-original-title', i18n.get messageKey

    do refreshSelectButtons

  # Refresh bulk operation buttons when select all boxes are checked/unchecked, while also copying
  # their state to all individual row select boxes.
  table.find('thead :checkbox').off('change').on 'change', ->
    $this       = $ this
    checked     = $this.is ':checked'
    messageKey  = 'opt_select_all_box'
    messageKey += '_checked' if checked
    $this.attr 'data-original-title', i18n.get messageKey

    selectBoxes.prop 'checked', checked
    do refreshSelectButtons

  do refreshSelectButtons

# Activate tooltip effects, optionally only within a specific context.
activateTooltips = (selector) ->
  log.trace()

  base = $ selector or document

  # Reset all previously treated tooltips.
  base.find('[data-original-title]').each ->
    $this = $ this

    $this.tooltip 'destroy'
    $this.attr 'title', $this.attr 'data-original-title'
    $this.removeAttr 'data-original-title'

  # Apply tooltips to all relevant elements.
  base.find('[title]').each ->
    $this     = $ this
    placement = $this.attr 'data-placement'
    placement = if placement? then utils.trimToLower placement else 'top'

    $this.tooltip {container: $this.attr('data-container') ? 'body', placement}

# Convenient shorthand for setting the current context to `null`.
clearContext = ->
  log.trace()

  setContext null

# Clear the current context and close the template wizard.
closeWizard = ->
  log.trace()

  do clearContext

  $('#template_wizard').modal 'hide'

# Create a JSON string to export the specified `templates`.
createExport = (templates) ->
  log.trace()

  log.debug 'Creating an export string for the following templates...', templates

  data =
    templates: templates[..]
    version:   ext.version

  # Remove any temporary context menu ID's from the templates to be exported.
  delete template.menuId for template in data.templates

  if data.templates.length
    analytics.track 'Templates', 'Exported', ext.version, data.templates.length

  log.debug 'Following export data has been created...', data

  JSON.stringify data

# Create a JSON object from the imported string specified.
createImport = (str) ->
  log.trace()

  log.debug 'Parsing the following import string...', str

  try data = JSON.parse str catch error then throw i18n.get 'error_import_data'

  if not _.isArray(data.templates) or _.isEmpty(data.templates) or not _.isString data.version
    throw i18n.get 'error_import_invalid'

  log.debug 'Following data was created from the string...', data

  data

# Create a template based on the current context and the information derived from the wizard
# fields.
deriveTemplate = ->
  log.trace()

  readOnly = activeTemplate.readOnly ? no
  template =
    content:  if readOnly then activeTemplate.content else $('#template_content').val()
    enabled:  $('#template_enabled').is ':checked'
    image:    $('#template_image').val()
    index:    activeTemplate.index ? ext.templates.length
    key:      activeTemplate.key
    readOnly: readOnly
    shortcut: utils.trimToUpper $('#template_shortcut').val()
    title:    if readOnly then activeTemplate.title else $('#template_title').val().trim()
    usage:    activeTemplate.usage ? 0

  log.debug 'Following template was derived...', template

  template

# Add the user feedback feature to the page.
feedback = ->
  log.trace()

  # Only load and configure the feedback widget once.
  return if feedbackAdded

  # Create a script element to load the UserVoice widget.
  uv       = document.createElement 'script'
  uv.async = 'async'
  uv.src   = "https://widget.uservoice.com/#{ext.config.options.userVoice.id}.js"
  # Insert the script element into the DOM.
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

  # Ensure that the widget isn't loaded again.
  feedbackAdded = yes

# Retrieve all currently selected templates.
getSelectedTemplates = ->
  log.trace()

  keys = []
  $('#templates tbody :checkbox:checked').each ->
    keys.push $(this).val()

  _.filter ext.templates, (template) ->
    template.key in keys

# Open the template wizard after optionally setting the current context, if one is specified.
openWizard = (template) ->
  log.trace()

  setContext template if arguments.length

  $('#template_wizard').modal 'show'

# Update the pagination UI for the specified `templates`.
paginate = (templates) ->
  log.trace()

  limit      = parseInt $('#template_filter').val()
  pagination = $ '#pagination'

  if templates.length > limit > 0
    # The results span across multiple pages so we need to show the pagination UI.
    children = pagination.find 'ul li'
    pages    = Math.ceil templates.length / limit

    # Refresh the pagination link states based on the new `page`.
    refreshPagination = (page = 1) ->
      # Select and display the desired templates subset.
      start = limit * (page - 1)
      end   = start + limit
      loadTemplateRows templates[start...end], no

      # Ensure that the *previous* link is only enabled when a previous page exists.
      pagination.find('ul li:first-child').each ->
        if page is 1
          $(this).addClass 'disabled'
        else
          $(this).removeClass 'disabled'

      # Ensure only the active page is highlighted.
      pagination.find('ul li:not(:first-child, :last-child)').each ->
        $this = $ this

        if page is parseInt $this.text()
          $this.addClass 'active'
        else
          $this.removeClass 'active'

      # Ensure that the *next* link is only enabled when a next page exists.
      pagination.find('ul li:last-child').each ->
        $this = $ this
        if page is pages
          $this.addClass 'disabled'
        else
          $this.removeClass 'disabled'

    # Create and insert the pagination links.
    if pages isnt children.length - 2
      children.remove()

      list = pagination.find 'ul'
      list.append $('<li/>').append $ '<a>&laquo;</a>'
      list.append $('<li/>').append $ "<a>#{page}</a>" for page in [1..pages]
      list.append $('<li/>').append $ '<a>&raquo;</a>'

    # Bind event handlers to manage navigating pages.
    pagination.find('ul li').off 'click'
    pagination.find('ul li:first-child').on 'click', ->
      unless $(this).hasClass 'disabled'
        refreshPagination pagination.find('ul li.active').index() - 1

    pagination.find('ul li:not(:first-child, :last-child)').on 'click', ->
      $this = $ this
      refreshPagination $this.index() unless $this.hasClass 'active'

    pagination.find('ul li:last-child').on 'click', ->
      unless $(this).hasClass 'disabled'
        refreshPagination pagination.find('ul li.active').index() + 1

    do refreshPagination
    pagination.show()
  else
    # Hide the pagination and remove all links as the results fit on a single page.
    pagination.hide().find('ul li').remove()

# Read the imported data created by `createImport` and extract all of the imported templates that
# appear to be valid.  
# When overwriting an existing template, only the properties with valid values will be transferred
# with the exception of protected properties (i.e. on read-only templates).  
# When creating a new template, any invalid properties will be replaced with their default values.
readImport = (importData) ->
  log.trace()

  log.debug 'Importing the following data...', importData

  data       = templates: []
  keys       = []
  storedKeys = _.pluck ext.templates, 'key'

  for template in importData.templates
    existing = {}

    if importData.version < '1.0.0'
      # Ensure templates imported from previous versions are valid for v1.0.0+.
      template.key   = ext.getKeyForName template.name
      template.usage = 0
      template.image = if template.image > 0 then Icon.fromLegacy(template.image - 1)?.name or ''
      else ''
    else if importData.version < '1.1.0'
      # Ensure templates imported from previous versions are valid for v1.1.0+.
      template.image = Icon.fromLegacy(template.image)?.name or ''

    if validateImportedTemplate template
      if template.key not in storedKeys and template.key not in keys
        # Template doesn't exist and hasn't already been imported so handle it now.
        template = addImportedTemplate template

        if template
          template.index = storedKeys.length + keys.length
          data.templates.push template
          keys.push           template.key
      else
        # Template has already been imported so let's attempt to update the previously imported
        # template.
        for imported, i in data.templates when imported.key is template.key
          existing          = updateImportedTemplate template, imported
          data.templates[i] = existing
          break

        unless existing.key
          # Couldn't find a previously imported template with that key so user must already have
          # the template stored. Try to locate the stored template and create a clone of it.
          existing = $.extend yes, {}, _.findWhere ext.templates, key: template.key

          # Now attempt to update the derived template.
          if existing and not _.isEmpty existing
            existing = updateImportedTemplate template, existing
            data.templates.push existing
            keys.push           existing.key

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

# Update the state of certain buttons depending on whether any select boxes have been checked.
refreshSelectButtons = ->
  log.trace()

  templates = do getSelectedTemplates

  # Update the visual state of `buttons`.
  updateButton = (buttons, disabled, titleKey) ->
    buttons[if disabled then 'addClass' else 'removeClass'] 'disabled'
    buttons.attr 'data-original-title', i18n.get titleKey

  # Export button can simply be enabled when any templates have been selected.
  updateButton $('#export_btn'), not templates.length, if templates.length
    'opt_export_button_title'
  else
    'opt_template_none_selected_title'

  # Determine whether all selections share the same enabled state and if any are predefined.
  allEnabled    = yes
  allDisabled   = yes
  hasPredefined = no

  for template in templates
    allEnabled    = no  unless template.enabled
    allDisabled   = no  if     template.enabled
    hasPredefined = yes if     template.readOnly

  unless templates.length
    # Doesn't matter as no templates have been selected.
    updateButton $('#disable_btn, #enable_btn'), yes, 'opt_template_none_selected_title'
  else if allEnabled or allDisabled
    # Templates are either all enabled or disabled so only enable the relevant button.
    updateButton $('#disable_btn'), allDisabled, if allDisabled
      'opt_template_disabled_selected_title'
    else
      'opt_disable_button_title'

    updateButton $('#enable_btn'), allEnabled, if allEnabled
      'opt_template_enabled_selected_title'
    else
      'opt_enable_button_title'
  else
    # Templates have a mixed enabled state so enable both buttons.
    updateButton $('#enable_btn'), no, 'opt_enable_button_title'
    updateButton $('#disable_btn'), no, 'opt_disable_button_title'

  # Delete button should only be enabled when *only* user-created templates have been selected.
  unless templates.length
    updateButton $('#delete_btn'), yes, 'opt_template_none_selected_title'
  else if hasPredefined
    updateButton $('#delete_btn'), yes, 'opt_template_no_predefined_delete_title'
  else
    updateButton $('#delete_btn'), no, 'opt_delete_button_title'

# Reset the wizard field values based on the current context.
resetWizard = ->
  log.trace()

  activeTemplate ?= {}

  # Display an appropriate header in the wizard depending on whether the active template is *new*.
  $('#template_wizard .modal-header h3').html if activeTemplate.key?
    i18n.get 'opt_template_modify_title', activeTemplate.title
  else
    i18n.get 'opt_template_new_header'

  # Assign template values to their respective fields, falling back on simple defaults.
  $('#template_enabled').prop 'checked', activeTemplate.enabled ? yes
  $('#template_content').val  activeTemplate.content  or ''
  $('#template_shortcut').val activeTemplate.shortcut or ''
  $('#template_title').val    activeTemplate.title    or ''

  # Update the fields and controls to reflect selected option.
  imgOpt = $ "#template_image option[value='#{activeTemplate.image}']"
  if imgOpt.length then imgOpt.prop 'selected', yes
  else $('#template_image option:first-child').prop 'selected', yes

  $('#template_image').trigger 'change'

  # Disable appropriate fields for predefined templates.
  $('#template_content, #template_title').prop 'disabled', !!activeTemplate.readOnly
  $('#template_delete_btn').each ->
    $this = $ this
    $this[if activeTemplate.readOnly then 'addClass' else 'removeClass'] 'disabled'
    $this.attr 'data-original-title', i18n.get if activeTemplate.readOnly
      'opt_template_no_predefined_delete_title'
    else
      'opt_wizard_delete_button_title'

    if activeTemplate.key? then $this.show() else $this.hide()

# Search the templates for the specified `query` and filter those displayed.
searchTemplates = (query = '') ->
  log.trace()

  keywords = query.replace(R_CLEAN_QUERY, '').split R_WHITESPACE

  if keywords.length
    expression    = ///
      #{(keyword for keyword in keywords when keyword).join '|'}
    ///i
    searchResults = _.filter ext.templates, (template) ->
      expression.test "#{template.content} #{template.title}"
  else
    searchResults = null
  loadTemplateRows searchResults ? ext.templates
  do refreshResetButton

# Set the current context of the template wizard.
setContext = (template = {}) ->
  log.trace()

  activeTemplate = $.extend {}, template

  do resetWizard

# Options page setup
# ------------------

options = window.options = new class Options extends utils.Class

  # Public functions
  # ----------------

  # Initialize the options page.  
  # This will involve inserting and configuring the UI elements as well as loading the current
  # settings.
  init: ->
    log.trace()

    log.info 'Initializing the options page'

    # Add support for analytics if the user hasn't opted out.
    analytics.add() if store.get 'analytics'

    # Add the user feedback feature to the page.
    do feedback

    # Begin initialization.
    i18n.init
      bitlyAccount:       opt_url_shortener_account_title: i18n.get 'shortener_bitly'
      googlAccount:       opt_url_shortener_account_title: i18n.get 'shortener_googl'
      version_definition: opt_guide_standard_version_text: ext.version

    # Ensure the current year is displayed throughout, where appropriate.
    $('.year-repl').html "#{new Date().getFullYear()}"

    # Bind tab selection event to all tabs.
    initialTabChange = yes
    $('a[tabify]').on 'click', ->
      target  = $(this).attr 'tabify'
      nav     = $ "#navigation a[tabify='#{target}']"
      parent  = nav.parent 'li'

      unless parent.hasClass 'active'
        parent.addClass('active').siblings().removeClass 'active'
        $(target).show().siblings('.tab').hide()

        id = nav.attr 'id'
        store.set 'options_active_tab', id

        unless initialTabChange
          id = utils.capitalize id.match(/(\S*)_nav$/)[1]
          log.debug "Changing tab to #{id}"
          analytics.track 'Tabs', 'Changed', id

        initialTabChange = no
        $(document.body).scrollTop 0

    # Reflect the previously persisted tab initially.
    store.init 'options_active_tab', 'general_nav'
    optionsActiveTab = store.get 'options_active_tab'
    $("##{optionsActiveTab}").trigger 'click'

    log.debug "Initially displaying tab for #{optionsActiveTab}"

    # Bind basic Developer Tools wizard events to their corresponding elements.
    $('#tools_nav').on 'click', ->
      $('#tools_wizard').modal 'show'

    $('.tools_close_btn').on 'click', ->
      $('#tools_wizard').modal 'hide'

    # Ensure that form submissions don't reload the page.
    $('form:not([target="_blank"])').on 'submit', ->
      # Return `false` to ensure default behaviour is prevented.
      false

    # Bind analytical tracking events to key footer buttons and links.
    $('footer a[href*="template-extension.org"]').on 'click', ->
      analytics.track 'Footer', 'Clicked', 'Homepage'

    # Setup and configure the donation button in the footer.
    $('#donation input[name="hosted_button_id"]').val ext.config.options.payPal
    $('#donation').on 'submit', ->
      analytics.track 'Footer', 'Clicked', 'Donate'

    # Load the current option values.
    do load

    # Ensure first enabled input field in modals get focus when opened.
    $('.modal').on 'shown', ->
      $(this).find(':input:enabled:first').focus()

    # Show OS-specific keyboard shortcut modifiers in the template wizard.
    $('#template_shortcut_modifier').html ext.modifiers()

    # Initialize all popovers, tooltips and *go-to* links.
    $('[popover]').each ->
      $this     = $ this

      placement = $this.attr 'data-placement'
      placement = if placement? then utils.trimToLower placement else 'right'

      trigger   = $this.attr 'data-trigger'
      trigger   = if trigger?   then utils.trimToLower trigger   else 'hover'

      $this.popover {
        placement
        trigger
        html:      yes
        content:   ->
          i18n.get $this.attr 'popover'
      }

      if trigger is 'manual'
        $this.on 'click', ->
          $this.popover 'toggle'

    do activateTooltips

    # Retrieve the initial height of the navigation bar.
    navHeight = $('.navbar').height()
    # Offset the screen by the initial height of the navigation bar when a *goto* link is clicked
    # so that the relevant content isn't hidden.
    $('[data-goto]').on 'click', ->
      goto = $ $(this).attr 'data-goto'
      pos  = goto.position()?.top or 0
      pos -= navHeight if pos and pos >= navHeight

      log.debug "Relocating view to include '#{goto.selector}' at #{pos}"

      $(window).scrollTop pos

# Initialize `options` when the DOM is ready.
utils.ready -> options.init()