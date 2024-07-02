import path from 'node:path'
import fs from 'node:fs/promises'
import fsSync from 'node:fs'

/**
 * Helper to load options from a config file
 */
export async function loadConfig(file) {

  //No config file provided?
  if (!file) {
    throw new Error(`No config file provided`)
  }

  //Read file
  const json = await fs.readFile(path.resolve(file), 'utf8')
  const config = JSON.parse(json)

  //Since we can't store Regexp in JSON, convert from string if needed
  if (config.from && config.from.match(/.*\/([gimyus]*)$/)) {
    config.from = new RegExp(config.from)
  }

  //Return config
  return config
}

/**
 * Parse config
 */
export function parseConfig(config) {

  //Validate config
  if (typeof config !== 'object' || config === null) {
    throw new Error('Must specify configuration object')
  }

  //Fix glob
  config.glob = config.glob || {}

  //Extract data
  const {files, getTargetFile, from, to, processor, ignore, encoding} = config
  if (typeof processor !== 'undefined') {
    if (typeof processor !== 'function' && !Array.isArray(processor)) {
      throw new Error(`Processor should be either a function or an array of functions`)
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
    config.files = [files]
  }
  if (!Array.isArray(ignore)) {
    if (typeof ignore === 'undefined') {
      config.ignore = []
    }
    else {
      config.ignore = [ignore]
    }
  }

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
    isRegex: false,
    verbose: false,
    quiet: false,
    dry: false,
    glob: {},
    cwd: null,
    getTargetFile: source => source,
    fs,
    fsSync,
  }, config)
}

/**
 * Combine CLI script arguments with config options
 */
export function combineConfig(config, argv) {

  //Extract options from config
  let {
    from, to, files, ignore, encoding, verbose,
    allowEmptyPaths, disableGlobs, isRegex, dry, quiet,
  } = config

  //Get from/to parameters from CLI args if not defined in options
  if (typeof from === 'undefined') {
    from = argv._.shift()
  }
  if (typeof to === 'undefined') {
    to = argv._.shift()
  }

  //Get files and ignored files
  if (typeof files === 'undefined') {
    files = argv._
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
  if (typeof isRegex === 'undefined') {
    isRegex = !!argv.isRegex
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
    allowEmptyPaths, disableGlobs, isRegex, dry, quiet,
  })
}
