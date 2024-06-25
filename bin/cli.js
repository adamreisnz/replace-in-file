#!/usr/bin/env node

import yargs from 'yargs'
import {hideBin} from 'yargs/helpers'
import {replaceInFileSync} from '../src/replace-in-file.js'
import {loadConfig, combineConfig} from '../src/helpers/config.js'
import {errorHandler, successHandler} from '../src/helpers/handlers.js'

/**
 * Main routine
 */
async function main() {

  //Extract parameters
  const argv = yargs(hideBin(process.argv)).argv
  const {configFile} = argv

  //Verify arguments
  if (argv._.length < 3 && !configFile) {
    throw new Error('Replace in file needs at least 3 arguments')
  }

  //Load config and combine with passed arguments
  const config = configFile ? await loadConfig(configFile) : {}
  const options = combineConfig(config, argv)

  //Extract settings
  const {from, to, files, isRegex, verbose, quiet} = options

  //Single star globs already get expanded in the command line
  options.files = files.reduce((files, file) => {
    return files.concat(file.split(','))
  }, [])

  //If the isRegex flag is passed, convert the from parameter to a RegExp object
  if (isRegex) {
    const flags = from.replace(/.*\/([gimyus]*)$/, '$1')
    const pattern = from.replace(new RegExp(`^/(.*?)/${flags}$`), '$1')
    options.from = new RegExp(pattern, flags)
  }

  //Log
  if (!quiet) {
    console.log(`Replacing '${from}' with '${to}'`)
  }

  //Replace
  const results = replaceInFileSync(options)
  if (!quiet) {
    successHandler(results, verbose)
  }
}

//Call main routine
main().catch(error => errorHandler(error))
