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

# Utilities setup
# ---------------

utils = window.utils = new class Utils extends Class

  # Public functions
  # ----------------

  # Create a safe wrapper for the callback specified function.
  callback: (fn) ->
    (args...) ->
      if _.isFunction fn
        fn args...
        true

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
      parts.push _.random min, max
    # Convert segments to their hexadecimal (base 16) forms.
    parts[i] = part.toString 16 for part, i in parts
    # Join all segments using `separator` and append to the `prefix` before
    # potentially transforming it to upper case.
    key = prefix + parts.join separator
    if upperCase then key.toUpperCase() else key.toLowerCase()

  # Retrieve the first entity/all entities that pass the specified `filter`.
  query: (entities, singular, filter) ->
    if singular
      return entity for entity in entities when filter entity
    else
      entity for entity in entities when filter entity

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

  # Convenient shorthand for `chrome.runtime.getURL`.
  url: -> chrome.runtime.getURL arguments...

# Public classes
# --------------

# Objects within the extension should extend this class wherever possible.
utils.Class = Class