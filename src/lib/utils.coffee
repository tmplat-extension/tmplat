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
i18nAttributes.push key for own key of i18nHandlers
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
    for own prop, subMap2 of subMap when prop is element.id
      for own prop2, target of subMap2 when prop2 is value
        subs = target
        break
      break
  subs

# Utilities setup
# ---------------

utils = window.utils =

  # Public functions
  # ----------------

  # Retrieve the first entity/all entities that pass the specified `filter`.
  query: (entities, singular, filter) ->
    return entity for entity in entities when filter entity if singular
    entity for entity in entities when filter entity

  # Data functions
  # --------------

  # Determine whether or not the specified `keys` exist in `localStorage`.
  exists: (keys...) ->
    return no for key in keys when not localStorage.hasOwnProperty key
    yes

  # Retrieve the value associated with the specified `keys` from
  # `localStorage`.  
  # If the value is found, parse it as JSON before being returning it;
  # otherwise return `undefined`.
  get: (keys...) ->
    if keys.length is 1
      value = localStorage[keys[0]]
      if value? then JSON.parse value else value
    else
      value = {}
      value[key] = @get key for key in keys
      value

  # Initialize the value of the specified key(s) in `localStorage`.  
  # `keys` can either be a string for a single key (in which case
  # `defaultValue` should also be specified) or a map of key/default value
  # pairs.  
  # If the value is currently `undefined`, assign the specified default value;
  # otherwise reassign itself.
  init: (keys = {}, defaultValue) ->
    switch typeof keys
      when 'object'
        @set key, @get(key) ? defaultValue for own key, defaultValue of keys
      when 'string' then @set keys, @get(keys) ? defaultValue

  # Remove the specified `keys` from `localStorage`.  
  # If only one key is specified then the current value of that key is returned
  # after it has been removed.
  remove: (keys...) ->
    if keys.length is 1
      value = @get keys[0]
      delete localStorage[keys[0]]
      return value
    delete localStorage[key] for key in keys

  # Copy the value of the existing key to that of the new key then remove the
  # old key from `localStorage`.  
  # If the old key doesn't exist in `localStorage`, assign the specified
  # default value to it instead.
  rename: (oldKey, newKey, defaultValue) ->
    if @exists oldKey
      @init newKey, @get oldKey
      @remove oldKey
    else
      @init newKey, defaultValue

  # Search `localStorage` for all keys that match the specified regular
  # expression.
  search: (regex) ->
    key for own key of localStorage when regex.test key

  # Set the value of the specified key(s) in `localStorage`.  
  # `keys` can either be a string for a single key (in which case `value`
  # should also be specified) or a map of key/value pairs.  
  # If the specified value is `undefined`, assign that value directly to the
  # key; otherwise transform it to a JSON string beforehand.
  set: (keys, value) ->
    switch typeof keys
      when 'object'
        for own key, value of keys
          localStorage[key] = if value? then JSON.stringify value else value
      when 'string'
        oldValue = @get keys
        localStorage[keys] = if value? then JSON.stringify value else value
        oldValue

  # For each of the specified `keys`, retrieve their value in `localStorage`
  # and pass it, along with the key, to the `callback` function provided.  
  # If `callback` returns a value that is not `undefined`, then that value will
  # be assigned to the key in `localStorage`. This functionality is very useful
  # when just manipulating existing values but can be used in any case.
  sync: (keys..., callback) ->
    @set key, callback?(@get(key), key) ? @get key for key in keys

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
      element.setAttribute attribute, @i18n value, subs

  # Internationalize the contents of all the selected elements.
  i18nContent: (selector, value, subs) ->
    elements = document.querySelectorAll selector
    # Ensure the substitution string(s) are in an array.
    subs = [subs] if typeof subs is 'string'
    element.innerHTML = @i18n value, subs for element in elements

  # Perform all internationalization setup required for the current page.
  i18nSetup: (subMap) ->
    i18nProcess document, subMap

  # Log functions
  # -------------

  # Output all failed `assertions`.
  assert: (assertions...) ->
    console.assert assertion for assertion in assertions if @logging()

  # Create/increment a counter and output its current count for all `names`.
  count: (names...) ->
    console.count name for name in names if @logging()

  # Output all debug `entries`.
  debug: (entries...) ->
    console.debug entry for entry in entries if @logging()

  # Display an interactive listing of the properties of all `entries`.
  dir: (entries...) ->
    console.dir entry for entry in entries if @logging()

  # Output all error `entries`.
  error: (entries...) ->
    console.error entry for entry in entries if @logging()

  # Output all informative `entries`.
  info: (entries...) ->
    console.info entry for entry in entries if @logging()

  # Output all general `entries`.
  log: (entries...) ->
    console.log entry for entry in entries if @logging()

  # Indicates whether or not logging is enabled.
  logging: ->
    @get 'log'

  # Start a timer for all `names`.
  time: (names...) ->
    console.time name for name in names if @logging()

  # Stop a timer and output its elapsed time in milliseconds for all `names`.
  timeEnd: (names...) ->
    console.timeEnd name for name in names if @logging()

  # Output a stack trace.
  trace: ->
    console.trace() if @logging()

  # Output all warning `entries`.
  warn: (entries...) ->
    console.warn entry for entry in entries if @logging()