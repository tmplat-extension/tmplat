# [Template](http://neocotic.com/template)  
# (c) 2012 Alasdair Mercer  
# Freely distributable under the MIT license.  
# For all details and documentation:  
# <http://neocotic.com/template>

# Private constants
# -----------------

# Define the different logging levels privately first.
TRACE       = 10
INFORMATION = 20
DEBUG       = 30
WARNING     = 40
ERROR       = 50

# Private variables
# -----------------

# Ensure that all logs are sent to the background pages console.
{console} = chrome.extension.getBackgroundPage()

# Private functions
# -----------------

# Determine whether or not logging is enabled for the specified `level`.
loggable = (level) ->
  log.config.enabled and level >= log.config.level

# Logging setup
# -------------

log = window.log =

  # Public constants
  # ----------------

  # Expose the available logging levels.
  TRACE:       TRACE
  INFORMATION: INFORMATION
  DEBUG:       DEBUG
  WARNING:     WARNING
  ERROR:       ERROR

  # Public variables
  # ----------------

  # Hold the current conguration for the logger.
  config:
    assertions: no
    enabled:    no
    level:      DEBUG

  # Public functions
  # ----------------

  # Output all failed `assertions`.
  assert: (assertions...) ->
    console.assert assertion for assertion in assertions if @config.assertions

  # Create/increment a counter and output its current count for all `names`.
  count: (names...) ->
    console.count name for name in names if loggable DEBUG

  # Output all debug `entries`.
  debug: (entries...) ->
    console.debug entry for entry in entries if loggable DEBUG

  # Display an interactive listing of the properties of all `entries`.
  dir: (entries...) ->
    console.dir entry for entry in entries if loggable DEBUG

  # Output all error `entries`.
  error: (entries...) ->
    console.error entry for entry in entries if loggable ERROR

  # Output all informative `entries`.
  info: (entries...) ->
    console.info entry for entry in entries if loggable INFORMATION

  # Output all general `entries`.
  out: (entries...) ->
    console.log entry for entry in entries if @config.enabled

  # Start a timer for all `names`.
  time: (names...) ->
    console.time name for name in names if loggable DEBUG

  # Stop a timer and output its elapsed time in milliseconds for all `names`.
  timeEnd: (names...) ->
    console.timeEnd name for name in names if loggable DEBUG

  # Output a stack trace.
  trace: (caller = @trace) ->
    console.log new @StackTrace(caller).stack if loggable TRACE

  # Output all warning `entries`.
  warn: (entries...) ->
    console.warn entry for entry in entries if loggable WARNING

# `StackTrace` allows the current stack trace to be retrieved in the easiest
# way possible.
class log.StackTrace

  # Create a new instance of `StackTrace` for the `caller`.
  constructor: (caller) ->
    # Create the stack trace and assign it to a new `stack` property.
    Error.captureStackTrace this, caller

  # Override the default `toString` implementation to provide a cleaner stack
  # trace.
  toString: ->
    'StackTrace'

# Initialize logging.
if store?
  store.init 'logger', {}
  store.modify 'logger', (logger) ->
    logger.assertions ?= no
    logger.enabled    ?= no
    logger.level      ?= DEBUG
    log.config = logger