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

//https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

/**
 * Helper to make replacements
 */
module.exports = function makeReplacements(contents, from, to, file) {
  let result = {
    hasReplacements: false
  };

  //Turn into array
  if (!Array.isArray(from)) {
    from = [from];
  }

  //Check if replace value is an array
  const isArray = Array.isArray(to);

  //Make replacements
  from.forEach((item, i) => {

    //Call function if given, passing the filename
    if (typeof item === 'function') {
      item = item(file);
    }

    //Ensure item is a regular expression
    if (typeof item === 'string') {
      item = new RegExp(escapeRegExp(item)); 
    }

    //Ensure there is a match
    if (item.test(contents)) {
      result.hasReplacements = true;

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

      //Make replacement
      contents = contents.replace(item, replacement);
    }
  });

  result.contents = contents;

  //Return modified contents
  return result;
};
