'use strict';

/**
 * Dependencies
 */
const fs = require('fs');
const makeReplacements = require('./make-replacements');
const chopByFileSize = require('./chopfile').chopByFileSizeAsync;

/**
 * Helper to replace in a single file (async)
 */
module.exports = function replaceAsync(filePath, from, to, config) {

  //Extract relevant config
  const { encoding, dry, countMatches, chunkSize } = config;

  //Wrap in promise
  return new Promise((resolve, reject) => {
    chopByFileSize(filePath, encoding, chunkSize).then(chunks => {
      let result = [];
      chunks.forEach((chunk, i) => {
        //Make replacements
        const response = makeReplacements(
          chunk, from, to, chunk, countMatches
        );
        chunks[i] = response[1];
        result.push(response[0].hasChanged);
      });
      //Not changed or dry run?
      if (result.filter(v => v).length === 0 || dry) {
        return resolve(result);
      }
      //Write to file
      fs.writeFile(filePath, chunks.join(''), encoding, error => {
        //istanbul ignore if
        if (error) {
          return reject(error);
        }
        resolve(result);
      });
    }, err => reject(err));
  });
}
