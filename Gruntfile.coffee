module.exports = (grunt) ->

  # Configuration
  # -------------

  pkg = grunt.file.readJSON 'package.json'

  grunt.initConfig {

    pkg

    clean:
      build: 'bin/*'

      dist:      'dist/*'
      distAfter: 'dist/temp/'

      docs: 'docs/*'

    compress:
      dist:
        files: [
          expand: true
          cwd:    'dist/temp/'
          src:    '**'
          dest:   'dist/'
        ]
        options:
          archive: 'dist/Template.zip'
          level:   9
          pretty:  yes

    concat:
      build:
        files: [
          expand: yes
          cwd:    'bin/lib/'
          src:    '*.js'
          dest:   'bin/lib/'
        ]
        options:
          banner: """
            // [Template](http://template-extension.org)
            // (c) <%= grunt.template.today("yyyy") %> Alasdair Mercer
            // Freely distributable under the MIT license:
            // <http://template-extension.org/license>

          """

    copy:
      build:
        expand: yes
        cwd:    'src/'
        src:    ['**', '!lib/*']
        dest:   'bin/'

      dist:
        expand: yes
        cwd:    'bin/'
        src:    ['**', '!lib/*', '!vendor/**/*.js', 'vendor/**/*.min.js']
        dest:   'dist/temp/'

    coffee:
      build:
        expand: yes
        cwd:    'src/lib/'
        src:    '*.coffee'
        dest:   'bin/lib/'
        ext:    '.js'

    docco:
      dist:
        src: 'src/lib/**/*.coffee'
        options:
          output: 'docs/'

    'json-minify':
      dist:
        files: 'dist/temp/**/*.json'

    'locale-prepare':
      dist:
        files: 'dist/temp/_locales/**/*.json'

    uglify:
      distLib:
        files: [
          expand: yes
          cwd:    'bin/lib/'
          src:    '*.js'
          dest:   'dist/temp/lib/'
        ]
        options:
          banner: """
            /*! Template v<%= pkg.version %> | (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %> | <%= pkg.licenses[0].url %> */

          """

      distVendor:
        files: [
          expand: yes
          cwd:    'bin/vendor/'
          src:    ['**/*.js', '!**/*.min.js']
          dest:   'dist/temp/vendor/'
        ]
        options:
          preserveComments: 'some'

  }

  # Tasks
  # -----

  for dependency of pkg.devDependencies when ~dependency.indexOf 'grunt-'
    grunt.loadNpmTasks dependency

  grunt.registerTask 'build', [
    'clean:build'
    'copy:build'
    'coffee'
    'concat'
  ]

  grunt.registerTask 'dist', [
    'clean:dist'
    'copy:dist'
    'locale-prepare'
    'json-minify'
    'uglify'
    'compress'
    'clean:distAfter'
  ]

  grunt.registerTask 'docs', [
    'clean:docs'
    'docco'
  ]

  grunt.registerTask 'default', ['build']

  # Remove all of the long message descriptions and placeholder examples as they're not required by
  # users and Chrome Web Store has a size limit for locale files.
  grunt.registerMultiTask 'locale-prepare', 'Locale JSON preparation task', ->
    files = grunt.file.expand @data.files

    files.forEach (file) ->
      grunt.log.write "Preparing \"#{file}\"..."

      messages = grunt.file.readJSON file

      for name, message of messages
        delete message.description

        if message.placeholders
          delete placeholder.example for key, placeholder of message.placeholders

      grunt.file.write file, JSON.stringify messages

      grunt.log.ok()
