'use strict';

/**
 * Dependencies
 */
const glob = require('glob');

/**
 * Async wrapper for glob
 */
module.exports = function globAsync(pattern, ignore, allowEmptyPaths, cfg) {

  const isWindows = process.platform === 'win32';
  //Prepare glob config
  cfg = Object.assign({ignore}, cfg, {
    nodir: true,
    windowsPathsNoEscape: isWindows
  });

  //Return promise
  return new Promise((resolve, reject) => {
    glob(pattern, cfg, (error, files) => {

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
