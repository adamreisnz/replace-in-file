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
  const {
    files, from, to, encoding, ignore, allowEmptyPaths, disableGlobs,
    dry, verbose, glob,
  } = config;

  //Dry run?
  //istanbul ignore if: No need to test console logs
  if (dry && verbose) {
    console.log(chalk.yellow('Dry run, not making actual changes'));
  }

  //Find paths
  return getPathsAsync(files, ignore, disableGlobs, allowEmptyPaths, glob)

    //Make replacements
    .then(paths => Promise.all(paths.map(file => {
      return replaceAsync(file, from, to, encoding, dry);
    })))

    //Convert results to array of changed files
    .then(results => {
      return results
        .filter(result => result.hasChanged)
        .map(result => result.file);
    })

    //Success handler
    .then(changedFiles => {
      if (cb) {
        cb(null, changedFiles);
      }
      return changedFiles;
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
  const {
    files, from, to, encoding, ignore, disableGlobs, dry, verbose, glob,
  } = config;
  const paths = getPathsSync(files, ignore, disableGlobs, glob);
  const changedFiles = [];

  //Dry run?
  //istanbul ignore if: No need to test console logs
  if (dry && verbose) {
    console.log(chalk.yellow('Dry run, not making any changes'));
  }

  //Process synchronously
  paths.forEach(path => {
    if (replaceSync(path, from, to, encoding, dry)) {
      changedFiles.push(path);
    }
  });

  //Return changed files
  return changedFiles;
};

//Export
module.exports = replaceInFile;
