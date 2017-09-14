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
module.exports = function makeReplacements(contents, from, to) {

  //Turn into array
  if (!Array.isArray(from)) {
    from = [from];
  }

  //Check if replace value is an array
  const isArray = Array.isArray(to);

  //Make replacements
  from.forEach((item, i) => {

    //Get replacement value
    const replacement = getReplacement(to, isArray, i);
    if (replacement === null) {
      return;
    }

    //Make replacement
    contents = contents.replace(item, replacement);
  });

  //Return modified contents
  return contents;
};
