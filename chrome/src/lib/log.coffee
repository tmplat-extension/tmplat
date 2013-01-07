# [Template](http://neocotic.com/template)  
# (c) 2012 Alasdair Mercer  
# Freely distributable under the MIT license.  
# For all details and documentation:  
# <http://neocotic.com/template>

# Private constants
# -----------------

# Define the different logging levels privately first.
LEVELS =
  trace:       10
  information: 20
  debug:       30
  warning:     40
  error:       50

# Private variables
# -----------------

# Ensure that all logs are sent to the background pages console.
{console} = chrome.extension.getBackgroundPage()

# Private functions
# -----------------

# Determine whether or not logging is enabled for the specified `level`.
loggable = (level) -> log.config.enabled and level >= log.config.level

# Logging setup
# -------------

log = window.log = new class Log extends utils.Class

  # Public constants
  # ----------------

  # Expose the available logging levels.
  TRACE:       LEVELS.trace
  INFORMATION: LEVELS.information
  DEBUG:       LEVELS.debug
  WARNING:     LEVELS.warning
  ERROR:       LEVELS.error

  # A collection of all of the levels to allow iteration.
  LEVELS: (
    array = []
    array.push name: key, value: value for own key, value of LEVELS
    array.sort (a, b) -> a.value - b.value
  )

  # Public variables
  # ----------------

  # Hold the current conguration for the logger.
  config:
    enabled: no
    level:   LEVELS.debug

  # Public functions
  # ----------------

  # Create/increment a counter and output its current count for all `names`.
  count: (names...) ->
    console.count name for name in names if loggable @DEBUG

  # Output all debug `entries`.
  debug: (entries...) ->
    console.debug entry for entry in entries if loggable @DEBUG

  # Display an interactive listing of the properties of all `entries`.
  dir: (entries...) ->
    console.dir entry for entry in entries if loggable @DEBUG

  # Output all error `entries`.
  error: (entries...) ->
    console.error entry for entry in entries if loggable @ERROR

  # Output all informative `entries`.
  info: (entries...) ->
    console.info entry for entry in entries if loggable @INFORMATION

  # Output all general `entries`.
  out: (entries...) ->
    console.log entry for entry in entries if @config.enabled

  # Start a timer for all `names`.
  time: (names...) ->
    console.time name for name in names if loggable @DEBUG

  # Stop a timer and output its elapsed time in milliseconds for all `names`.
  timeEnd: (names...) ->
    console.timeEnd name for name in names if loggable @DEBUG

  # Output a stack trace.
  trace: (caller = @trace) ->
    console.log new @StackTrace(caller).stack if loggable @TRACE

  # Output all warning `entries`.
  warn: (entries...) ->
    console.warn entry for entry in entries if loggable @WARNING

# Public classes
# --------------

# `StackTrace` allows the current stack trace to be retrieved in the easiest
# way possible.
class log.StackTrace extends utils.Class

  # Create a new instance of `StackTrace` for the `caller`.
  constructor: (caller = log.StackTrace) ->
    # Create the stack trace and assign it to a new `stack` property.
    Error.captureStackTrace this, caller

# Configuration
# -------------

# Initialize logging.
if store?
  store.init 'logger', {}
  store.modify 'logger', (logger) ->
    logger.enabled ?= no
    logger.level   ?= LEVELS.debug
    log.config = logger