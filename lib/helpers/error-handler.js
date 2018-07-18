'use strict';

/**
 * Dependencies
 */
const tc = require('turbocolor');

/**
 * Error handler
 */
module.exports = function errorHandler(error, message = '', exitCode = 1) {
  if (typeof error === 'string') {
    message = error;
    error = null;
  }
  message = message || 'Error making replacements';
  console.error(tc.red(message));
  if (error) {
    console.error(error);
  }
  process.exit(exitCode);
};
