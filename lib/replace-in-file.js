'use strict';

/**
 * Module dependencies
 */
const fs = require('fs');
const glob = require('glob');

/**
 * Helper to replace in a single file (sync)
 */
function replaceSync(file, find, replace) {

  //Read contents
  let contents = fs.readFileSync(file, 'utf8');

  //Replace contents and check if anything changed
  let newContents = contents.replace(find, replace);
  if (newContents === contents) {
    return false;
  }

  //Write to file
  fs.writeFileSync(file, newContents, 'utf8');
  return true;
}

/**
 * Helper to replace in a single file (async)
 */
function replaceAsync(file, find, replace) {
  return new Promise((resolve, reject) => {
    fs.readFile(file, 'utf8', (error, contents) => {
      //istanbul ignore if
      if (error) {
        return reject(error);
      }

      //Replace contents and check if anything changed
      let newContents = contents.replace(find, replace);
      if (newContents === contents) {
        return resolve({file, hasChanged: false});
      }

      //Write to file
      fs.writeFile(file, newContents, 'utf8', error => {
        //istanbul ignore if
        if (error) {
          return reject(error);
        }
        resolve({file, hasChanged: true});
      });
    });
  });
}

/**
 * Promise wrapper for glob
 */
function globPromise(pattern, allowEmptyPaths) {
  return new Promise((resolve, reject) => {
    glob(pattern, {nodir: true}, (error, files) => {

      //istanbul ignore if: hard to make glob error
      if (error) {
        return reject(error);
      }

      //Error if no files match, unless allowEmptyPaths is true
      if (files.length === 0 && !allowEmptyPaths) {
        return reject(new Error('No files match the pattern: ' + pattern));
      }

      //Resolve
      resolve(files);
    });
  });
}

/**
 * Replace in file helper
 */
function replaceInFile(config, cb) {

  //Get data
  let globs = config.files;
  let allowEmpty = config.allowEmptyPaths;

  //No array given?
  if (!Array.isArray(globs)) {
    globs = [globs];
  }

  //Find files
  return Promise.all(globs.map(pattern => globPromise(pattern, allowEmpty)))

    //Flatten array
    .then(files => [].concat.apply([], files))

    //Make replacements
    .then(files => Promise.all(files.map(file => {
      return replaceAsync(file, config.replace, config.with);
    })))

    //Convert results to array of changed files
    .then(results => {
      return results
        .filter(result => result.hasChanged)
        .map(result => result.file);
    })

    //Handle via callback or return
    .then(changedFiles => {
      if (cb) {
        cb(null, changedFiles);
      }
      return changedFiles;
    })

    //Handle error via callback, or rethrow
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

  //No array given?
  if (!Array.isArray(config.files)) {
    config.files = [config.files];
  }

  //Process synchronously
  let changedFiles = [];
  config.files.forEach(file => {
    glob.sync(file, {nodir: true})
      .forEach(file => {
        if (replaceSync(file, config.replace, config.with)) {
          changedFiles.push(file);
        }
      });
  });
  return changedFiles;
};

//Export
module.exports = replaceInFile;
