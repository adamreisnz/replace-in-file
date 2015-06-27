/* global jasmine */
/* jscs:disable requireCamelCaseOrUpperCaseIdentifiers */

/**
 * Module dependencies
 */
var Jasmine = require('jasmine');
var SpecReporter = require('jasmine-spec-reporter');
var noop = function() {};

//Initialize jasmine
var jrunner = new Jasmine();

//Set reporters
jrunner.configureDefaultReporter({print: noop});
jasmine.getEnv().addReporter(new SpecReporter());

//Configure
jrunner.loadConfig({
  spec_dir: 'tests',
  spec_files: [
    '**/*.spec.js'
  ],
  helpers: [
    'helpers/**/*.js'
  ]
});

//Run tests
jrunner.execute();
