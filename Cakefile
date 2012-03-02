# Strings
# -------

COPYRIGHT = """
  // [Template](http://neocotic.com/template)
  // (c) #{new Date().getFullYear()} Alasdair Mercer
  // Freely distributable under the MIT license.
  // For all details and documentation:
  // http://neocotic.com/template
"""

# Files & directories
# -------------------

DIST_DIR        = 'dist'
DIST_FILE       = 'Template'
DOCS_DIR        = 'docs'
SOURCE_DIR      = 'src'
TEMP_DIR        = 'temp'
TARGET_DIR      = 'bin'
TARGET_SUB_DIRS = [
  TARGET_DIR
  "#{TARGET_DIR}/_locales"
  "#{TARGET_DIR}/_locales/en"
  "#{TARGET_DIR}/images"
  "#{TARGET_DIR}/lib"
  "#{TARGET_DIR}/pages"
  "#{TARGET_DIR}/vendor"
  "#{TARGET_DIR}/vendor/adapters"
]
VENDOR_FILES    = [
  'vendor/adapters/bitly.js'
  'vendor/adapters/google.js'
  'vendor/mustache.js'
  'vendor/oauth2.js'
  'vendor/oauth2_inject.js'
]

# Commands
# --------

COMPILE = '`which coffee`'
DOCS    = '`which docco`'
MINIFY  = '`which uglifyjs`'

# Functions
# ---------

{exec} = require 'child_process'

# Tasks
# -----

task 'build', 'Build extension', ->
  console.log 'Building Template...'
  for path in TARGET_SUB_DIRS
    exec "mkdir -p #{path}", (error) -> throw error if error
  exec [
    "cp -r #{SOURCE_DIR}/* #{TARGET_DIR}"
    "find #{TARGET_DIR}/ -name '.git*' -print0 | xargs -0 -IFILES rm FILES"
    "#{COMPILE} --compile #{TARGET_DIR}/lib/"
    "rm -f #{TARGET_DIR}/lib/*.coffee"
    "for file in #{TARGET_DIR}/lib/*.js; do echo \"#{COPYRIGHT}\" > $file.tmp"
    'cat $file >> $file.tmp'
    'mv -f $file.tmp $file; done'
  ].join('&&'), (error) -> throw error if error

task 'clean', 'Cleans directories', ->
  console.log 'Spring cleaning...'
  exec [
    "rm -rf #{TARGET_DIR}"
    "rm -rf #{DIST_DIR}"
  ].join('&&'), (error) -> throw error if error

task 'dist', 'Create distributable file', ->
  console.log 'Generating distributable....'
  vfiles = "'#{VENDOR_FILES.join '\' \''}'"
  exec [
    "mkdir -p #{DIST_DIR}"
    "mkdir -p #{DIST_DIR}/#{TEMP_DIR}"
    "cp -r #{TARGET_DIR}/* #{DIST_DIR}/#{TEMP_DIR}"
    "cd #{DIST_DIR}/#{TEMP_DIR}"
    "for file in lib/*.js; do #{MINIFY} $file > $file.tmp"
    'mv -f $file.tmp $file; done'
    "for vfile in #{vfiles}; do #{MINIFY} $vfile > $vfile.tmp"
    'mv -f $vfile.tmp $vfile; done'
    "zip -r ../#{DIST_FILE} *"
    'cd ../'
    "rm -rf #{TEMP_DIR}"
  ].join('&&'), (error) -> throw error if error

task 'docs', 'Create documentation', ->
  console.log 'Generating documentation...'
  exec "#{DOCS} #{SOURCE_DIR}/lib/*.coffee", (error) -> throw error if error