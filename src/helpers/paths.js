import {glob} from 'glob'
import nodepath from 'node:path'

/**
 * Async wrapper for glob
 */
export function globAsync(pattern, ignore, allowEmptyPaths, cfg) {

  //Prepare glob config
  cfg = Object.assign({ignore}, cfg, {nodir: true})

  //Run glob
  return glob(pattern, cfg).then(files => {

    //Error if no files match, unless allowed
    if (!allowEmptyPaths && files.length === 0) {
      throw new Error('No files match the pattern: ' + pattern)
    }

    //Return files
    return files
  })
}

/**
 * Get paths (sync)
 */
export function pathsSync(patterns, config) {

  //Extract relevant config
  const {ignore, disableGlobs, glob: globConfig, cwd} = config

  //Not using globs?
  if (disableGlobs) {
    return patterns
  }

  //Prepare glob config
  const cfg = Object.assign({ignore}, globConfig, {nodir: true})

  //Append CWD configuration if given (#56)
  if (cwd) {
    cfg.cwd = cwd
  }

  //Get paths
  const paths = patterns.map(pattern => glob.sync(pattern, cfg))
  const flattened = [].concat.apply([], paths)

  //Prefix each path with CWD if given (#56)
  if (cwd) {
    return flattened.map(path => nodepath.join(cwd, path))
  }

  //Return flattened
  return flattened
}

/**
 * Get paths asynchrously
 */
export async function pathsAsync(patterns, config) {

  //Extract relevant config
  const {ignore, disableGlobs, allowEmptyPaths, glob: cfg} = config

  //Not using globs?
  if (disableGlobs) {
    return patterns
  }

  //Prepare promises
  const promises = patterns
    .map(pattern => globAsync(pattern, ignore, allowEmptyPaths, cfg))

  //Expand globs and flatten paths
  const paths = await Promise.all(promises)
  return [].concat.apply([], paths)
}
