'use strict';

/**
 * Get replacement helper
 */
function getReplacement(replace, isArray, i) {
  if (isArray && typeof replace[i] === 'undefined') {
    return null;
  }
  if (isArray) {
    return replace[i];
  }
  return replace;
}

/**
 * Helper to make replacements
 */
module.exports = function makeReplacements(contents, from, to, file, count) {

  //Turn into array
  if (!Array.isArray(from)) {
    from = [from];
  }

  //Check if replace value is an array and prepare result
  const isArray = Array.isArray(to);
  const oldContents = contents;
  const result = {file};

  //Counting?
  if (count) {
    result.numMatches = 0;
  }

  //Make replacements
  from.forEach((item, i) => {

    //Call function if given, passing in the filename
    if (typeof item === 'function') {
      item = item(file);
    }

    //Get replacement value
    let replacement = getReplacement(to, isArray, i);
    if (replacement === null) {
      return;
    }

    //Call function if given, appending the filename
    if (typeof replacement === 'function') {
      const original = replacement;
      replacement = (...args) => original(...args, file);
    }

    //Count matches
    if (count) {
      const match = contents.match(item);
      if (match) {
        result.numMatches += match.length;
      }
    }

    //Make replacement
    contents = contents.replace(item, replacement);
  });

  //Check if changed
  result.hasChanged = (oldContents !== contents);

  //Return result and new contents
  return [result, contents];
};
