# Module dependencies
# -------------------

async    = require 'async'
coffee   = require 'coffee-script'
{exec}   = require 'child_process'
fs       = require 'fs'
{minify} = require 'uglify-js'
Path     = require 'path'
wrench   = require 'wrench'

# Constants
# ---------

COMMENT_COFFEE   = '#'
COMMENT_JS       = '//'
DIST_DIR         = 'dist'
DIST_FILE        = 'Template'
DOCS_DIR         = 'docs'
ENCODING         = 'utf8'
EXT_COFFEE       = '.coffee'
EXT_JS           = '.js'
EXT_JSON         = '.json'
I18N_FILE        = 'messages.json'
IS_WINDOWS       = /^win/i.test process.platform
LOCALES          = ['en']
LOCALES_DIR      = '_locales'
R_COMMENT_COFFEE = /^#/
R_COMMENT_JS     = /^\/\//
R_EXT_COFFEE     = /\.coffee$/i
R_EXT_JS         = /\.js$/i
R_EXT_JSON       = /\.json$/i
SOURCE_DIR       = 'src'
TEMP_DIR         = 'temp'
TEMP_PATH        = Path.join DIST_DIR, TEMP_DIR
TARGET_DIR       = 'bin'
TARGET_SUB_DIRS  = [
  TARGET_DIR
  Path.join TARGET_DIR, LOCALES_DIR
  Path.join TARGET_DIR, 'css'
  Path.join TARGET_DIR, 'images'
  Path.join TARGET_DIR, 'lib'
  Path.join TARGET_DIR, 'pages'
  Path.join TARGET_DIR, 'vendor'
  Path.join TARGET_DIR, 'vendor', 'adapters'
].concat (Path.join TARGET_DIR, LOCALES_DIR, locale for locale in LOCALES)
VENDOR_FILES     = [
  Path.join 'vendor', 'adapters', 'bitly.js'
  Path.join 'vendor', 'adapters', 'google.js'
  Path.join 'vendor', 'mustache.js'
  Path.join 'vendor', 'oauth2.js'
  Path.join 'vendor', 'oauth2_finish.js'
  Path.join 'vendor', 'oauth2_inject.js'
  Path.join 'vendor', 'purl.js'
]
WRITE_MODE       = 0o777

# Helpers
# -------

compile = (path, cb) ->
  console.log "Compiling CoffeeScript: #{path}..."
  code    = fs.readFileSync path, ENCODING
  header  = extractHeader code, R_COMMENT_COFFEE, COMMENT_JS
  newPath = path.replace R_EXT_COFFEE, EXT_JS
  ws      = fs.createWriteStream newPath,
    encoding: ENCODING
    mode:     WRITE_MODE
  ws.on 'close', ->
    fs.unlinkSync path
    console.log "Successfully compiled to #{newPath}!"
    cb?()
  ws.on 'error', cb
  ws.write header
  ws.end coffee.compile(code), ENCODING

extractHeader = (code = '', r_comment, replacement) ->
  header    = ''
  inComment = no
  for line in code.split '\n'
    if r_comment.test line
      inComment = yes
      line      = line.replace r_comment, replacement if replacement
      header   += "#{line.trim()}\n"
    else if inComment
      break
  header

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

getCoffeeFiles = (dir) ->
  files = fs.readdirSync Path.join dir, 'lib'
  for file, i in files when R_EXT_COFFEE.test file
    files[i] = Path.join dir, 'lib', file

messageHandler = (messages) ->
  for message in Object.keys messages
    delete messages[message].description
    if messages[message].placeholders?
      for placeholder of messages[message].placeholders
        delete messages[message].placeholders[placeholder].example

optimize = (path, handler, cb) ->
  console.log "Optimizing: #{path}..."
  code = fs.readFileSync path, ENCODING
  ws   = fs.createWriteStream path,
    encoding: ENCODING
    mode:     WRITE_MODE
  ws.on 'close', ->
    console.log "Successfully optimized #{path}!"
    cb?()
  ws.on 'error', cb
  switch Path.extname path
    when EXT_JS
      header       = extractHeader code, R_COMMENT_JS
      optimization = minify code, fromString: yes
      handler? optimization
      ws.write header
      ws.end optimization.code, ENCODING
    when EXT_JSON
      optimization = JSON.parse code
      handler? optimization
      ws.end JSON.stringify(optimization), ENCODING
    else throw "Cannot optimize file: #{path}"

optimizeMessage  = (file, cb)  -> optimize file, messageHandler, cb
optimizeStandard = (file, cb)  -> optimize file, null, cb

# Tasks
# -----

task 'build', 'Build extension', ->
  console.log 'Building Template...'
  wrench.mkdirSyncRecursive path for path in TARGET_SUB_DIRS
  wrench.copyDirSyncRecursive SOURCE_DIR, TARGET_DIR, forceDelete: yes
  # TODO: Find & delete .git* files
  async.forEach getCoffeeFiles(TARGET_DIR), compile, (err) ->
    throw err if err
    finish 'Build completed!'

task 'dist', 'Create distributable file', ->
  console.log 'Generating distributable....'
  wrench.mkdirSyncRecursive DIST_DIR
  wrench.mkdirSyncRecursive TEMP_PATH
  wrench.copyDirSyncRecursive TARGET_DIR, TEMP_PATH, forceDelete: yes
  async.series [
    (cb) ->
      files = (
        for file in fs.readdirSync TEMP_PATH when R_EXT_JSON.test file
          Path.join TEMP_PATH, file
      )
      async.forEach files, optimizeStandard, (err) -> cb err
    (cb) ->
      path  = Path.join TEMP_PATH, 'lib'
      files = (
        for file in fs.readdirSync path when R_EXT_JS.test file
          Path.join path, file
      )
      async.forEach files, optimizeStandard, (err) -> cb err
    (cb) ->
      files = (Path.join TEMP_PATH, file for file in VENDOR_FILES)
      async.forEach files, optimizeStandard, (err) -> cb err
    (cb) ->
      files = (
        for locale in LOCALES
          Path.join TEMP_PATH, LOCALES_DIR, locale, I18N_FILE
      )
      async.forEach files, optimizeMessage, (err) -> cb err
    (cb) ->
      path = Path.join DIST_DIR, "#{DIST_FILE}.zip"
      fs.exists path, (exists) ->
        if exists then fs.unlink path, cb else cb()
    (cb) ->
      # TODO: Support Windows
      exec "zip -r ../#{DIST_FILE} *", cwd: TEMP_PATH, cb
  ], (err) ->
    throw err if err
    wrench.rmdirSyncRecursive TEMP_PATH
    finish 'Distributable created!'

task 'docs', 'Create documentation', ->
  console.log 'Generating documentation...'
  # TODO: Call docco programmatically
  exec "docco -o #{DOCS_DIR} #{getCoffeeFiles(SOURCE_DIR).join ' '}", (err) ->
    throw err if err
    finish 'Documentation created!'
