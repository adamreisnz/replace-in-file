import type {ParsedConfig, Processor, ProcessorAsync, ReplaceResult} from '../types.ts'

/**
 * Run processors
 */
export function runProcessors(
  contents: string, processor: Processor | Processor[], file: string
): [ReplaceResult, string] {

  //Ensure array and prepare result
  const processors = Array.isArray(processor) ? processor : [processor]

  //Run processors
  const newContents = processors
    .reduce((contents, processor) => processor(contents, file), contents)

  //Check if contents changed and prepare result
  const hasChanged = (newContents !== contents)
  const result = {file, hasChanged}

  //Return along with new contents
  return [result, newContents]
}

/**
 * Helper to process in a single file (sync)
 */
export function processSync(
  file: string, processor: Processor | Processor[], config: ParsedConfig
): ReplaceResult {

  //Extract relevant config and read file contents
  const {encoding, dry, fsSync} = config
  const contents = fsSync.readFileSync(file, encoding)

  //Process contents
  const [result, newContents] = runProcessors(contents, processor, file)

  //Contents changed and not a dry run? Write to file
  if (result.hasChanged && !dry) {
    fsSync.writeFileSync(file, newContents, encoding)
  }

  //Return result
  return result
}

/**
 * Run processors (async)
 */
export async function runProcessorsAsync(
  contents: string, processorAsync: ProcessorAsync | ProcessorAsync[], file: string
): Promise<[ReplaceResult, string]> {

  //Ensure array and prepare result
  const processorAsyncs = Array.isArray(processorAsync) ? processorAsync : [processorAsync]

  //Run processors
  let newContents = contents
  for (const processor of processorAsyncs) {
    newContents = await processor(newContents, file)
  }

  //Check if contents changed and prepare result
  const hasChanged = (newContents !== contents)
  const result = {file, hasChanged}

  //Return along with new contents
  return [result, newContents]
}

/**
 * Helper to process in a single file (async)
 */
export async function processAsync(
  file: string, processor: ProcessorAsync | ProcessorAsync[], config: ParsedConfig
): Promise<ReplaceResult> {

  //Extract relevant config and read file contents
  const {encoding, dry, fs} = config
  const contents = await fs.readFile(file, encoding)

  //Make replacements
  const [result, newContents] = await runProcessorsAsync(contents, processor, file)

  //Contents changed and not a dry run? Write to file
  if (result.hasChanged && !dry) {
    await fs.writeFile(file, newContents, encoding)
  }

  //Return result
  return result
}
