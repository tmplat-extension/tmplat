# [Template](http://neocotic.com/template)  
# (c) 2013 Alasdair Mercer  
# Freely distributable under the MIT license.  
# For all details and documentation:  
# <http://neocotic.com/template>

# Private classes
# ---------------

# `Class` makes for more readable logs etc. as it overrides `toString` to
# output the name of the implementing class.
class Class

  # Override the default `toString` implementation to provide a cleaner output.
  toString: -> @constructor.name

# Private variables
# -----------------

# Mapping of all timers currently being managed.
timings = {}
# Map of class names to understable types.
typeMap = {}
# Populate the type map for all classes.
[
  'Boolean'
  'Number'
  'String'
  'Function'
  'Array'
  'Date'
  'RegExp'
  'Object'
].forEach (name) ->
  typeMap["[object #{name}]"] = name.toLowerCase()

# Utilities setup
# ---------------

utils = window.utils = new class Utils extends Class

  # Public functions
  # ----------------

  # Create a clone of an object.
  # TODO: Replace with Underscore?
  clone: (obj, deep) ->
    return obj unless @isObject obj
    return obj.slice() if @isArray obj
    copy = {}
    for own key, value of obj
      copy[key] = if deep then @clone value, yes else value
    copy

  # Indicate whether an object is an array.
  # TODO: Replace with jQuery and/or Underscore?
  isArray: Array.isArray or (obj) -> 'array' is @type obj

  # Indicate whether an object is an object.
  # TODO: Replace with jQuery and/or Underscore?
  isObject: (obj) -> obj is Object obj

  # Generate a unique key based on the current time and using a randomly
  # generated hexadecimal number of the specified length.
  keyGen: (separator = '.', length = 5, prefix = '', upperCase = yes) ->
    parts = []
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
    # Join all segments using `separator` and append to the `prefix` before
    # potentially transforming it to upper case.
    key = prefix + parts.join separator
    if upperCase then key.toUpperCase() else key.toLowerCase()

  # Convenient shorthand for the different types of `onMessage` methods
  # available in the chrome API.  
  # This also supports the old `onRequest` variations for backwards
  # compatibility.
  onMessage: (type = 'extension', external, args...) ->
    base = chrome[type]
    base = chrome.extension if not base and type is 'runtime'
    if external
      base = base.onMessageExternal or base.onRequestExternal
    else
      base = base.onMessage or base.onRequest
    base.addListener args...

  # Retrieve the first entity/all entities that pass the specified `filter`.
  query: (entities, singular, filter) ->
    if singular
      return entity for entity in entities when filter entity
    else
      entity for entity in entities when filter entity

  # Generate a random number between the `min` and `max` values provided.
  # TODO: Replace with Underscore?
  random: (min, max) -> Math.floor(Math.random() * (max - min + 1)) + min

  # Bind `handler` to event indicating that the DOM is ready.
  ready: (context, handler) ->
    unless handler?
      handler = context
      context = window
    if context.jQuery?
      context.jQuery handler
    else
      context.document.addEventListener 'DOMContentLoaded', handler

  # Repeat the string provided the specified number of times.
  repeat: (str = '', repeatStr = str, count = 1) ->
    if count isnt 0
      # Repeat to the right if `count` is positive.
      str += repeatStr for i in [1..count] if count > 0
      # Repeat to the left if `count` is negative.
      str = repeatStr + str for i in [1..count*-1] if count < 0
    str

  # Convenient shorthand for the different types of `sendMessage` methods
  # available in the chrome API.  
  # This also supports the old `sendRequest` variations for backwards
  # compatibility.
  sendMessage: (type = 'extension', args...) ->
    base = chrome[type]
    base = chrome.extension if not base and type is 'runtime'
    (base.sendMessage or base.sendRequest).apply base, args

  # Start a new timer for the specified `key`.  
  # If a timer already exists for `key`, return the time difference in
  # milliseconds.
  time: (key) ->
    if timings.hasOwnProperty key
      new Date().getTime() - timings[key]
    else
      timings[key] = new Date().getTime()

  # End the timer for the specified `key` and return the time difference in
  # milliseconds and remove the timer.  
  # If no timer exists for `key`, simply return `0'.
  timeEnd: (key) ->
    if timings.hasOwnProperty key
      start = timings[key]
      delete timings[key]
      new Date().getTime() - start
    else
      0

  # Retrieve the understable type name for an object.
  # TODO: Can this be replaced by jQuery and/or Underscore?
  type: (obj) ->
    if obj? then typeMap[Object::toString.call obj] || 'object' else String obj

  # Convenient shorthand for `chrome.extension.getURL`.
  url: -> chrome.extension.getURL arguments...

# Public classes
# --------------

# Objects within the extension should extend this class wherever possible.
utils.Class = Class