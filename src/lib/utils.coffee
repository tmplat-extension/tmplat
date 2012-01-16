# [Template](http://neocotic.com/template)  
# (c) 2012 Alasdair Mercer  
# Freely distributable under the MIT license.  
# For all details and documentation:  
# <http://neocotic.com/template>

# Private variables
# -----------------

# Mapping for internationalization handlers.  
# Each handler represents an attribute (based on the property name) and is
# called for each attribute found in the current `document`.
i18nHandlers   =

  # Replace the HTML content of `element` with the message looked up for
  # `value`.
  'i18n-content': (element, value, subMap) ->
    subs = i18nSubs element, value, subMap
    element.innerHTML = utils.i18n value, subs

  # Replace the value of the properties and/or attributes of `element` with the
  # messages looked up for their corresponding values.
  'i18n-values':  (element, value, subMap) ->
    subs  = i18nSubs element, value, subMap
    parts = value.replace(/\s/g, '').split ';'
    for part in parts
      prop = part.match /^([^:]+):(.+)$/
      if prop
        propName = prop[1]
        propExpr = prop[2]
        if propName.indexOf('.') is 0
          path = propName.slice(1).split '.'
          obj = element
          obj = obj[path.shift()] while obj and path.length > 1
          if obj
            obj[path] = utils.i18n value, subs
            i18nProcess element, subMap if path is 'innerHTML'
        else
          element.setAttribute propName, utils.i18n propExpr, subs
# List of internationalization attributes/handlers available.
i18nAttributes = []
i18nAttributes.push key for key of i18nHandlers
# Selector containing the available internationalization attributes/handlers
# which is used by `i18nProcess` to query all elements.
i18nSelector   = "[#{i18nAttributes.join '],['}]"

# Private functions
# -----------------

# Find all elements to be internationalized and call their corresponding
# handler(s).
i18nProcess = (node, subMap) ->
  for element in node.querySelectorAll i18nSelector
    for name in i18nAttributes
      attribute = element.getAttribute name
      i18nHandlers[name] element, attribute, subMap if attribute?

# Find an array of substitution strings using the element's ID and the message
# key as the mapping.
i18nSubs = (element, value, subMap) ->
  if subMap
    for prop of subMap when subMap.hasOwnProperty(prop) and prop is element.id
      for subProp of subMap[prop] when subMap[prop].hasOwnProperty subProp
        if subProp is value
          subs = subMap[prop][subProp]
          break
      break
  return subs

# Utilities setup
# ---------------

utils = window.utils =

  # Public functions
  # ----------------

  # Retrieve the first entity/all entities that pass the specified `filter`.
  query: (entities, singular, filter) ->
    if singular
      return entity for entity in entities when filter entity
    else
      results = []
      results.push entity for entity in entities when filter entity
      return results

  # Data functions
  # --------------

  # Determine whether or not the specified key exists in `localStorage`.
  exists: (key) ->
    return localStorage.hasOwnProperty key

  # Retrieve the value associated with the specified key from `localStorage`.  
  # If the value is found, parse it as JSON before being returning it;
  # otherwise return `undefined`.
  get: (key) ->
    value = localStorage[key]
    return if value? then JSON.parse value else value

  # Initialize the value of the specified key in `localStorage`.  
  # If the value is currently `undefined`, assign the specified default value;
  # otherwise reassign itself.
  init: (key, defaultValue) ->
    value = utils.get key
    return utils.set key, value ? defaultValue

  # Remove the specified key from `localStorage`.
  remove: (key) ->
    value = utils.get key
    delete localStorage[key]
    return value

  # Copy the value of the existing key to that of the new key then remove the
  # old key from `localStorage`.  
  # If the old key doesn't exist in `localStorage`, assign the specified
  # default value to it instead.
  rename: (oldKey, newKey, defaultValue) ->
    if utils.exists oldKey
      utils.init newKey, utils.get oldKey
      utils.remove oldKey
    else
      utils.init newKey, defaultValue

  # Set the value of the specified key in `localStorage`.  
  # If the specified value is `undefined`, assign that value directly to the
  # key; otherwise transform it to a JSON string beforehand.
  set: (key, value) ->
    oldValue = utils.get key
    localStorage[key] = if value? then JSON.stringify value else value
    return oldValue

  # Internationalization functions
  # ------------------------------

  # Convenient shorthand for `chrome.i18n.getMessage`.
  i18n: ->
    chrome.i18n.getMessage arguments...

  # Internationalize the specified attribute of all the selected elements.
  i18nAttribute: (selector, attribute, value, subs) ->
    elements = document.querySelectorAll selector
    # Ensure the substitution string(s) are in an array.
    subs = [subs] if typeof subs is 'string'
    for element in elements
      element.setAttribute attribute, utils.i18n value, subs

  # Internationalize the contents of all the selected elements.
  i18nContent: (selector, value, subs) ->
    elements = document.querySelectorAll selector
    # Ensure the substitution string(s) are in an array.
    subs = [subs] if typeof subs is 'string'
    element.innerHTML = utils.i18n value, subs for element in elements

  # Perform all internationalization setup required for the current page.
  i18nSetup: (subMap) ->
    i18nProcess document, subMap

  # Log functions
  # -------------

  # Output all failed `assertions`.
  assert: (assertions...) ->
    console.assert assertion for assertion in assertions if utils.logging()

  # Create/increment a counter and output its current count for all `names`.
  count: (names...) ->
    console.count name for name in names if utils.logging()

  # Output all debug `entries`.
  debug: (entries...) ->
    console.debug entry for entry in entries if utils.logging()

  # Display an interactive listing of the properties of all `entries`.
  dir: (entries...) ->
    console.dir entry for entry in entries if utils.logging()

  # Output all error `entries`.
  error: (entries...) ->
    console.error entry for entry in entries if utils.logging()

  # Output all informative `entries`.
  info: (entries...) ->
    console.info entry for entry in entries if utils.logging()

  # Output all general `entries`.
  log: (entries...) ->
    console.log entry for entry in entries if utils.logging()

  # Indicates whether or not logging is enabled.
  logging: ->
    utils.get 'log'

  # Start a timer for all `names`.
  time: (names...) ->
    console.time name for name in names if utils.logging()

  # Stop a timer and output its elapsed time in milliseconds for all `names`.
  timeEnd: (names...) ->
    console.timeEnd name for name in names if utils.logging()

  # Output a stack trace.
  trace: ->
    console.trace() if utils.logging()

  # Output all warning `entries`.
  warn: (entries...) ->
    console.warn entry for entry in entries if utils.logging()