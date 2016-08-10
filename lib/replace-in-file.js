'use strict';

/**
 * Module dependencies
 */
let fs = require('fs');
let glob = require('glob');

/**
 * Helper to replace in a single file (async)
 */
function replace(filePath, find, replace, cb) {
  fs.readFile(filePath, 'utf8', (error, contents) => {
    //istanbul ignore if
    if (error) {
      return cb(error);
    }

    //Replace contents and check if anything changed
    let newContents = contents.replace(find, replace);
    if (newContents === contents) {
      return cb(null, false);
    }

    //Write to file
    fs.writeFile(filePath, newContents, 'utf8', error => {
      //istanbul ignore if
      if (error) {
        return cb(error);
      }
      cb(null, true);
    });
  });
}

/**
 * Helper to replace in a single file (sync)
 */
function replaceSync(filePath, find, replace) {

  //Read contents
  let contents = fs.readFileSync(filePath, 'utf8');

  //Replace contents and check if anything changed
  let newContents = contents.replace(find, replace);
  if (newContents === contents) {
    return false;
  }

  //Write to file
  fs.writeFileSync(filePath, newContents, 'utf8');
  return true;
}

/**
 * Helper to combine globbed files into one array
 */
function globArray(array, allowEmptyPaths, cb) {

  //Initialize
  let processed = 0;
  let expandedArray = [];

  //Process array
  array.forEach(pattern => {
    glob(pattern, {nodir: true}, (err, result) => {

      //istanbul ignore if: hard to make glob error
      if (err) {
        return cb(err);
      }

      //Error if no files match, unless allowEmptyPaths is true
      if (result.length === 0 && !allowEmptyPaths) {
        return cb(new Error('No files match the pattern: ' + pattern));
      }

      //Extending an array
      expandedArray.push.apply(expandedArray, result);
      processed++;
      if (processed === array.length) {
        cb(null, expandedArray);
      }
    });
  });
}

/**
 * Replace in file helper
 */
module.exports = function replaceInFile(config, cb) {

  //No array given?
  if (!Array.isArray(config.files)) {
    config.files = [config.files];
  }

  //Initialize helper vars
  let processedFiles = 0;
  let changedFiles = [];

  //No callback given? Perform sync operation
  if (!cb) {
    config.files.forEach(file => {
      glob.sync(file, {nodir: true})
        .forEach(file => {
          if (replaceSync(file, config.replace, config.with)) {
            changedFiles.push(file);
          }
        });
    });
    return changedFiles;
  }

  //Otherwise, perform async operation
  globArray(config.files, config.allowEmptyPaths, (error, files) => {
    if (error) {
      return cb(error);
    }

    //If there are no files (can happen with allowEmptyPaths), return
    if (files.length === 0) {
      return cb(null, []);
    }

    //Process files
    files.forEach(file => {
      replace(file, config.replace, config.with, (error, hasChanged) => {
        //istanbul ignore if
        if (error) {
          return cb(error);
        }
        if (hasChanged) {
          changedFiles.push(file);
        }
        processedFiles++;
        if (processedFiles === files.length) {
          cb(null, changedFiles);
        }
      });
    });
  });
};
