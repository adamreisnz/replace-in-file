'use strict';

/**
 * Module dependencies
 */
var fs = require('fs');

/**
 * Replace in file helper
 */
module.exports = function replaceInFile(filePath, regex, replaceWith, cb) {
  cb = cb || function() {};

  //Array given?
  if (Array.isArray(filePath)) {
    var totalFiles = filePath.length,
        replacedFiles = 0;
    filePath.forEach(function(value) {
      replaceInFile(value, regex, replaceWith, function(error) {
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

  //Read contents
  fs.readFile(filePath, 'utf8', function(error, contents) {
    if (error) {
      return cb(error);
    }
    contents = contents.replace(regex, replaceWith);
    fs.writeFile(filePath, contents, 'utf8', function(error) {
      if (error) {
        return cb(error);
      }
      cb(null);
    });
  });
};
