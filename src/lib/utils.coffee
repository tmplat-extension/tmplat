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
    element.innerHTML = i18n.get value, subs

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
          obj  = element
          obj  = obj[path.shift()] while obj and path.length > 1
          if obj
            obj[path] = i18n.get value, subs
            i18nProcess element, subMap if path is 'innerHTML'
        else
          element.setAttribute propName, i18n.get propExpr, subs
# List of internationalization attributes/handlers available.
i18nAttributes = []
i18nAttributes.push key for own key of i18nHandlers
# Selector containing the available internationalization attributes/handlers
# which is used by `i18nProcess` to query all elements.
i18nSelector   = "[#{i18nAttributes.join '],['}]"
# Mapping of all timers currently being managed by `utils`.
timings        = {}

# Private functions
# -----------------

# Indicate whether or not logging is enabled for specified `level`.
canLog = (level) ->
  log.logger.enabled and log.logger.level >= level

# Attempt to dig down in to the `root` object and stop on the parent of the
# target property.  
# Return the progress of the mining as an array in this structure;
# `[root-object, base-object, base-path, target-parent, target-property]`.
dig = (root, path, force, parseFirst = yes) ->
  result = [root]
  if path and path.indexOf('.') isnt -1
    path   = path.split '.'
    object = base = root[basePath = path.shift()]
    object = base = tryParse object if parseFirst
    while object and path.length > 1
      object = object[path.shift()]
      object = {} if not object? and force
    result.push base, basePath, object, path.shift()
  else
    result.push root, path, root, path
  result

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

# Attempt to parse `value` as a JSON object if it's not `null`; otherwise just
# return `value`.
tryParse = (value) ->
  if value? then JSON.parse value else value

# Attempt to stringify `value` in to a JSON string if it's not `null`;
# otherwise just return `value`.
tryStringify = (value) ->
  if value? then JSON.stringify value else value

# Internationalization setup
# --------------------------

i18n = window.i18n =

  # Public functions
  # ----------------

  # Internationalize the specified attribute of all the selected elements.
  attribute: (selector, attribute, value, subs) ->
    elements = document.querySelectorAll selector
    # Ensure the substitution string(s) are in an array.
    subs = [subs] if typeof subs is 'string'
    element.setAttribute attribute, @get value, subs for element in elements

  # Internationalize the contents of all the selected elements.
  content: (selector, value, subs) ->
    elements = document.querySelectorAll selector
    # Ensure the substitution string(s) are in an array.
    subs = [subs] if typeof subs is 'string'
    element.innerHTML = @get value, subs for element in elements

  # Convenient shorthand for `chrome.i18n.getMessage`.
  get: ->
    chrome.i18n.getMessage arguments...

  # Perform all internationalization substitutions available for the current
  # page.
  init: (subMap) ->
    i18nProcess document, subMap

  # Convenient shorthand for `chrome.i18n.getAcceptLanguages`.
  langs: ->
    chrome.i18n.getAcceptLanguages arguments...

  # Retrieve the current locale.
  locale: ->
    @get('@@ui_locale').replace '_', '-'

# Logging setup
# -------------

log = window.log =

  # Public constants
  # ----------------

  # Error logging level.
  ERROR: 50

  # Debug logging level.
  DEBUG: 30

  # Information logging level.
  INFORMATION: 20

  # Trace logging level.
  TRACE: 10

  # Warning logging level.
  WARNING: 40

  # Public functions
  # ----------------

  # Output all failed `assertions`.
  assert: (assertions...) ->
    console.assert assertion for assertion in assertions if @logger.assertions

  # Create/increment a counter and output its current count for all `names`.
  count: (names...) ->
    console.count name for name in names if canLog @DEBUG

  # Output all debug `entries`.
  debug: (entries...) ->
    console.debug entry for entry in entries if canLog @DEBUG

  # Display an interactive listing of the properties of all `entries`.
  dir: (entries...) ->
    console.dir entry for entry in entries if canLog @DEBUG

  # Output all error `entries`.
  error: (entries...) ->
    console.error entry for entry in entries if canLog @ERROR

  # Output all informative `entries`.
  info: (entries...) ->
    console.info entry for entry in entries if canLog @INFORMATION

  # Hold the information for the current state of the logger.
  logger: {}

  # Output all general `entries`.
  out: (entries...) ->
    console.log entry for entry in entries if @logger.enabled

  # Start a timer for all `names`.
  time: (names...) ->
    console.time name for name in names if canLog @DEBUG

  # Stop a timer and output its elapsed time in milliseconds for all `names`.
  timeEnd: (names...) ->
    console.timeEnd name for name in names if canLog @DEBUG

  # Output a stack trace.
  trace: ->
    console.trace() if @canLog @TRACE

  # Output all warning `entries`.
  warn: (entries...) ->
    console.warn entry for entry in entries if canLog @WARNING

# Storage setup
# -------------

store = window.store =

  # Public functions
  # ----------------

  # Clear all keys from `localStorage`.
  clear: ->
    delete localStorage[key] for own key of localStorage

  # Determine whether or not the specified `keys` exist in `localStorage`.
  exists: (keys...) ->
    return no for key in keys when not localStorage.hasOwnProperty key
    yes

  # Retrieve the value associated with the specified `key` from
  # `localStorage`.  
  # If the value is found, parse it as a JSON object before being returning
  # it.
  get: (key) ->
    parts = dig localStorage, key
    if parts[3]
      value = parts[3][parts[4]]
      # Ensure that the value is parsed if retrieved directly from
      # `localStorage`.
      value = tryParse value if parts[3] is parts[0]
    value

  # Initialize the value of the specified key(s) in `localStorage`.  
  # `keys` can either be a string for a single key (in which case
  # `defaultValue` should also be specified) or a map of key/default value
  # pairs.  
  # If the value is currently `undefined`, assign the specified default value;
  # otherwise reassign itself.
  init: (keys, defaultValue) ->
    switch typeof keys
      when 'object'
        @init key, defaultValue for own key, defaultValue of keys
      when 'string' then @set keys, @get(keys) ? defaultValue

  # For each of the specified `keys`, retrieve their value in `localStorage`
  # and pass it, along with the key, to the `callback` function provided.  
  # This functionality is very useful when just manipulating existing values.
  modify: (keys..., callback) ->
    for key in keys
      value = @get key
      callback? value, key
      @set key, value

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
      @set newKey, @get oldKey
      @remove oldKey
    else
      @set newKey, defaultValue

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
      when 'object' then @set key, value for own key, value of keys
      when 'string'
        oldValue = @get keys
        localStorage[keys] = tryStringify value
        oldValue

# Utilities setup
# ---------------

utils = window.utils =

  # Public functions
  # ----------------

  # Generate a unique key based on the current time and using a randomly
  # generated hexadecimal number of the specified length.
  keyGen: (separator = '.', length = 5) ->
    parts  = []
    # Populate the segment(s) to attempt uniquity.
    parts.push new Date().getTime()
    if length > 0
      min = @repeat '1', '0', if length is 1 then 1 else length - 1
      max = @repeat 'f', 'f', if length is 1 then 1 else length - 1
      min = parseInt min, 16
      max = parseInt max, 16
      parts.push @random min, max
    # Convert segments to their hexadecimal (base 16) forms.
    parts[i] = part.toString 16 for part, i in parts
    # Join all segments and transform to upper case.
    parts.join(separator).toUpperCase()

  # Retrieve the first entity/all entities that pass the specified `filter`.
  query: (entities, singular, filter) ->
    return entity for entity in entities when filter entity if singular
    entity for entity in entities when filter entity

  # Generate a random number between the `min` and `max` values provided.
  random: (min, max) ->
    Math.floor(Math.random() * (max - min + 1)) + min

  # Repeat the string provided the specified number of times.
  repeat: (str = '', repeatStr = str, count = 1) ->
    if count isnt 0
      # Repeat to the right if `count` is positive.
      str += repeatStr for i in [1..count] if count > 0
      # Repeat to the left if `count` is negative.
      str = repeatStr + str for i in [1..count*-1] if count < 0
    str

  # Begin a timer for the specified `key`.
  time: (key) ->
    timings[key] = new Date().getTime()

  # End the timer for the specified `key` and return the time difference in
  # milliseconds.  
  # If no timer exists for `key`, simply return `-1'.
  timeEnd: (key) ->
    if timings.hasOwnProperty key
      start = timings[key]
      delete timings[key]
      new Date().getTime() - start
    else
      -1

# Initialize logging.
store.init 'logger', {}
store.modify 'logger', (logger) ->
  logger.assertions ?= no
  logger.enabled    ?= no
  logger.level      ?= log.DEBUG
  log.logger = logger