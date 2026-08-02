import {parseConfig} from './helpers/config.js'
import {logDryRun} from './helpers/handlers.js'
import {pathsSync, pathsAsync} from './helpers/paths.js'
import {replaceSync, replaceAsync} from './helpers/replace.js'
import {processFile, processFileSync} from './process-file.js'
import type {ReplaceInFileConfig, ReplaceResult} from './types.js'

/**
 * Replace in file (async)
 */
export async function replaceInFile(config: ReplaceInFileConfig): Promise<ReplaceResult[]> {

  //If custom processor is provided use it instead
  if (config && (config.processor || config.processorAsync)) {
    return await processFile(config)
  }

  //Parse config
  const parsed = parseConfig(config)
  const {files, from, to, dry, verbose} = parsed

  //Dry run?
  logDryRun(dry && verbose)

  //Find paths and process them
  const paths = await pathsAsync(files, parsed)
  const promises = paths.map(path => replaceAsync(path, from!, to!, parsed))
  const results = await Promise.all(promises)

  //Return results
  return results
}

/**
 * Replace in file (sync)
 */
export function replaceInFileSync(config: ReplaceInFileConfig): ReplaceResult[] {

  if (config && config.processorAsync) {
    throw new Error('ProcessorAsync cannot be used in synchronous mode')
  }

  //If custom processor is provided use it instead
  if (config && config.processor) {
    return processFileSync(config)
  }

  //Parse config
  const parsed = parseConfig(config)
  const {files, from, to, dry, verbose} = parsed

  //Dry run?
  logDryRun(dry && verbose)

  //Find paths and process them
  const paths = pathsSync(files, parsed)
  const results = paths.map(path => replaceSync(path, from!, to!, parsed))

  //Return results
  return results
}
