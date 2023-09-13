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
  const {ignore, disableGlobs, glob: globConfig, cwd} = config;

  //Not using globs?
  if (disableGlobs) {
    return patterns;
  }

  const isWindows = process.platform === 'win32';
  //Prepare glob config
  const cfg = Object.assign({ignore}, globConfig, {
    nodir: true,
    windowsPathsNoEscape: isWindows
  });

  //Append CWD configuration if given (#56)
  //istanbul ignore if
  if (cwd) {
    cfg.cwd = cwd;
  }

  //Get paths
  const paths = patterns.map(pattern => glob.sync(pattern, cfg));
  const flattened = [].concat.apply([], paths);

  //Prefix each path with CWD if given (#56)
  //istanbul ignore if
  if (cwd) {
    return flattened.map(path => `${cwd}${path}`);
  }

  //Return flattened
  return flattened;
};
