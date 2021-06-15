'use strict';

/**
 * Dependencies
 */
const fs = require('fs');
const makeReplacements = require('./make-replacements');
const chopByFileSize = require('./chopfile').chopByFileSizeSync;

/**
 * Helper to replace in a single file (sync)
 */
  module.exports = function replaceSync(filePath, from, to, config) {
  debugger;
  //Extract relevant config and read file contents
  const { encoding, dry, countMatches, chunkSize } = config;
  const chunks = chopByFileSize(filePath, encoding, chunkSize);
  let result;
  let newContents;
  chunks.forEach((chunk, i) => {

    //Replace contents and check if anything changed
    [result, newContents] = makeReplacements(
      chunk, from, to, chunk, countMatches
    );

    //Contents changed and not a dry run? Write to file
    if (result.hasChanged && !dry) {
      chunks[i] = newContents;
    }
  });
  fs.writeFileSync(filePath, chunks.join(), encoding);
  //Return result
  return result;
};
