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
      build: ['bin/*']
      dist:  ['dist/*', 'docs/*']

    # TODO: Copy non-src/lib files to `bin` directory
    copy:
      build:
        files: [
          src:  ['src/**', '!src/lib/']
          dest: ['bin/']
        ]

    # TODO: Complete & test
    coffee:
      build:
        expand: yes
        cwd:    'src/lib/'
        src:    '**/*.coffee'
        dest:   'bin/lib/'
        ext:    '.js'

    docco:
      dist:
        options: output: 'docs/'
        src:     ['src/lib/**/*.coffee']

    # TODO: Complete & test
    uglify:
      dist:
        files: [
          expand: yes
          cwd:    'dist/temp/lib/'
          src:    ['**/*.js']
          dest:   'dist/temp/lib/'
          ext:    '.js'
        ]
        options: banner: """
          /*! Template v<%= pkg.version %> | (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %> | <%= pkg.licenses[0].url %> */

        """

  # Tasks
  # -----

  for dependency of grunt.config.data.pkg.devDependencies when ~dependency.indexOf 'grunt-'
    grunt.loadNpmTasks dependency

  # TODO: Complete & test
  grunt.registerTask 'build',   ['clean:build', 'copy:build', 'coffee']
  grunt.registerTask 'default', ['build']
  grunt.registerTask 'dist',    ['build', 'clean:dist', 'docco', 'copy', 'uglify']
