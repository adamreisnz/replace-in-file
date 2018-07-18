'use strict';

/**
 * Dependencies
 */
const tc = require('turbocolor');

/**
 * Success handler
 */
module.exports = function successHandler(changes, verbose = false) {
  if (changes.length > 0) {
    console.log(tc.green(changes.length, 'file(s) were changed'));
    if (verbose) {
      changes.forEach(file => console.log(tc.gray('-', file)));
    }
  }
  else {
    console.log(tc.yellow('No files were changed'));
  }
};
