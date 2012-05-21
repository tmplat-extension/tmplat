# Module dependencies
# -------------------

coffee = require 'coffee-script'
{exec} = require 'child_process'
fs     = require 'fs'
jsp    = require('uglify-js').parser
pro    = require('uglify-js').uglify
wrench = require 'wrench'

# Flags
# -----

IS_WINDOWS = /^win/i.test process.platform

# Strings
# -------

COPYRIGHT = """
  // [Template](http://neocotic.com/template)
  // (c) #{new Date().getFullYear()} Alasdair Mercer
  // Freely distributable under the MIT license.
  // For all details and documentation:
  // http://neocotic.com/template

"""
ENCODING  = 'utf8'
MODE      = 0777

# Files & directories
# -------------------

DIST_DIR        = 'dist'
DIST_FILE       = 'Template'
DOCS_DIR        = 'docs'
I18N_FILE       = 'messages.json'
LOCALES         = ['en']
LOCALES_DIR     = '_locales'
SOURCE_DIR      = 'src'
TEMP_DIR        = 'temp'
TARGET_DIR      = 'bin'
TARGET_SUB_DIRS = [
  TARGET_DIR
  "#{TARGET_DIR}/#{LOCALES_DIR}"
  "#{TARGET_DIR}/css"
  "#{TARGET_DIR}/images"
  "#{TARGET_DIR}/lib"
  "#{TARGET_DIR}/pages"
  "#{TARGET_DIR}/vendor"
  "#{TARGET_DIR}/vendor/adapters"
].concat ("#{TARGET_DIR}/#{LOCALES_DIR}/#{locale}" for locale in LOCALES)
VENDOR_FILES    = [
  'vendor/adapters/bitly.js'
  'vendor/adapters/google.js'
  'vendor/jquery.url.js'
  'vendor/mustache.js'
  'vendor/oauth2.js'
  'vendor/oauth2_inject.js'
]

# Helpers
# -------

compile = (path) ->
  ws = fs.createWriteStream path.replace(/\.coffee$/i, '.js'),
    encoding : ENCODING
    mode     : MODE
  ws.write COPYRIGHT
  ws.end coffee.compile(fs.readFileSync path, ENCODING), ENCODING
  ws.on 'close', -> fs.unlinkSync path

minify = (path) ->
  switch path.match(/\.([^\.]+)$/)[1].toLowerCase()
    when 'js'
      ast = jsp.parse fs.readFileSync path, ENCODING
      ast = pro.ast_mangle ast
      ast = pro.ast_squeeze ast
      ws = fs.createWriteStream path, encoding: ENCODING, mode: MODE
      ws.write COPYRIGHT
      ws.end pro.gen_code ast
    when 'json'
      obj = JSON.parse fs.readFileSync path, ENCODING
      ws = fs.createWriteStream path, encoding: ENCODING, mode: MODE
      ws.end JSON.stringify obj
    else throw "Cannot minify file: #{path}"

# Tasks
# -----

task 'build', 'Build extension', ->
  console.log 'Building Template...'
  wrench.mkdirSyncRecursive path for path in TARGET_SUB_DIRS
  wrench.copyDirSyncRecursive SOURCE_DIR, TARGET_DIR
  # TODO: Find & delete .git* files
  for file in fs.readdirSync "#{TARGET_DIR}/lib" when /\.coffee$/i.test file
    compile "#{TARGET_DIR}/lib/#{file}"

task 'clean', 'Cleans directories', ->
  console.log 'Spring cleaning...'
  wrench.rmdirSyncRecursive TARGET_DIR, yes
  wrench.rmdirSyncRecursive DIST_DIR, yes

task 'dist', 'Create distributable file', ->
  console.log 'Generating distributable....'
  wrench.mkdirSyncRecursive DIST_DIR
  wrench.mkdirSyncRecursive "#{DIST_DIR}/#{TEMP_DIR}"
  wrench.copyDirSyncRecursive TARGET_DIR, "#{DIST_DIR}/#{TEMP_DIR}"
  for file in fs.readdirSync "#{DIST_DIR}/#{TEMP_DIR}/lib"
    minify "#{DIST_DIR}/#{TEMP_DIR}/lib/#{file}" if /\.js$/i.test file
  minify "#{DIST_DIR}/#{TEMP_DIR}/#{file}" for file in VENDOR_FILES
  for locale in LOCALES
    minify "#{DIST_DIR}/#{TEMP_DIR}/#{LOCALES_DIR}/#{locale}/#{I18N_FILE}"
  # TODO: Support Windows
  exec [
    "cd #{DIST_DIR}/#{TEMP_DIR}"
    "zip -r ../#{DIST_FILE} *"
    'cd ../'
  ].join('&&'), (err) ->
    throw err if err
    wrench.rmdirSyncRecursive "#{DIST_DIR}/#{TEMP_DIR}", yes

task 'docs', 'Create documentation', ->
  console.log 'Generating documentation...'
  files = (
    for file in fs.readdirSync "#{SOURCE_DIR}/lib" when /\.coffee$/i.test file
      "#{SOURCE_DIR}/lib/#{file}"
  )
  exec "docco #{files.join ' '}", (err) -> throw err if err