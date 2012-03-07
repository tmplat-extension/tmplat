# [Template](http://neocotic.com/template)  
# (c) 2012 Alasdair Mercer  
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

  # Call a function asynchronously with the arguments provided and then pass
  # the returned value to `callback` if it was specified.
  async: (fn, args..., callback) ->
    if callback? and typeof callback isnt 'function'
      args.push callback
      callback = null
    setTimeout ->
      result = fn args...
      callback? result
    , 0

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

  # Retrieve the first entity/all entities that pass the specified `filter`.
  query: (entities, singular, filter) ->
    if singular
      return entity for entity in entities when filter entity
    else
      entity for entity in entities when filter entity

  # Generate a random number between the `min` and `max` values provided.
  random: (min, max) -> Math.floor(Math.random() * (max - min + 1)) + min

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

  # Convenient shorthand for `chrome.extension.getURL`.
  url: -> chrome.extension.getURL arguments...

# Public classes
# --------------

# Objects within the extension should extend this class wherever possible.
utils.Class = Class

# `Runner` allows asynchronous code to be executed dependently in an
# organized manner.
class utils.Runner extends utils.Class

  # Create a new instance of `Runner`.
  constructor: -> @queue = []

  # Finalize the process by resetting this `Runner` an then calling `onfinish`,
  # if it was specified when `run` was called.  
  # Any arguments passed in should also be passed to the registered `onfinish`
  # handler.
  finish: (args...) ->
    @queue = []
    @started = no
    @onfinish? args...

  # Remove the next task from the queue and call it.  
  # Finish up if there are no more tasks in the queue, ensuring any `args` are
  # passed along to `onfinish`.
  next: (args...) ->
    if @started
      if @queue.length
        ctx = fn = null
        task = @queue.shift()
        # Determine what context the function should be executed in.
        switch typeof task.reference
          when 'function' then fn = task.reference
          when 'string'
            ctx = task.context
            fn  = ctx[task.reference]
        # Unpack the arguments where required.
        if typeof task.args is 'function'
          task.args = task.args.apply null
        fn?.apply ctx, task.args
        return yes
      else
        @finish args...
    no

  # Add a new task to the queue using the values provided.  
  # `reference` can either be the name of the property on the `context` object
  # which references the target function or the function itself. When the
  # latter, `context` is ignored and should be `null` (not omitted). All of the
  # remaining `args` are passed to the function when it is called during the
  # process.
  push: (context, reference, args...) -> @queue.push
    args:      args
    context:   context
    reference: reference

  # Add a new task to the queue using the *packed* values provided.  
  # This method varies from `push` since the arguments are provided in the form
  # of a function which is called immediately before the function, which allows
  # any dependent arguments to be correctly referenced.
  pushPacked: (context, reference, packedArgs) -> @queue.push
    args:      packedArgs
    context:   context
    reference: reference

  # Start the process by calling the first task in the queue and register the
  # `onfinish` function provided.
  run: (@onfinish) ->
    @started = yes
    @next()

  # Remove the specified number of tasks from the front of the queue.
  skip: (count = 1) -> @queue.splice 0, count