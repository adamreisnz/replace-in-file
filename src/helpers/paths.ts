import {glob} from 'glob'
import nodepath from 'node:path'
import type {GlobOptionsWithFileTypesFalse} from 'glob'
import type {ParsedConfig} from '../types.ts'

/**
 * Async wrapper for glob
 */
export async function globAsync(
  pattern: string,
  ignore: string[],
  allowEmptyPaths: boolean,
  cfg: GlobOptionsWithFileTypesFalse
): Promise<string[]> {

  //Run glob
  const files = await glob(pattern, {
    ignore, ...cfg, nodir: true, withFileTypes: false,
  })

  //Error if no files match, unless allowed
  if (!allowEmptyPaths && files.length === 0) {
    throw new Error('No files match the pattern: ' + pattern)
  }

  //Return files
  return files
}

/**
 * Get paths (sync)
 */
export function pathsSync(patterns: string[], config: ParsedConfig): string[] {

  //Extract relevant config
  const {ignore, disableGlobs, glob: globConfig, cwd} = config

  //Not using globs?
  if (disableGlobs) {
    return patterns
  }

  //Prepare glob config
  const cfg: GlobOptionsWithFileTypesFalse = {
    ignore, ...globConfig, nodir: true, withFileTypes: false,
  }

  //Append CWD configuration if given (#56)
  if (cwd) {
    cfg.cwd = cwd
  }

  //Get paths
  const flattened = patterns.flatMap(pattern => glob.sync(pattern, cfg))

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
export async function pathsAsync(patterns: string[], config: ParsedConfig): Promise<string[]> {

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
  return paths.flat()
}
