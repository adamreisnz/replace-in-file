'use strict';

/**
 * Dependencies
 */
const glob = require('glob');

/**
 * Get paths (sync)
 */
module.exports = function getPathsSync(patterns, ignore, disableGlobs) {

  //Not using globs?
  if (disableGlobs) {
    return patterns;
  }

  //Return paths
  return patterns.map(pattern => glob.sync(pattern, {ignore, nodir: true}));
};
