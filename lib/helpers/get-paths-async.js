'use strict';

/**
 * Dependencies
 */
const globAsync = require('./glob-async');

/**
 * Get paths asynchrously
 */
module.exports = function getPathsAsync(
  patterns, ignore, disableGlobs, allowEmptyPaths
) {

  //Not using globs?
  if (disableGlobs) {
    return Promise.resolve(patterns);
  }

  //Expand globs and flatten paths
  return Promise
    .all(patterns.map(pattern => globAsync(pattern, ignore, allowEmptyPaths)))
    .then(paths => [].concat.apply([], paths));
};
