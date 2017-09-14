'use strict';

/**
 * Dependencies
 */
const glob = require('glob');

/**
 * Async wrapper for glob
 */
module.exports = function globAsync(pattern, ignore, allowEmptyPaths) {
  return new Promise((resolve, reject) => {
    glob(pattern, {ignore, nodir: true}, (error, files) => {

      //istanbul ignore if: hard to make glob error
      if (error) {
        return reject(error);
      }

      //Error if no files match, unless allowed
      if (!allowEmptyPaths && files.length === 0) {
        return reject(new Error('No files match the pattern: ' + pattern));
      }

      //Resolve
      resolve(files);
    });
  });
};
