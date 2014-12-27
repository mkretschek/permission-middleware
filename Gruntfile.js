module.exports = function(grunt) {
  'use strict';

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    jshint: {
      options: {
        indent : 2,
        maxlen : 80,
        node : true,
        eqeqeq : true,
        latedef : true,
        noarg : true,
        noempty : true,
        plusplus : true,
        quotmark : true,
        undef : true,
        unused : true,
        strict : true,
        trailing : true
      },

      srcFiles : {
        src : [
          'Gruntfile.js',
          'test.js',
          'lib/**/*.js',
          '!lib/**/*.test.js'
        ]
      },

      testFiles : {
        options : {
          expr : true,
          globals : {
            describe : true,
            it : true,
            after : true,
            before : true,
            afterEach : true,
            beforeEach : true,
            expect : true
          }
        },
        src : ['lib/**/*.test.js']
      }
    },

    mochaTest: {
      test: {
        options: {
          require : ['test.js'],
          reporter: 'dot',
          ui: 'bdd',
          ignoreLeaks: false
        },
        src: ['lib/**/*.test.js']
      }
    }
  });


  // Load the jshint plugin
  grunt.loadNpmTasks('grunt-contrib-jshint');

  // Load the mocha runner plugin
  grunt.loadNpmTasks('grunt-mocha-test');

  // Test tasks
  grunt.registerTask('test', [
    'jshint:srcFiles',
    'jshint:testFiles',
    'mochaTest'
  ]);

  // Default task(s).
  grunt.registerTask('default', ['test']);

};
