'use strict';

/**
 * Module dependencies
 */
var fs = require('fs');

/**
 * Helper to replace in a single file
 */
function replaceInSingleFile(filePath, replaceThis, withThat, cb) {
  fs.readFile(filePath, 'utf8', function(error, contents) {
    if (error) {
      return cb(error);
    }

    //Replace contents and check if anything changed
    var newContents = contents.replace(replaceThis, withThat);
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
 * Replace in file helper
 */
module.exports = function replaceInFile(config, cb) {
  cb = cb || function() {};

  //No array given?
  if (!Array.isArray(config.files)) {
    config.files = [config.files];
    return replaceInFile(config, cb);
  }

  //Initialize helper vars
  var totalFiles = config.files.length;
  var processedFiles = 0;
  var changedFiles = [];

  //Replace each file
  config.files.forEach(function(file) {
    replaceInSingleFile(file, config.replace, config.with, function(error, hasChanged) {
      if (error) {
        return cb(error);
      }
      if (hasChanged) {
        changedFiles.push(file);
      }
      processedFiles++;
      if (processedFiles === totalFiles) {
        cb(null, [changedFiles]);
      }
    });
  });
};
