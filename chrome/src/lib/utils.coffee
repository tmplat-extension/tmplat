# [Template](http://neocotic.com/template)  
# (c) 2013 Alasdair Mercer  
# Freely distributable under the MIT license.  
# For all details and documentation:  
# <http://neocotic.com/template>

# Private classes
# ---------------

# `Class` makes for more readable logs etc. as it overrides `toString` to output the name of the
# implementing class.
class Class

  # Override the default `toString` implementation to provide a cleaner output.
  toString: ->
    @constructor.name

# Private constants
# -----------------

# Regular expression used to split event names.
R_EVENTS = /\s+/

# Private variables
# -----------------

# Mapping of all timers currently being managed.
timings = {}

# Private functions
# -----------------

# TODO: Comment
eventHandler = (obj, action, name, args...) ->
  return yes unless name

  # TODO: Comment
  if _.isObject
    obj[action] key, callback, args... for key, callback of name
    return no

  # TODO: Comment
  if R_EVENTS.test name
    obj[action] name, args... for name in name.split R_EVENTS
    return no

  # TODO: Comment
  yes

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

  # Convenient shorthand for `chrome.runtime.getURL`.
  url: ->
    chrome.runtime.getURL arguments...

# Public classes
# --------------

# TODO: Comment
class utils.Events extends Class

  # Create a new instance of `Events`
  constructor: ->
    @_events = {}

  # Remove registered callback event(s) based on the arguments provided.  
  # Remove all events with the given `callback` function if `context is `null`.  
  # Remove all events under the given `name` if `callback` is `null`.  
  # Remove *all* events if `name` is `null`.
  off: (name, callback, context) ->
    return this if _.isEmpty @_events or not eventHandler this, 'off', name, callback, context

    # TODO: Comment
    unless name or callback or context
      @_events = {}
      return this

    # TODO: Comment
    names = if name then [name] else _.keys @_events
    for name in names
      continue unless events = @_events[name]

      @_events[name] = retain = []

      # TODO: Comment
      if callback or context
        for evt in events
          if ((callback and callback isnt evt.callback and callback isnt evt.callback._callback) or
              (context and context isnt evt.context))
            retain.push evt

      # TODO: Comment
      delete @_events[name] if _.isEmpty retain

    this

  # Bind a specific `callback` function to an event with the given `name`.  
  # Passing `"all"` will bind the `callback` whenever any events are trigger, passing the event
  # name as the first argument.
  on: (name, callback, context) ->
    return this if not eventHandler(this, 'on', name, callback, context) or not callback

    context ?= this

    events = @_events[name] or= []
    events.push {callback, context}

    this

  # Bind a specific `callback` function to an event with the given `name` which is only to be
  # triggered a single time.  
  # `callback` will be unregistered once it has been invoked.
  once: (name, callback, context) ->
    return this if not eventHandler(this, 'once', name, callback, context) or not callback

    # TODO: Comment
    self = this
    once = _.once ->
      self.off name, once
      callback.apply this, arguments
    once._callback = callback

    @on name, once, context

  # TODO: Comment
  trigger: (name, args...) ->
    return this if _.isEmpty @_events or not eventHandler this, 'trigger', name, args...

    # TODO: Comment
    evt.callback.apply evt.context, args for evt in @_events[name] ? []
    evt.callback.apply evt.context, [name].concat args for evt in @_events.all ? []

    this

# Objects within the extension should extend this class wherever possible.
utils.Class = Class