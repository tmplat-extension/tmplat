# [Template](http://template-extension.org)  
# (c) 2013 Alasdair Mercer  
# Freely distributable under the MIT license:  
# <http://template-extension.org/license>

module.exports = (grunt) ->

  # Configuration
  # -------------

  grunt.initConfig

    pkg: grunt.file.readJSON 'package.json'

    clean:
      build:     'bin/*'
      dist:      ['dist/*', 'docs/*']
      distAfter: 'dist/temp/'

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
        src:    ['**', '!lib/**']
        dest:   'bin/'
      dist:
        expand: yes
        cwd:    'bin/'
        src:    ['**', '!lib/**', '!vendor/**/*.js', 'vendor/**/*.min.js']
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

    # TODO: Complete & test
    uglify:
      dist:
        files: [
          expand: yes
          cwd:    'dist/temp/lib/'
          src:    '**/*.js'
          dest:   'dist/temp/lib/'
          ext:    '.js'
        ]
        options:
          banner: """
            /*! Template v<%= pkg.version %> | (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %> | <%= pkg.licenses[0].url %> */

          """

  # Tasks
  # -----

  for dependency of grunt.config.data.pkg.devDependencies when ~dependency.indexOf 'grunt-'
    grunt.loadNpmTasks dependency

  # TODO: Complete & test
  grunt.registerTask 'build',   ['clean:build', 'copy:build', 'coffee', 'concat']
  grunt.registerTask 'default', ['build']
  # TODO: grunt.registerTask 'dist',    ['build', 'clean:dist', 'docco', 'copy:dist', 'uglify', 'clean:distAfter']
  grunt.registerTask 'dist',    ['build', 'clean:dist', 'copy:dist']
