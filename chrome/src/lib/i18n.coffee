# [Template](http://neocotic.com/template)  
# (c) 2013 Alasdair Mercer  
# Freely distributable under the MIT license.  
# For all details and documentation:  
# <http://neocotic.com/template>

# Private variables
# -----------------

# Mapping for internationalization handlers.  
# Each handler represents an attribute (based on the property name) and is called for each
# attribute found within the node currently being processed.
handlers   =

  # Replace the HTML content of `element` with the named message looked up for `name`.
  'i18n-content': (element, name, map) ->
    subs = subst element, name, map

    element.innerHTML = i18n.get name, subs

  # Adds options to the select `element` with the message looked up for `name`.
  'i18n-options': (element, name, map) ->
    subs = subst element, name, map

    for value in i18n.get name, subs
      option = document.createElement 'option'
      if _.isString value
        option.text  = option.value = value
      else
        option.text  = value[1]
        option.value = value[0]

      element.appendChild option

  # Replace the value of the properties and/or attributes of `element` with the messages looked up
  # for their corresponding values.
  'i18n-values':  (element, value, map) ->
    for part in value.replace(/\s/g, '').split ';'
      prop = part.match /^([^:]+):(.+)$/
      continue unless prop

      propName = prop[1]
      propExpr = prop[2]
      propSubs = subst element, propExpr, map

      if propName[0] is '.'
        path = propName[1..].split '.'

        obj = element
        obj = obj[path.shift()] while obj and path.length > 1

        if obj
          path = path[0]
          obj[path] = i18n.get propExpr, propSubs
          process element, map if path is 'innerHTML'
      else
        element.setAttribute propName, i18n.get propExpr, propSubs

# List of internationalization attributes/handlers available.
attributes = (key for own key of handlers)
# Selector containing the available internationalization attributes/handlers which is used by
# `process` to query all elements.
selector   = "[#{attributes.join '],['}]"

# Private functions
# -----------------

# Find all elements to be localized and call their corresponding handler(s).
process = (node, map) ->
  for element in node.querySelectorAll selector
    for name in attributes
      attribute = element.getAttribute name
      handlers[name] element, attribute, map if attribute?

# Find an array of substitution strings using the element's ID and the message key as the mapping.
subst = (element, value, map) ->
  if map
    for own prop, map2 of map when prop is element.id
      for own prop2, target of map2 when prop2 is value
        subs = target
        break
      break
  subs

# Internationalization setup
# --------------------------

i18n = window.i18n = new class Internationalization extends utils.Class

  # Public variables
  # ----------------

  # Default configuration for how internationalization is managed.
  manager:

    # Retrieve the message with the given `name`.  
    # Any `substitutions` provided will be used to replace numeric placeholders within the message
    # before it is returned.
    get: (name, substitutions = []) ->
      message = @messages[name]
      if message? and substitutions.length > 0
        for sub, i in substitutions
          message = message.replace new RegExp("\\$#{i + 1}", 'g'), sub
      message

    # Retrieve a list of supported languages.
    langs: ->
      []

    # Retrieve the current detected locale.
    locale: ->
      navigator.language

    # Root node that is to be modified and traversed.
    node: document

  # Default container for localized messages.
  messages: {}

  # Public functions
  # ----------------

  # Localize the specified `attribute` of all the selected elements.
  attribute: (selector, attribute, name, subs) ->
    for element in @manager.node.querySelectorAll selector
      element.setAttribute attribute, @get name, subs

  # Localize the contents of all the selected elements.
  content: (selector, name, subs) ->
    for element in @manager.node.querySelectorAll selector
      element.innerHTML = @get name, subs

  # Add localized `option` elements to the selected elements.
  options: (selector, name, subs) ->
    for element in @manager.node.querySelectorAll selector
      for value in @get name, subs
        option = document.createElement 'option'
        if _.isString value
          option.text  = option.value = value
        else
          option.text  = value[1]
          option.value = value[0]

        element.appendChild option

  # Get the localized message.
  get: ->
    @manager.get arguments...

  # Localize all relevant elements within the managed node (`document` by default).
  init: (map) ->
    process @manager.node, map

  # Retrieve the accepted languages.
  langs: ->
    @manager.langs arguments...

  # Retrieve the current locale.
  locale: ->
    @manager.locale arguments...

# Configuration
# -------------

# Reconfigure the internationalization manager to work for Chrome extensions.  
# Convenient shorthand for `chrome.i18n.getMessage`.
i18n.manager.get = ->
  chrome.i18n.getMessage arguments...

# Convenient shorthand for `chrome.i18n.getAcceptLanguages`.
i18n.manager.langs = ->
  chrome.i18n.getAcceptLanguages arguments...

# Parse the predefined `@@ui_locale` message.
i18n.manager.locale = ->
  i18n.get('@@ui_locale').replace '_', '-'