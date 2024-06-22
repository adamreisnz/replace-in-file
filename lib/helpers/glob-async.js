
const {glob} = require('glob');

/**
 * Async wrapper for glob
 */
module.exports = function globAsync(pattern, ignore, allowEmptyPaths, cfg) {

  //Prepare glob config
  cfg = Object.assign({ignore}, cfg, {nodir: true});

  return glob(pattern, cfg).then(files => {
    //Error if no files match, unless allowed
    if (!allowEmptyPaths && files.length === 0) {
      throw new Error('No files match the pattern: ' + pattern);
    }

    return files;
  });
};
