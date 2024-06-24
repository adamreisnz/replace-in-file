import {parseConfig} from './helpers/config.js'
import {logDryRun} from './helpers/handlers.js'
import {pathsSync, pathsAsync} from './helpers/paths.js'
import {processSync, processAsync} from './helpers/process.js'

/**
 * Process a file (async)
 */
export async function processFile(config) {

  //Parse config
  config = parseConfig(config)
  const {files, processor, dry, verbose} = config

  //Dry run?
  logDryRun(dry && verbose)

  //Find paths and process them
  const paths = await pathsAsync(files, config)
  const promises = paths.map(path => processAsync(path, processor, config))
  const results = await Promise.all(promises)

  //Return results
  return results
}

/**
 * Process a file (sync)
 */
export function processFileSync(config) {

  //Parse config
  config = parseConfig(config)
  const {files, processor, dry, verbose} = config

  //Dry run?
  logDryRun(dry && verbose)

  //Find paths and process them
  const paths = pathsSync(files, config)
  const results = paths.map(path => processSync(path, processor, config))

  //Return results
  return results
}
