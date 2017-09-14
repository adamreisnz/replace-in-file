'use strict';

/**
 * Dependencies
 */
const chalk = require('chalk');

/**
 * Success handler
 */
module.exports = function successHandler(changes, verbose = false) {
  if (changes.length > 0) {
    console.log(chalk.green(changes.length, 'file(s) were changed'));
    if (verbose) {
      changes.forEach(file => console.log(chalk.grey('-', file)));
    }
  }
  else {
    console.log(chalk.yellow('No files were changed'));
  }
};
