import {parseConfig} from './helpers/config.js'
import {logDryRun} from './helpers/handlers.js'
import {pathsSync, pathsAsync} from './helpers/paths.js'
import {processSync, processAsync} from './helpers/process.js'
import type {ReplaceInFileConfig, ReplaceResult} from './types.js'

/**
 * Process a file (async)
 */
export async function processFile(config: ReplaceInFileConfig): Promise<ReplaceResult[]> {

  //Parse config
  const parsed = parseConfig(config)
  const {files, processor, processorAsync, dry, verbose} = parsed

  //Dry run?
  logDryRun(dry && verbose)

  //Find paths and process them
  const paths = await pathsAsync(files, parsed)
  const promises = paths.map(path => processAsync(path, (processor ?? processorAsync)!, parsed))
  const results = await Promise.all(promises)

  //Return results
  return results
}

/**
 * Process a file (sync)
 */
export function processFileSync(config: ReplaceInFileConfig): ReplaceResult[] {

  //Parse config
  const parsed = parseConfig(config)
  const {files, processor, dry, verbose} = parsed

  //Dry run?
  logDryRun(dry && verbose)

  //Find paths and process them
  const paths = pathsSync(files, parsed)
  const results = paths.map(path => processSync(path, processor!, parsed))

  //Return results
  return results
}
