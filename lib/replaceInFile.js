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
    var newContents = contents.replace(replaceThis, withThat);
    if (newContents !== contents) {
      fs.writeFile(filePath, contents, 'utf8', function(error) {
        if (error) {
          return cb(error);
        }
        cb(null);
      });
    } else {
      cb(null)
    }
  });
}

/**
 * Replace in file helper
 */
module.exports = function replaceInFile(config, cb) {
  cb = cb || function() {};

  //Array given?
  if (Array.isArray(config.files)) {
    var totalFiles = config.files.length;
    var replacedFiles = 0;
    config.files.forEach(function(file) {
      replaceInSingleFile(file, config.replace, config.with, function(error) {
        if (error) {
          return cb(error);
        }
        replacedFiles++;
        if (replacedFiles === totalFiles) {
          cb(null);
        }
      });
    });
    return;
  }

  //Replace in single file
  replaceInSingleFile(config.files, config.replace, config.with, cb);
};
