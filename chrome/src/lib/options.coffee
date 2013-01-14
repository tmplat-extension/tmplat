# [Template](http://neocotic.com/template)  
# (c) 2013 Alasdair Mercer  
# Freely distributable under the MIT license.  
# For all details and documentation:  
# <http://neocotic.com/template>

# Private constants
# -----------------

# Source URL of the user feedback widget script.
WIDGET_SOURCE = "https://widget.uservoice.com/RSRS5SpMkMxvKOCs27g.js"

# Private variables
# -----------------

# Easily accessible reference to the extension controller.
{ext}         = chrome.extension.getBackgroundPage()
# Indicate whether or not the user feedback feature has been added to the page.
feedbackAdded = no
# List of tab identifiers bound to the current options object.
tabs          = []

# Private functions
# -----------------

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

# Update the options page with the values from the current settings.
load = ->
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
  loadSaveEvents()

# Bind the event handlers required for persisting uncategorized changes.
loadSaveEvents = ->
  log.trace()
  options.bindSaveEvent '#loggerEnabled, #loggerLevel', 'change', 'logger',
    (key) ->
      value = if key is 'level' then @val() else @is ':checked'
      log.debug "Changing logging #{key} to '#{value}'"
      value
  , (jel, key, value) ->
    logger = store.get 'logger'
    chrome.extension.getBackgroundPage().log.config = log.config = logger
    analytics.track 'Logging', 'Changed', key[0].toUpperCase() + key.substr(1),
      Number value

# Load the contents for the specified `tab` into the options page.
loadTab = (tab, callback) ->
  log.trace()
  log.info "Loading #{tab.id} tab resources"
  $.ajax
    cache:   no
    success: (data) ->
      $('#tabs').prepend $ '<div/>',
        class: 'hide tab'
        html:  data
        id:    "#{tab.id}_tab"
      callback()
    url:     utils.url "pages/options-#{tab.id}.html"

# Load all of the contents for the configured tabs into the options page,
# including the navigation panel.  
# A dialog is displayed during this process to update the user of the current
# progress. It's the responsibility of the caller to ensure that this dialog is
# closed in their callback.
loadTabs = (callback) ->
  log.trace()
  log.info 'Loading options tabs'
  # TODO: Use queues to improve progress animation(?)
  cancelBtn   = $ '#loading_cancel_btn'
  dialog      = $ '#loading_dialog'
  message     = $('#loading_message').text ' '
  progressBar = $('#loading_progress .bar').css 'width', 0
  cancelBtn.html(i18n.get 'opt_wizard_cancel_button').off('click').click ->
    dialog.modal 'hide'
    window.close()
  dialog.find('.modal-header h3').html i18n.get 'opt_loading_header'
  dialog.modal show: yes
  # Create a runner to ensure tabs are loaded in the correct order.
  runner = new utils.Runner()
  steps  = 100 / ext.config.options.tabs.length
  for tab, i in ext.config.options.tabs[..].reverse()
    header = i18n.get tab.headerKey
    step   = i + 1
    message.html i18n.get 'opt_loading_text', header
    progressBar.css 'width', "#{step * steps / 2}%"
    $('#navigation').prepend $('<li/>').append $ '<a/>',
      id:     "#{tab.id}_nav"
      tabify: "##{tab.id}_tab"
      text:   header
    runner.push null, loadTab, tab, ->
      progressBar.css 'width', "#{step * steps}%"
      runner.next()
  runner.run ->
    message.html i18n.get 'opt_loading_completed_text'
    callback()

# Helper classes
# --------------

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

# Options page setup
# ------------------

options = window.options = new class Options extends utils.Class

  # Public variables
  # ----------------

  # Internationalization map which can be extended by tabs during their
  # initialization.
  i18nMap: {}

  # Public functions
  # ----------------

  # Activate tooltip effects, optionally only within a specific context.  
  # The activation is done cleanly, unbinding any associated events that have
  # been previously bound.
  activateTooltips: (selector) ->
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
      placement = if placement? then utils.trimToLower placement else 'top'
      $this.tooltip
        container: $this.attr('data-container') ? 'body'
        placement: placement

  # Bind an event of the specified `type` to the elements included by
  # `selector` that, when triggered, modifies the underlying `option` with the
  # value returned by `evaluate`.
  bindSaveEvent: (selector, type, option, evaluate, callback) ->
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
    # Load tabs and begin initialization.
    loadTabs =>
      # Call all tab handlers to allow for custom initialization.
      @[id]?.init?() for id in tabs
      i18n.init @i18nMap
      $('.year-repl').html "#{new Date().getFullYear()}"
      # Bind tab selection event to all tabs.
      initialTabChange = yes
      $('a[tabify]').click ->
        target = $(this).attr 'tabify'
        nav    = $ "#navigation a[tabify='#{target}']"
        parent = nav.parent 'li'
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
      # Initialize all popovers, tooltips and *go-to* links.
      $('[popover]').each ->
        $this     = $ this
        placement = $this.attr 'data-placement'
        placement = if placement? then utils.trimToLower placement else 'right'
        trigger   = $this.attr 'data-trigger'
        trigger   = if trigger? then utils.trimToLower trigger else 'hover'
        $this.popover
          content:   -> i18n.get $this.attr 'popover'
          html:      yes
          placement: placement
          trigger:   trigger
        if trigger is 'manual'
          $this.click -> $this.popover 'toggle'
      @activateTooltips()
      navHeight = $('.navbar').height()
      $('[data-goto]').click ->
        goto = $ $(this).attr 'data-goto'
        pos  = goto.position()?.top or 0
        pos -= navHeight if pos and pos >= navHeight
        log.debug "Relocating view to include '#{goto.selector}' at #{pos}"
        $(window).scrollTop pos
      $('#loading_dialog').modal 'hide'

  # Bind a tab to this options object using the `handler` provided to
  # initialize the tab.
  tab: (id, handler) ->
    log.trace()
    log.info "Initializing the #{id} tab..."
    tabs.push id
    @[id] = init: handler

# Expose nested classes for modular tabs.
options.Message           = Message
options.ErrorMessage      = ErrorMessage
options.SuccessMessage    = SuccessMessage
options.WarningMessage    = WarningMessage
options.ValidationError   = ValidationError
options.ValidationWarning = ValidationWarning

# Initialize `options` when the DOM is ready.
utils.ready -> options.init()