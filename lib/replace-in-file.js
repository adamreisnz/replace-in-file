'use strict';

/**
 * Dependencies
 */
const chalk = require('chalk');
const parseConfig = require('./helpers/parse-config');
const getPathsSync = require('./helpers/get-paths-sync');
const getPathsAsync = require('./helpers/get-paths-async');
const replaceSync = require('./helpers/replace-sync');
const replaceAsync = require('./helpers/replace-async');

/**
 * Replace in file helper
 */
function replaceInFile(config, cb) {

  //Parse config
  try {
    config = parseConfig(config);
  }
  catch (error) {
    if (cb) {
      return cb(error, null);
    }
    return Promise.reject(error);
  }

  //Get config
  const {files, from, to, dry, verbose} = config;

  //Dry run?
  //istanbul ignore if: No need to test console logs
  if (dry && verbose) {
    console.log(chalk.yellow('Dry run, not making actual changes'));
  }

  //Find paths
  return getPathsAsync(files, config)

    //Make replacements
    .then(paths => Promise.all(
      paths.map(file => replaceAsync(file, from, to, config))
    ))

    //Success handler
    .then(results => {
      if (cb) {
        cb(null, results);
      }
      return results;
    })

    //Error handler
    .catch(error => {
      if (cb) {
        cb(error);
      }
      else {
        throw error;
      }
    });
}

/**
 * Sync API
 */
replaceInFile.sync = function(config) {

  //Parse config
  config = parseConfig(config);

  //Get config, paths, and initialize changed files
  const {files, from, to, dry, verbose} = config;
  const paths = getPathsSync(files, config);

  //Dry run?
  //istanbul ignore if: No need to test console logs
  if (dry && verbose) {
    console.log(chalk.yellow('Dry run, not making actual changes'));
  }

  //Process synchronously and return results
  return paths.map(path => replaceSync(path, from, to, config));
};

//Export
module.exports = replaceInFile;
