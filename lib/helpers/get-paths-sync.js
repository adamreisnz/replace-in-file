'use strict';

/**
 * Dependencies
 */
const glob = require('glob');

/**
 * Get paths (sync)
 */
module.exports = function getPathsSync(patterns, config) {

  //Extract relevant config
  const {ignore, disableGlobs, glob: globConfig} = config;

  //Not using globs?
  if (disableGlobs) {
    return patterns;
  }

  //Prepare glob config
  const cfg = Object.assign({ignore}, globConfig, {nodir: true});

  //Get paths
  const paths = patterns
    .map(pattern => glob.sync(pattern, cfg));

  //Return flattened
  return [].concat.apply([], paths);
};
