import {parseConfig} from './helpers/config.js'
import {logDryRun} from './helpers/handlers.js'
import {pathsSync, pathsAsync} from './helpers/paths.js'
import {replaceSync, replaceAsync} from './helpers/replace.js'
import {processFile, processFileSync} from './process-file.js'

/**
 * Replace in file (async)
 */
export async function replaceInFile(config) {

  //If custom processor is provided use it instead
  if (config && config.processor) {
    return await processFile(config)
  }

  //Parse config
  config = parseConfig(config)
  const {files, from, to, dry, verbose} = config

  //Dry run?
  logDryRun(dry && verbose)

  //Find paths and process them
  const paths = await pathsAsync(files, config)
  const promises = paths.map(path => replaceAsync(path, from, to, config))
  const results = await Promise.all(promises)

  //Return results
  return results
}

/**
 * Replace in file (sync)
 */
export function replaceInFileSync(config) {

  //If custom processor is provided use it instead
  if (config && config.processor) {
    return processFileSync(config)
  }

  //Parse config
  config = parseConfig(config)
  const {files, from, to, dry, verbose} = config

  //Dry run?
  logDryRun(dry && verbose)

  //Find paths and process them
  const paths = pathsSync(files, config)
  const results = paths.map(path => replaceSync(path, from, to, config))

  //Return results
  return results
}
