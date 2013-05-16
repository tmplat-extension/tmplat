# [Template](http://template-extension.org)  
# (c) 2013 Alasdair Mercer  
# Freely distributable under the MIT license:  
# <http://template-extension.org/license>

# Private classes
# ---------------

# `Class` makes for more readable logs etc. as it overrides `toString` to output the name of the
# implementing class.
class Class

  # Override the default `toString` implementation to provide a cleaner output.
  toString: ->
    @constructor.name

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

  # Transform the given string into title case.
  capitalize: (str) ->
    return str unless str

    str.replace /\w+/g, (word) ->
      word[0].toUpperCase() + word[1..].toLowerCase()

  # Generate a unique key based on the current time and using a randomly generated hexadecimal
  # number of the specified length.
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
    # Join all segments using `separator` and append to the `prefix` before potentially
    # transforming it to upper case.
    key = prefix + parts.join separator

    if upperCase then key.toUpperCase() else key.toLowerCase()

  # Bind `handler` to event indicating that the DOM is ready.
  ready: (context, handler) ->
    unless handler?
      handler = context
      context = window

    if context.jQuery? then context.jQuery handler
    else context.document.addEventListener 'DOMContentLoaded', handler

  # Repeat the string provided the specified number of times.
  repeat: (str = '', repeatStr = str, count = 1) ->
    if count isnt 0
      # Repeat to the right if `count` is positive.
      str += repeatStr for i in [1..count] if count > 0
      # Repeat to the left if `count` is negative.
      str  = repeatStr + str for i in [1..count*-1] if count < 0
    str

  # Start a new timer for the specified `key`.  
  # If a timer already exists for `key`, return the time difference in milliseconds.
  time: (key) ->
    if _.has timings, key then new Date().getTime() - timings[key]
    else timings[key] = new Date().getTime()

  # End the timer for the specified `key` and return the time difference in milliseconds and remove
  # the timer.  
  # If no timer exists for `key`, simply return `0'.
  timeEnd: (key) ->
    if _.has timings, key
      start = timings[key]
      delete timings[key]
      new Date().getTime() - start
    else
      0

  # Convenient shorthand for safely trimming a string to lower case.
  trimToLower: (str = '') ->
    str.trim().toLowerCase()

  # Convenient shorthand for safely trimming a string to upper case.
  trimToUpper: (str = '') ->
    str.trim().toUpperCase()

  # Convenient shorthand for `chrome.extension.getURL`.
  url: ->
    chrome.extension.getURL arguments...

# Public classes
# --------------

# Objects within the extension should extend this class wherever possible.
utils.Class = Class