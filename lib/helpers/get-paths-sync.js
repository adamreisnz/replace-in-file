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

  //Get paths
  const paths = patterns
    .map(pattern => glob.sync(pattern, {ignore, nodir: true}));

  //Return flattened
  return [].concat.apply([], paths);
};
