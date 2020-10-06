'use strict';

/**
 * Dependencies
 */
const fs = require('fs');
const iconv = require('iconv-lite');
const makeReplacements = require('./make-replacements');

/**
 * Helper to replace in a single file (sync)
 */
module.exports = function replaceSync(file, from, to, config) {

  //Extract relevant config and read file contents
  const {encoding, dry, countMatches} = config;
  const contents = fs.readFileSync(file);

  const contentsEncoded = iconv.decode(contents, encoding);

  //Replace contents and check if anything changed
  const [result, newContents] = makeReplacements(
    contentsEncoded, from, to, file, countMatches,
  );

  //Contents changed and not a dry run? Write to file
  if (result.hasChanged && !dry) {
    fs.writeFileSync(file, iconv.encode(newContents, encoding));
  }

  //Return result
  return result;
};
