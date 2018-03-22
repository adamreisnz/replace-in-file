'use strict';

/**
 * Dependencies
 */
const glob = require('glob');

/**
 * Get paths (sync)
 */
module.exports = function getPathsSync(patterns, ignore, disableGlobs, cfg) {

  //Not using globs?
  if (disableGlobs) {
    return patterns;
  }

  //Prepare glob config
  cfg = Object.assign({ignore}, cfg, {nodir: true});

  //Get paths
  const paths = patterns
    .map(pattern => glob.sync(pattern, cfg));

  //Return flattened
  return [].concat.apply([], paths);
};
