import {parseConfig} from './helpers/config.ts'
import {logDryRun} from './helpers/handlers.ts'
import {pathsSync, pathsAsync} from './helpers/paths.ts'
import {replaceSync, replaceAsync} from './helpers/replace.ts'
import {replaceStreamAsync} from './helpers/stream.ts'
import {processFile, processFileSync} from './process-file.ts'
import type {ReplaceInFileConfig, ReplaceResult} from './types.ts'

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
  const {files, from, to, dry, verbose, streaming} = parsed

  //Dry run?
  logDryRun(dry && verbose)

  //Find paths and process them, streaming if configured
  const replace = streaming ? replaceStreamAsync : replaceAsync
  const paths = await pathsAsync(files, parsed)
  const promises = paths.map(path => replace(path, from!, to!, parsed))
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
  if (config && config.streaming) {
    throw new Error('Streaming cannot be used in synchronous mode')
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
