'use strict';

/**
 * Dependencies
 */
const fs = require('fs');
const makeReplacements = require('./make-replacements');

/**
 * Helper to replace in a single file (sync)
 */
module.exports = function replaceSync(file, from, to, enc, dry) {

  //Read contents
  const contents = fs.readFileSync(file, enc);

  //Replace contents and check if anything changed
  const newContents = makeReplacements(contents, from, to, file);
  if (newContents === contents) {
    return false;
  }

  //Dry run?
  if (dry) {
    return true;
  }

  //Write to file
  fs.writeFileSync(file, newContents, enc);
  return true;
};
