import path from 'node:path'
import fs from 'node:fs/promises'
import fsSync from 'node:fs'
import type {ReplaceInFileConfig, ParsedConfig, CliArguments, From} from '../types.js'

/**
 * Helper to load options from a config file
 */
export async function loadConfig(file: string): Promise<ReplaceInFileConfig> {

  //No config file provided?
  if (!file) {
    throw new Error(`No config file provided`)
  }

  //Read file
  const json = await fs.readFile(path.resolve(file), 'utf8')
  return JSON.parse(json) as ReplaceInFileConfig
}

/**
 * Helper to convert a string to Regex if it matches the pattern
 */
export function stringToRegex(str: From | From[] | undefined): From | From[] | undefined {

  //Array given
  if (Array.isArray(str)) {
    return str.map(toRegex)
  }

  //Nothing given
  if (typeof str === 'undefined') {
    return str
  }

  //Convert single value
  return toRegex(str)
}

/**
 * Convert a single value to a regex if it is wrapped in slashes
 */
function toRegex(str: From): From {

  //Not a string, or not wrapped in slashes like /pattern/flags
  const regexMatch = /^\/(.*)\/([gimyus]*)$/s
  const match = (typeof str === 'string') ? str.match(regexMatch) : null
  if (!match) {
    return str
  }

  //Extract pattern and flags and return regex
  const [, pattern, flags] = match
  return new RegExp(pattern!, flags)
}

/**
 * Parse config
 */
export function parseConfig(config: ReplaceInFileConfig): ParsedConfig {

  //Validate config
  if (typeof config !== 'object' || config === null) {
    throw new Error('Must specify configuration object')
  }

  //Fix glob
  config.glob = config.glob || {}

  //Extract data
  const {files, getTargetFile, from, to, processor, processorAsync, ignore, encoding} = config
  if (typeof processor !== 'undefined') {
    if (typeof processor !== 'function' && !Array.isArray(processor)) {
      throw new Error(`Processor should be either a function or an array of functions`)
    }
  }
  else if (typeof processorAsync !== 'undefined') {
    if (typeof processorAsync !== 'function' && !Array.isArray(processorAsync)) {
      throw new Error(`ProcessorAsync should be either a function or an array of functions`)
    }
  }
  else {
    if (typeof files === 'undefined') {
      throw new Error('Must specify file or files')
    }
    if (typeof from === 'undefined') {
      throw new Error('Must specify string or regex to replace')
    }
    if (typeof to === 'undefined') {
      throw new Error('Must specify a replacement (can be blank string)')
    }
    if (typeof getTargetFile !== 'undefined' && typeof getTargetFile !== 'function') {
      throw new Error(`Target file transformation parameter should be a function that takes the source file path as argument and returns the target file path`)
    }
  }

  //Ensure arrays
  if (!Array.isArray(files)) {
    config.files = [files] as string[]
  }
  if (!Array.isArray(ignore)) {
    if (typeof ignore === 'undefined') {
      config.ignore = []
    }
    else {
      config.ignore = [ignore]
    }
  }

  //Since we can't store Regexp in JSON, convert from string if needed
  config.from = stringToRegex(from)

  //Use default encoding if invalid
  if (typeof encoding !== 'string' || encoding === '') {
    config.encoding = 'utf-8'
  }

  //Merge config with defaults
  return Object.assign({}, {
    ignore: [],
    encoding: 'utf-8',
    disableGlobs: false,
    allowEmptyPaths: false,
    countMatches: false,
    verbose: false,
    quiet: false,
    dry: false,
    glob: {},
    cwd: null,
    getTargetFile: (source: string) => source,
    fs,
    fsSync,
  }, config) as ParsedConfig
}

/**
 * Combine CLI script arguments with config options
 */
export function combineConfig(config: ReplaceInFileConfig, argv: CliArguments): ParsedConfig {

  //Extract options from config
  const {allowEmptyPaths} = config
  let {
    from, to, files, ignore, encoding, verbose,
    disableGlobs, dry, quiet,
  } = config

  //Get from/to parameters from CLI args if not defined in options
  if (typeof from === 'undefined') {
    from = argv._.shift() as string
  }
  if (typeof to === 'undefined') {
    to = argv._.shift() as string
  }

  //Get files and ignored files
  if (typeof files === 'undefined') {
    files = argv._ as string[]
  }
  if (typeof ignore === 'undefined' && typeof argv.ignore !== 'undefined') {
    ignore = argv.ignore
  }

  //Other parameters
  if (typeof encoding === 'undefined') {
    encoding = argv.encoding
  }
  if (typeof disableGlobs === 'undefined') {
    disableGlobs = !!argv.disableGlobs
  }
  if (typeof verbose === 'undefined') {
    verbose = !!argv.verbose
  }
  if (typeof dry === 'undefined') {
    dry = !!argv.dry
  }
  if (typeof quiet === 'undefined') {
    quiet = !!argv.quiet
  }

  //Return through parser to validate
  return parseConfig({
    from, to, files, ignore, encoding, verbose,
    allowEmptyPaths, disableGlobs, dry, quiet,
  })
}
