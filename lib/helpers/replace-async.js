'use strict';

/**
 * Dependencies
 */
const fs = require('fs');
const iconv = require('iconv-lite');
const makeReplacements = require('./make-replacements');

/**
 * Helper to replace in a single file (async)
 */
module.exports = function replaceAsync(file, from, to, config) {

  //Extract relevant config
  const {encoding, dry, countMatches} = config;

  //Wrap in promise
  return new Promise((resolve, reject) => {
    fs.readFile(file, (error, contents) => {
      //istanbul ignore if
      if (error) {
        return reject(error);
      }

      const contentsEncoded = iconv.decode(contents, encoding);

      //Make replacements
      const [result, newContents] = makeReplacements(
        contentsEncoded, from, to, file, countMatches,
      );

      //Not changed or dry run?
      if (!result.hasChanged || dry) {
        return resolve(result);
      }

      //Write to file
      fs.writeFile(file, iconv.encode(newContents, encoding), error => {
        //istanbul ignore if
        if (error) {
          return reject(error);
        }
        resolve(result);
      });
    });
  });
};
