# [Template](http://neocotic.com/template)  
# (c) 2012 Alasdair Mercer  
# Freely distributable under the MIT license.  
# For all details and documentation:  
# <http://neocotic.com/template>

# Private constants
# -----------------

# Default locale to use if no matching locales were found in `locales`.
DEFAULT_LOCALE   = 'en'
# Locales supported by Template.
LOCALES          = ['en']
# Regular expression used to validate feature name inputs.
R_VALID_NAME     = /^[A-Za-z0-9]+$/
# Regular expression used to validate keyboard shortcut inputs.
R_VALID_SHORTCUT = /[A-Z0-9]/

# Private variables
# -----------------

# Easily accessible reference to the extension controller.
{ext} = chrome.extension.getBackgroundPage()

# Load functions
# --------------

# Update the options page with the values from the current settings.
load = ->
  loadImages()
  loadFeatures()
  loadNotifications()
  loadToolbar()
  loadUrlShorteners()
  if utils.get 'contextMenu'
    $('#contextMenu').attr 'checked', 'checked'
  else
    $('#contextMenu').removeAttr 'checked'
  if utils.get 'shortcuts'
    $('#shortcuts').attr 'checked', 'checked'
  else
    $('#shortcuts').removeAttr 'checked'
  if utils.get 'doAnchorTarget'
    $('#doAnchorTarget').attr 'checked', 'checked'
  else
    $('#doAnchorTarget').removeAttr 'checked'
  if utils.get 'doAnchorTitle'
    $('#doAnchorTitle').attr 'checked', 'checked'
  else
    $('#doAnchorTitle').removeAttr 'checked'

# Create an `option` element representing the `feature` provided.  
# The element returned should then be inserted in to the `select` element that
# is managing the features on the options page.
loadFeature = (feature) ->
  opt = $ '<option/>',
    text:  feature.title
    value: feature.name
  opt.data 'content',  feature.content
  opt.data 'enabled',  String feature.enabled
  opt.data 'image',    String feature.image
  opt.data 'readOnly', String feature.readOnly
  opt.data 'shortcut', feature.shortcut
  return opt

# Bind the event handlers required for controlling the features.
loadFeatureControlEvents = ->
  features            = $ '#features'
  lastSelectedFeature = {}
  # Whenever the selected option changes we want all the controls to represent
  # the current selection (where possible).
  features.change(->
    $this = $ this
    opt   = $this.find 'option:selected'
    # Update the previously selected feature.
    updateFeature lastSelectedFeature if lastSelectedFeature.length
    if opt.length is 0
      # Disable all the controls as no option is selected.
      lastSelectedFeature = {}
      utils.i18nContent '#add_btn', 'opt_add_button'
      $('#moveUp_btn, #moveDown_btn, .toggle-feature').attr 'disabled',
        'disabled'
      $('.read-only, .read-only-always').removeAttr 'disabled'
      $('.read-only, .read-only-always').removeAttr 'readonly'
      $('#delete_btn').attr 'disabled', 'disabled'
      $('#feature_enabled').attr 'checked', 'checked'
      $('#feature_image option').first().attr 'selected', 'selected'
      $('#feature_image').change()
      $('#feature_name').val ''
      $('#feature_shortcut').val ''
      $('#feature_template').val ''
      $('#feature_title').val ''
    else
      # An option is selected; start cooking.
      lastSelectedFeature = opt
      utils.i18nContent '#add_btn', 'opt_add_new_button'
      $('.read-only-always').attr 'disabled', 'disabled'
      $('.read-only-always').attr 'readonly', 'readonly'
      $('.toggle-feature').removeAttr 'disabled'
      # Disable the *Up* control since the selected option is at the top of the
      # list.
      if opt.is ':first-child'
        $('#moveUp_btn').attr 'disabled', 'disabled'
      else
        $('#moveUp_btn').removeAttr 'disabled'
      # Disable the *Down* control since the selected option is at the bottom
      # of the list.
      if opt.is ':last-child'
        $('#moveDown_btn').attr 'disabled', 'disabled'
      else
        $('#moveDown_btn').removeAttr 'disabled'
      # Update the fields and controls to reflect selected option.
      imgOpt = $ "#feature_image option[value='#{opt.data 'image'}']"
      if imgOpt.length is 0
        $('#feature_image option').first().attr 'selected', 'selected'
      else
        imgOpt.attr 'selected', 'selected'
      $('#feature_image').change()
      $('#feature_name').val opt.val()
      $('#feature_shortcut').val opt.data 'shortcut'
      $('#feature_template').val opt.data 'content'
      $('#feature_title').val opt.text()
      if opt.data('enabled') is 'true'
        $('#feature_enabled').attr 'checked', 'checked'
      else
        $('#feature_enabled').removeAttr 'checked'
      if opt.data('readOnly') is 'true'
        $('.read-only').attr 'disabled', 'disabled'
        $('.read-only').attr 'readonly', 'readonly'
      else
        $('.read-only').removeAttr 'disabled'
        $('.read-only').removeAttr 'readonly'
    # Ensure the correct arrows display in the *Up* and *Down* controls
    # depending on whether or not the controls are currently disabled.
    $('#moveDown_btn:not([disabled]) img').attr 'src',
      '../images/move_down.gif'
    $('#moveUp_btn:not([disabled]) img').attr 'src', '../images/move_up.gif'
    $('#moveDown_btn[disabled] img').attr 'src',
      '../images/move_down_disabled.gif'
    $('#moveUp_btn[disabled] img').attr 'src', '../images/move_up_disabled.gif'
  ).change()
  # Add a new order to the select based on the input values.
  $('#add_btn').click ->
    opt = features.find 'option:selected'
    if opt.length
      # Feature was selected; clear that selection and allow creation.
      features.val([]).change()
      $('#feature_name').focus()
    else
      name  = $('#feature_name').val().trim()
      title = $('#feature_title').val().trim()
      # Wipe any pre-existing error messages.
      $('#errors').find('li').remove();
      # User submitted new feature so check it out already.
      opt = loadFeature
        content:  $('#feature_template').val()
        enabled:  String $('#feature_enabled').is ':checked'
        image:    parseInt $('#feature_image option:selected').val(), 10
        name:     name
        readOnly: no
        shortcut: $('#feature_shortcut').val().trim().toUpperCase()
        title:    title
      # Confirm the feature meets the criteria.
      if validateFeature opt, yes
        features.append opt
        opt.attr 'selected', 'selected'
        updateToolbarFeatures()
        features.change().focus()
      else
        # Show the error messages to the user.
        $.facebox div: '#message'
  # Prompt the user to confirm removal of the selected feature.
  $('#delete_btn').click ->
    $.facebox div: '#delete_con'
  # Cancel the feature removal process.
  $('.delete_no_btn').live 'click', ->
    $(document).trigger 'close.facebox'
  # Finalize the feature removal.
  $('.delete_yes_btn').live 'click', ->
    opt = features.find('option:selected');
    if opt.data('readOnly') isnt 'true'
      opt.remove()
      features.change().focus()
    $(document).trigger 'close.facebox'
    updateToolbarFeatures()
  # Move the selected option down once when the *Down* control is clicked.
  $('#moveDown_btn').click ->
    opt = features.find 'option:selected'
    opt.insertAfter opt.next()
    features.change().focus()
  # Move the selected option up once when the *Up* control is clicked.
  $('#moveUp_btn').click ->
    opt = features.find 'option:selected'
    opt.insertBefore opt.prev()
    features.change().focus()

# Bind the event handlers required for exporting features.
loadFeatureExportEvents = ->
  features = $ '#features'
  # Prompt the user to selected the features to be exported.
  $('#export_btn').click ->
    list = $ '.export_con_list'
    list.find('option').remove()
    updateFeature features.find 'option:selected'
    features.val([]).change()
    $('.export_yes_btn').attr 'disabled', 'disabled'
    $('.export_con_stage1').show()
    $('.export_con_stage2').hide()
    $('.export_content').val ''
    features.find('option').each ->
      opt = $ this
      list.append $ '<option/>',
        text:  opt.text()
        value: opt.val()
    $.facebox div: '#export_con'
  # Enable/disable the continue button depending on whether or not any features
  # are currently selected.
  $('.export_con_list').live 'change', ->
    if $(this).find('option:selected').length > 0
      $('.export_yes_btn').removeAttr 'disabled'
    else
      $('.export_yes_btn').attr 'disabled', 'disabled'
  # Copy the text area contents to the system clipboard.
  $('.export_copy_btn').live('click', (event) ->
    ext.copy $('.export_content').val(), yes
    $(this).text utils.i18n 'copied'
    event.preventDefault()
  ).live 'mouseover', ->
    $(this).text utils.i18n 'copy'
  # Deselect all of the features in the list.
  $('.export_deselect_all_btn').live 'click', ->
    $('.export_con_list option').removeAttr('selected').parent().focus()
    $('.export_yes_btn').attr 'disabled', 'disabled'
  # Cancel the export process.
  $('.export_no_btn, .export_close_btn').live 'click', (event) ->
    $(document).trigger 'close.facebox'
    event.preventDefault()
  # Prompt the user to select a file location to save the exported data.
  $('.export_save_btn').live 'click', ->
    $this = $ this
    str   = $this.parents('.export_con_stage2').find('.export_content').val()
    # Write the contents of the text area in to a temporary file and then
    # prompt the user to download it.
    window.webkitRequestFileSystem window.TEMPORARY, 1024 * 1024, (fs) ->
      fs.root.getFile 'export.json', create: yes, (fileEntry) ->
        fileEntry.createWriter (fileWriter) ->
          builder = new WebKitBlobBuilder()
          fileWriter.onerror = (error) ->
            console.log error
          fileWriter.onwriteend = ->
            window.location.href = fileEntry.toURL()
          builder.append str
          fileWriter.write builder.getBlob 'application/json'
  # Select all of the features in the list.
  $('.export_select_all_btn').live 'click', ->
    $('.export_con_list option').attr('selected', 'selected').parent().focus()
    $('.export_yes_btn').removeAttr 'disabled'
  # Create the exported data based on the selected features.
  $('.export_yes_btn').live 'click', ->
    $this = $(this).attr 'disabled', 'disabled'
    items = $this.parents('.export_con_stage1').find('.export_con_list option')
    names = []
    items.filter(':selected').each ->
      names.push $(this).val()
    $('.export_content').val createExport names
    $('.export_con_stage1').hide()
    $('.export_con_stage2').show()

# Bind the event handlers required for importing features.
loadFeatureImportEvents = ->
  features = $ '#features'
  # Restore the previous view in the import process.
  $('.import_back_btn').live 'click', ->
    $('.import_con_stage1').show()
    $('.import_con_stage2, .import_con_stage3').hide()
  # Prompt the user to input/load the data to be imported.
  $('#import_btn').click ->
    updateFeature features.find 'option:selected'
    features.val([]).change()
    $('.import_con_stage1').show()
    $('.import_con_stage2, .import_con_stage3').hide()
    $('.import_content').val ''
    $('.import_error').html '&nbsp;'
    $.facebox div: '#import_con'
  # Enable/disable the finalize button depending on whether or not any features
  # are currently selected.
  $('.import_con_list').live 'change', ->
    if $(this).find('option:selected').length > 0
      $('.import_final_btn').removeAttr 'disabled'
    else
      $('.import_final_btn').attr 'disabled', 'disabled'
  # Deselect all of the features in the list.
  $('.import_deselect_all_btn').live 'click', ->
    $('.import_con_list option').removeAttr('selected').parent().focus()
    $('.import_final_btn').attr 'disabled', 'disabled'
  # Read the contents of the loaded file in to the text area and perform simple
  # error handling.
  $('.import_file_btn').live 'change', (event) ->
    file   = event.target.files[0]
    reader = new FileReader()
    reader.onerror = (evt) ->
      message = ''
      switch evt.target.error.code
        when evt.target.error.NOT_FOUND_ERR
          message = utils.i18n 'error_file_not_found'
        when evt.target.error.ABORT_ERR
          message = utils.i18n 'error_file_aborted'
        else
          message = utils.i18n 'error_file_default'
      $('.import_error').text message
    reader.onload = (evt) ->
      $('.import_content').val evt.target.result
      $('.import_error').html '&nbsp;'
    reader.readAsText file
  # Finalize the import process.
  $('.import_final_btn').live 'click', ->
    $this = $ this
    list = $this.parents('.import_con_stage2').find '.import_con_list'
    list.find('option:selected').each ->
      opt = $ this
      existingOpt = features.find "option[value='#{opt.val()}']"
      opt.removeAttr 'selected'
      if existingOpt.length is 0
        features.append opt
      else
        existingOpt.replaceWith opt
    $(document).trigger 'close.facebox'
    updateToolbarFeatures()
    features.focus()
  # Cancel the import process.
  $('.import_no_btn, .import_close_btn').live 'click', ->
    $(document).trigger 'close.facebox'
  # Paste the contents of the system clipboard in to the text area.
  $('.import_paste_btn').live('click', ->
    $('.import_file_btn').val ''
    $('.import_content').val ext.paste()
    $(this).text utils.i18n 'pasted'
  ).live 'mouseover', ->
    $(this).text utils.i18n 'paste'
  # Select all of the features in the list.
  $('.import_select_all_btn').live 'click', ->
    $('.import_con_list option').attr('selected', 'selected').parent().focus()
    $('.import_final_btn').removeAttr 'disabled'
  # Read the imported data and attempt to extract any valid features and list
  # the changes to user for them to check and finalize.
  $('.import_yes_btn').live 'click', ->
    $this = $(this).attr 'disabled', 'disabled'
    list  = $ '.import_con_list'
    str   = $this.parents('.import_con_stage1').find('.import_content').val()
    $('.import_error').html '&nbsp;'
    try
      importData = createImport str
    catch error
      $('.import_error').text error
    if importData
      data = readImport importData
      if data.features.length is 0
        $('.import_con_stage3').show()
        $('.import_con_stage1, .import_con_stage2').hide()
      else
        list.find('option').remove()
        $('.import_count').text data.features.length
        list.append loadFeature feature for feature in data.features
        $('.import_final_btn').attr 'disabled', 'disabled'
        $('.import_con_stage2').show()
        $('.import_con_stage1, .import_con_stage3').hide()
    $this.removeAttr 'disabled'

# Update the features section of the options page with the current settings.
loadFeatures = ->
  features = $ '#features'
  # Start from a clean slate.
  features.remove 'option'
  # Create and insert options representing each feature.
  features.append loadFeature feature for feature in ext.features
  # Load all of the event handlers required for managing the features.
  loadFeatureControlEvents()
  loadFeatureImportEvents()
  loadFeatureExportEvents()

# Create an `option` element for each available feature image.  
# Each element is inserted in to the `select` element containing feature images
# on the options page.
loadImages = ->
  imagePreview = $ '#feature_image_preview'
  images       = $ '#feature_image'
  for image in ext.images
    $('<option/>',
      text:  image.name
      value: image.id
    ).appendTo(images).data 'file', image.file
    if image.separate
      images.append $ '<option/>',
        disabled: 'disabled'
        text:     '---------------'
  images.change(->
    opt = images.find 'option:selected'
    imagePreview.attr
      src:   "../images/#{opt.data 'file'}"
      title: opt.text()
  ).change()

# Update the notification section of the options page with the current
# settings.
loadNotifications = ->
  if utils.get 'notifications'
    $('#notifications').attr 'checked', 'checked'
  else
    $('#notifications').removeAttr 'checked'
  notificationDuration = utils.get 'notificationDuration'
  timeInSecs = 0
  timeInSecs = notificationDuration * .001 if notificationDuration > timeInSecs
  $('#notificationDuration').val timeInSecs

# Update the toolbar behaviour section of the options page with the current
# settings.
loadToolbar = ->
  if utils.get 'toolbarPopup'
    $('#toolbarFeature').removeAttr 'checked'
    $('#toolbarPopup').attr 'checked', 'checked'
  else
    $('#toolbarFeature').attr 'checked', 'checked'
    $('#toolbarPopup').removeAttr 'checked'
  if utils.get 'toolbarFeatureDetails'
    $('#toolbarFeatureDetails').attr 'checked', 'checked'
  else
    $('#toolbarFeatureDetails').removeAttr 'checked'
  updateToolbarFeatures()
  toggleToolbarFeature()
  loadToolbarControlEvents()

# Bind the event handlers required for controlling toolbar behaviour changes.
loadToolbarControlEvents = ->
  $('#toolbarFeature').click ->
    $this = $ this
    if $this.is 'checked'
      $('#toolbarPopup').attr 'checked', 'checked'
    else
      $this.attr 'checked', 'checked'
      $('#toolbarPopup').removeAttr 'checked'
    toggleToolbarFeature()
  $('#toolbarPopup').click ->
    $this = $ this
    if $this.is 'checked'
      $('#toolbarFeature').attr 'checked', 'checked'
    else
      $this.attr 'checked', 'checked'
      $('#toolbarFeature').removeAttr 'checked'
    toggleToolbarFeature()

# Update the URL shorteners section of the options page with the current
# settings.
loadUrlShorteners = ->
  $('input[name="enabled_shortener"]').each ->
    radio = $ this
    radio.attr 'checked', 'checked' if utils.get radio.attr 'id'
  $('#bitlyApiKey').val utils.get 'bitlyApiKey'
  $('#bitlyUsername').val utils.get 'bitlyUsername'
  if utils.get 'googlOAuth'
    $('#googlOAuth').attr 'checked', 'checked'
  else
    $('#googlOAuth').removeAttr 'checked'
  $('#yourlsPassword').val utils.get 'yourlsPassword'
  $('#yourlsSignature').val utils.get 'yourlsSignature'
  $('#yourlsUrl').val utils.get 'yourlsUrl'
  $('#yourlsUsername').val utils.get 'yourlsUsername'

# Save functions
# --------------

# Update the settings with the values from the options page.
save = ->
  utils.set 'contextMenu', $('#contextMenu').is ':checked'
  utils.set 'shortcuts', $('#shortcuts').is ':checked'
  utils.set 'doAnchorTarget', $('#doAnchorTarget').is ':checked'
  utils.set 'doAnchorTitle', $('#doAnchorTitle').is ':checked'
  saveFeatures()
  saveNotifications()
  saveToolbar()
  saveUrlShorteners()

# Update the settings with the values from the feature section of the options
# page.
saveFeatures = ->
  features = []
  # Update the settings for each feature based on their corresponding options.
  $('#features option').each ->
    features.push deriveFeature $ this
  # Ensure the data for all features reflects the updated settings.
  ext.saveFeatures features
  ext.updateFeatures()

# Update the settings with the values from the notification section of the
# options page.
saveNotifications = ->
  utils.set 'notifications', $('#notifications').is ':checked'
  timeInSecs = $('#notificationDuration').val()
  timeInSecs = if timeInSecs? then parseInt(timeInSecs, 10) * 1000 else 0
  utils.set 'notificationDuration', timeInSecs

# Updates the settings with the values from the toolbar section of the options
# page.
saveToolbar = ->
  toolbarFeature     = $ '#toolbarFeatureName option:selected'
  toolbarFeatureName = ''
  toolbarFeatureName = toolbarFeature.val() if toolbarFeature.length
  if $('#toolbarPopup').is(':checked') or not toolbarFeatureName
    utils.set 'toolbarFeature', no
    utils.set 'toolbarPopup', yes
  else
    utils.set 'toolbarFeature', yes
    utils.set 'toolbarPopup', no
  utils.set 'toolbarFeatureDetails', $('#toolbarFeatureDetails').is ':checked'
  utils.set 'toolbarFeatureName', toolbarFeatureName
  ext.updateToolbar()

# Update the settings with the values from the URL shorteners section of the
# options page.
saveUrlShorteners = ->
  $('input[name="enabled_shortener"]').each ->
    $this = $ this
    utils.set $this.attr('id'), $this.is ':checked'
  utils.set 'bitlyApiKey',     $('#bitlyApiKey').val().trim()
  utils.set 'bitlyUsername',   $('#bitlyUsername').val().trim()
  utils.set 'googlOAuth',      $('#googlOAuth').is ':checked'
  utils.set 'yourlsPassword',  $('#yourlsPassword').val()
  utils.set 'yourlsSignature', $('#yourlsSignature').val().trim()
  utils.set 'yourlsUrl',       $('#yourlsUrl').val().trim()
  utils.set 'yourlsUsername',  $('#yourlsUsername').val().trim()

# Update the specified `option` element that represents a feature with the
# values taken from the available input fields.
updateFeature = (opt) ->
  if opt.length
    opt.data 'content',  $('#feature_template').val()
    opt.data 'enabled',  String $('#feature_enabled').is ':checked'
    opt.data 'image',    $('#feature_image option:selected').val()
    opt.data 'shortcut', $('#feature_shortcut').val().trim().toUpperCase()
    opt.text $('#feature_title').val().trim()
    opt.val  $('#feature_name').val().trim()
    return opt

# Update the existing feature with information extracted from the imported
# feature provided.  
# `feature` should not be altered in any way and the properties of `existing`
# should only be changed if the replacement values are valid.  
# Protected properties will only be updated if `existing` is not read-only and
# the replacement value is valid.
updateImportedFeature = (feature, existing) ->
  # Ensure read-only features are protected.
  unless existing.readOnly
    existing.content = feature.content
    # Only allow valid titles.
    if feature.title.length > 0 and feature.title.length <= 32
      existing.title = feature.title
  existing.enabled = feature.enabled
  # Only only existing images.
  for image in ext.images when image.id is feature.image
    existing.image = feature.image
    break
  # Only allow valid keyboard shortcuts.
  existing.shortcut = feature.shortcut if isShortcutValid feature.shortcut
  return existing

# Update the selection of features in the toolbar behaviour section to reflect
# those available in the features section.
updateToolbarFeatures = ->
  features                = []
  toolbarFeatures         = $ '#toolbarFeatureName'
  toolbarFeatureName      = utils.get 'toolbarFeatureName'
  lastSelectedFeature     = toolbarFeatures.find 'option:selected'
  lastSelectedFeatureName = ''
  if lastSelectedFeature.length
    lastSelectedFeatureName = lastSelectedFeature.val()
  toolbarFeatures.find('option').remove()
  $('#features option').each ->
    $this = $ this
    feature =
      name:     $this.val()
      selected: no
      title:    $this.text()
    if lastSelectedFeatureName
      feature.selected = yes if feature.name is lastSelectedFeatureName
    else if feature.name is toolbarFeatureName
      feature.selected = yes
    features.push feature
  features.sort (a, b) ->
    return a.title > b.title
  for feature in features
    option = $ '<option/>',
      text:  "#{feature.title} (#{feature.name})"
      value: feature.name
    option.attr 'selected', 'selected' if feature.selected
    toolbarFeatures.append option

# Validation functions
# --------------------

# Indicate whether or not the specified `name` is available for use as a
# feature.
isNameAvailable = (name, additionalNames) ->
  available = yes
  $('#features option').each ->
    if $(this).val() is name
      return available = no
  if available and $.isArray additionalNames
    available = additionalNames.indexOf(name) is -1
  return available

# Indicate whether or not the specified `name` is valid for use as a feature.
isNameValid = (name) ->
  return name.search(R_VALID_NAME) isnt -1

# Indicate whether or not the specified keyboard `shortcut` is valid for use by
# features.
isShortcutValid = (shortcut) ->
  return shortcut.search(R_VALID_SHORTCUT) isnt -1

# Validate the specified `option` element that represents a feature.  
# Any validation errors encountered are added to a unordered list which should
# be displayed to the user at some point if `true` is returned.
validateFeature = (feature, isNew, usedShortcuts) ->
  enabled  = feature.data('enabled') is 'true'
  errors   = $ '#errors'
  name     = feature.val().trim()
  shortcut = feature.data('shortcut').trim()
  title    = feature.text().trim()

  # Create a list item for the error message with the specified `name`.
  createError = (name) ->
    $('<li/>', html: utils.i18n name).appendTo errors

  # Only validate name for non-read-only features.
  if feature.data('readOnly') isnt 'true'
    # Only validate name availability and structure for new features.
    if isNew
      unless isNameValid name
        createError 'opt_feature_name_invalid'
      else unless isNameAvailable name
        createError 'opt_feature_name_unavailable'
    # Name is missing but is required.
    createError 'opt_feature_title_invalid' if title.length is 0
  # If `usedShortcuts` is specified also validate that the shortcut of the
  # feature is not already in use.  
  if shortcut and usedShortcuts?
    # Validate whether or not the shortcut is valid and available.
    unless isShortcutValid shortcut
      createError 'opt_feature_shortcut_invalid'
    else if enabled and usedShortcuts.indexOf(shortcut) isnt -1
      createError 'opt_feature_shortcut_unavailable'
  # Indicate whether or not any validation errors were encountered.
  return errors.find('li').length is 0

# Validate all the `option` elements that represent features.  
# Any validation errors encountered are added to a unordered list which should
# be displayed to the user at some point if `true` is returned.
validateFeatures = ->
  errors        = $ '#errors'
  features      = $ '#features option'
  shortcut      = ''
  usedShortcuts = []
  # Wipe any pre-existing errors.
  errors.remove 'li'
  features.each ->
    $this = $ this
    if validateFeature $this, no, usedShortcuts
      shortcut = $this.data('shortcut').trim()
      # Only stores shortcut if used and feature is enabled.
      if $this.data('enabled') is 'true' and shortcut
        usedShortcuts.push shortcut
    else
      # Show user which feature failed validation.
      $this.attr 'selected', 'selected'
      $('#features').change().focus()
      return no
  # Indicate whether or not any validation errors were encountered.
  return errors.find('li').length is 0

# Indicate whether or not `feature` contains the required fields of the correct
# types.
# Perform a *soft* validation without validating the values themselves, instead
# only their existence.
validateImportedFeature = (feature) ->
  'object'  is typeof feature and
  'string'  is typeof feature.content and
  'boolean' is typeof feature.enabled and
  'number'  is typeof feature.image and
  'string'  is typeof feature.name and
  'string'  is typeof feature.shortcut and
  'string'  is typeof feature.title

# Miscellaneous functions
# -----------------------

# Create a feature from the information from the imported `feature` provided.  
# `feature` is not altered in any way and the new feature is only created if
# `feature` has a valid name.  
# Other than the name, any invalid fields will not be copied to the new feature
# which will instead use the preferred default value for those fields.
addImportedFeature = (feature) ->
  if isNameValid(feature.name) and feature.name.length <= 32
      newFeature =
        content:  feature.content
        enabled:  feature.enabled
        image:    0
        name:     feature.name
        readOnly: no
        shortcut: ''
        title:    utils.i18n 'untitled'
      # Only allow existing images.
      for image in ext.images when image.id is feature.image
        newFeature.image = feature.image
        break
      # Only allow valid keyboard shortcuts.
      if isShortcutValid feature.shortcut
        newFeature.shortcut = feature.shortcut
      # Only allow valid titles.
      if feature.title.length > 0 and feature.title.length <= 32
        newFeature.title = feature.title
  return newFeature

# Create a JSON string to export the features with the specified `names`.
createExport = (names) ->
  data =
    templates: []
    version:   ext.version
  for name in names
    opt = $ "#features option[value='#{name}']"
    data.templates.push
      content:  opt.data 'content'
      enabled:  opt.data('enabled') is 'true'
      image:    parseInt opt.data('image'), 10
      name:     opt.val()
      shortcut: opt.data 'shortcut'
      title:    opt.text()
  return JSON.stringify data

# Create a JSON object from the imported string specified.
createImport = (str) ->
  data = {}
  try
    data = JSON.parse str
  catch error
    throw utils.i18n 'error_import_data'
  if not $.isArray(data.templates) or data.templates.length is 0 or
     $.type(data.version) isnt 'string'
    throw utils.i18n 'error_import_invalid'
  return data

# Create a feature with the information derived from the specified `option` 
# element.
deriveFeature = (option) ->
  if option.length > 0
    feature =
      content:  option.data 'content'
      enabled:  option.data('enabled') is 'true'
      image:    parseInt option.data('image'), 10
      index:    option.parent().find('option').index option
      name:     option.val()
      readOnly: option.data('readOnly') is 'true'
      shortcut: option.data 'shortcut'
      title:    option.text()
  return feature

# Determine which icon within the `icons` specified has the smallest
# dimensions.
getSmallestIcon = (icons) ->
  icon = ico for ico in icons when not icon or ico.size < icon.size
  return icon

# Read the imported data created by `createImport` and extract all of the
# imported features that appear to be valid.  
# When overwriting an existing feature, only the properties with valid values
# will be transferred with the exception of protected properties (i.e. on
# read-only features).  
# When creating a new feature, any invalid properties will be replaced with
# their default values.
readImport = (importData) ->
  data     = features: []
  names    = []
  for feature in importData.templates
    existing = {}
    if validateImportedFeature feature
      if isNameAvailable feature.name, names
        # Attempt to create and add the new feature.
        feature = addImportedFeature feature
        if feature
          data.features.push feature
          names.push feature.name
      else
        # Attempt to update the previously imported feature.
        for imported, i in data.features
          if imported.name is feature.name
            existing         = updateImportedFeature feature, imported
            data.features[i] = existing
            break
        unless existing.name
          # Attempt to derive the existing feature from the available options.
          existing = deriveFeature $ "#features
            option[value='#{feature.name}']"
          # Attempt to update the derived feature.
          if existing
            existing = updateImportedFeature feature, existing
            data.features.push existing
            names.push existing.name
  return data

# Toggle the acccessibility of the toolbar feature details.
toggleToolbarFeature = ->
  fields = $ '#toolbarFeatureName, #toolbarFeatureDetails'
  spans  = $ '#toolbarFeatureName_txt, #toolbarFeatureDetails_txt'
  if $('#toolbarPopup').is ':checked'
    spans.addClass 'disabled'
    fields.attr 'disabled', 'disabled'
  else
    spans.removeClass 'disabled'
    fields.removeAttr 'disabled'

# Options page setup
# ------------------

options = window.options =

  # Public functions
  # ----------------

  # Initialize the options page.  
  # This will involve inserting and configuring the UI elements as well as
  # loading the current settings.
  init: ->
    utils.i18nSetup
      footer:
        opt_footer: new Date().format 'Y'
    # Bind tab selection event to all tabs.
    $('[tabify]').click ->
      $this = $ this
      unless $this.hasClass 'selected'
        $this.siblings().removeClass 'selected'
        $this.addClass 'selected'
        $($this.attr 'tabify').show().siblings('.tab').hide()
        utils.set 'options_active_tab', $this.attr 'id'
    # Reflect the persisted tab.
    utils.init 'options_active_tab', 'general_nav'
    $("##{utils.get 'options_active_tab'}").click()
    # Bind event to the "Save & Close" button which will update the settings
    # with the values from the options page and close the current tab.  
    # None of this should happen if the invalid features are found; in which
    # case the user is notified of these errors.
    $('.save-btn').click ->
      updateFeature $ '#features option:selected'
      if validateFeatures()
        save()
        chrome.tabs.getSelected null, (tab) ->
          chrome.tabs.remove tab.id
      else
        $.facebox div: '#message'
    # Bind event to template section items which will toggle the visibility of
    # its contents.
    $('.template-section').live 'click', ->
      $this = $ this
      table = $this.parents '.template-table'
      table.find('.template-section.selected').removeClass 'selected'
      table.find('.template-display').html(
        $this.addClass('selected').next('.template-content').html()
      ).scrollTop 0
    # Load template section from locale-specific file.
    locale   = DEFAULT_LOCALE
    uiLocale = utils.i18n '@@ui_locale'
    for loc in LOCALES when loc is uiLocale
      locale = uiLocale
      break
    $('#template_help').load(
      chrome.extension.getURL("pages/templates_#{locale}.html"), ->
        $('.template-section:first-child').click()
        $('.version-replace').text ext.version
    )
    # Load the current option values.
    load()
    if ext.isThisPlatform 'mac'
      $('#feature_shortcut_txt').html ext.shortcutMacModifiers
    else
      $('#feature_shortcut_txt').html ext.shortcutModifiers
    # Initialize all faceboxes.
    $('a[facebox]').click ->
      $.facebox div: $(this).attr 'facebox'