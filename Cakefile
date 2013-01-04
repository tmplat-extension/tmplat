# Module dependencies
# -------------------

async  = require 'async'
{exec} = require 'child_process'

# Constants
# ---------

BROWSERS = ['chrome']

# Helpers
# -------

finish = (header = '') ->
  message  = """
    #{header}

    Total time:
  """
  time     = process.uptime()
  secs     = parseInt time
  mins     = parseInt secs / 60
  secs    %= 60 if mins > 0
  secs     = time.toFixed 3 if secs < 1
  message += " #{secs} second"
  message += 's' if secs isnt 1
  if mins > 0
    message += " #{mins} minute"
    message += 's' if mins isnt 1
  console.log message

subTask = (name) -> (dir, cb) ->
  child = exec "cake #{name}", cwd: dir, cb
  child.stderr.resume()
  child.stderr.pipe process.stderr
  child.stdout.resume()
  child.stdout.pipe process.stdout

# Tasks
# -----

task 'build', 'Build all extensions', ->
  console.log 'Building Template for all browsers...'
  async.forEachSeries BROWSERS, subTask('build'), (err) ->
    throw err if err
    finish 'Builds completed!'

for browser in BROWSERS
  task "build-#{browser}", "Build #{browser} extension", ->
    subTask('build') browser, (err) -> throw err if err

task 'dist', 'Create all distributable files', ->
  console.log 'Generating distributables for all browsers...'
  async.forEachSeries BROWSERS, subTask('dist'), (err) ->
    throw err if err
    finish 'Distributables created!'

for browser in BROWSERS
  task "dist-#{browser}", "Create #{browser} distributable file", ->
    subTask('dist') browser, (err) -> throw err if err

task 'docs', 'Create all documentation', ->
  console.log 'Generating documentation for all browsers...'
  async.forEachSeries BROWSERS, subTask('docs'), (err) ->
    throw err if err
    finish 'Documentation created!'

for browser in BROWSERS
  task "docs-#{browser}", "Create #{browser} documentation", ->
    subTask('docs') browser, (err) -> throw err if err
