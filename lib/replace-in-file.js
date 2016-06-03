'use strict';

/**
 * Module dependencies
 */
var fs = require('fs');

/**
 * Helper to replace in a single file
 */
function replace(filePath, find, replace, cb) {
  fs.readFile(filePath, 'utf8', function(error, contents) {
    if (error) {
      return cb(error);
    }

    //Replace contents and check if anything changed
    var newContents = contents.replace(find, replace);
    if (newContents === contents) {
      return cb(null, false);
    }

    //Write to file
    fs.writeFile(filePath, newContents, 'utf8', function(error) {
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
  var contents = fs.readFileSync(filePath, 'utf8');

  //Replace contents and check if anything changed
  var newContents = contents.replace(find, replace);
  if (newContents === contents) {
    return false;
  }

  //Write to file
  fs.writeFileSync(filePath, newContents, 'utf8');
  return true;
}

/**
 * Replace in file helper
 */
module.exports = function replaceInFile(config, cb) {

  //No array given?
  if (!Array.isArray(config.files)) {
    config.files = [config.files];
    return replaceInFile(config, cb);
  }

  //Initialize helper vars
  var totalFiles = config.files.length;
  var processedFiles = 0;
  var changedFiles = [];

  //No callback given? Perform sync operation
  if (!cb) {
    config.files.forEach(function(file) {
      if (replaceSync(file, config.replace, config.with)) {
        changedFiles.push(file);
      }
    });
    return changedFiles;
  }

  //Otherwise, perform async operation
  config.files.forEach(function(file) {
    replace(file, config.replace, config.with, function(error, hasChanged) {
      if (error) {
        return cb(error);
      }
      if (hasChanged) {
        changedFiles.push(file);
      }
      processedFiles++;
      if (processedFiles === totalFiles) {
        cb(null, changedFiles);
      }
    });
  });
};
