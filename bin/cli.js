#!/usr/bin/env node
'use strict';

/**
 * Dependencies
 */
const path = require('path');
const chalk = require('chalk');
const argv = require('yargs').argv;
const replace = require('../lib/replace-in-file');

//Verify arguments
if (argv._.length < 3 && !argv.config) {
  console.error(chalk.red('Replace in file needs at least 3 arguments'));
  process.exit(1);
}

//Prepare vars
let from, to, files, ignore;

//If config is set, load config file
if (argv.config) {

  //Read config file
  let config;
  try {
    config = require(path.join(process.cwd(), argv.config));
  }
  catch (error) {
    console.error(chalk.red('Error loading config file:'));
    console.error(error);
    process.exit(1);
  }

  //Set from/to params
  from = config.from;
  to = config.to;

  //Set files param
  if (typeof config.files === 'string') {
    config.files = [config.files];
  }
  files = config.files;

  //Set ignore param
  if (typeof config.ignore === 'string') {
    config.ignore = [config.ignore];
  }
  ignore = config.ignore;
}

//Get from/to parameters from CLI args if not defined in config file
if (typeof from === 'undefined') {
  from = argv._.shift();
}
if (typeof to === 'undefined') {
  to = argv._.shift();
}

//Get files
if (!files) {
  files = argv._;
}

//Validate data
if (typeof from === 'undefined' || typeof to === 'undefined') {
  console.error(chalk.red('Must set from & to options'));
  process.exit(1);
}
if (!files) {
  console.error(chalk.red('Must pass a list of files'));
  process.exit(1);
}

//Single star globs already get expanded in the command line
files = files.reduce((files, file) => {
  return files.concat(file.split(','));
}, []);

//If the isRegex flag is passed, send the from parameter as a RegExp object
if (argv.isRegex) {
  const flags = from.replace(/.*\/([gimy]*)$/, '$1');
  const pattern = from.replace(new RegExp(`^/(.*?)/${flags}$`), '$1');
  try {
    from = new RegExp(pattern, flags);
  }
  catch (error) {
    console.error(chalk.red('Error creating RegExp from `from` parameter:'));
    console.error(error);
    process.exit(1);
  }
}

//Get ignored files from ignore flag
if (!ignore && typeof argv.ignore !== 'undefined') {
  ignore = argv.ignore;
}

//Log
console.log(`Replacing '${from}' with '${to}'`);

//Create options
const options = {files, from, to, ignore};
if (typeof argv.encoding !== 'undefined') {
  options.encoding = argv.encoding;
}
if (typeof argv.allowEmptyPaths !== 'undefined') {
  options.allowEmptyPaths = argv.allowEmptyPaths;
}

//Replace
try {
  const changedFiles = replace.sync(options);
  if (changedFiles.length > 0) {
    console.log(chalk.green(changedFiles.length, 'file(s) were changed'));
    if (argv.verbose) {
      changedFiles.forEach(file => console.log(chalk.grey('-', file)));
    }
  }
  else {
    console.log(chalk.yellow('No files were changed'));
  }
}
catch (error) {
  console.error(chalk.red('Error making replacements:'));
  console.error(error);
}
