'use strict';

/**
 * Module dependencies
 */
const fs = require('fs');
const glob = require('glob');

/**
 * Defaults
 */
const defaults = {
  allowEmptyPaths: false,
  encoding: 'utf-8',
};

/**
 * Parse config
 */
function parseConfig(config) {

  //Validate input
  if (typeof config !== 'object' || config === null) {
    throw new Error('Must specify configuration object');
  }
  if (typeof config.files === 'undefined') {
    throw new Error('Must specify file or files');
  }
  if (typeof config.replace === 'undefined') {
    throw new Error('Must specify string or regex to replace');
  }
  if (typeof config.with === 'undefined') {
    throw new Error('Must specify a replacement (can be blank string)');
  }

  //Use different naming internally as we can't use `with` as a variable name
  config.find = config.replace;
  config.replace = config.with;
  delete config.with;

  //Merge config with defaults
  return Object.assign({}, defaults, config);
}

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
function makeReplacements(contents, find, replace) {

  //Turn into array
  if (!Array.isArray(find)) {
    find = [find];
  }

  //Check if replace value is an array
  const isReplaceArray = Array.isArray(replace);

  //Make replacements
  find.forEach((item, i) => {

    //Get replacement value
    const replacement = getReplacement(replace, isReplaceArray, i);
    if (replacement === null) {
      return;
    }

    //Make replacement
    contents = contents.replace(item, replacement);
  });

  //Return modified contents
  return contents;
}

/**
 * Helper to replace in a single file (sync)
 */
function replaceSync(file, find, replace, enc) {

  //Read contents
  const contents = fs.readFileSync(file, enc);

  //Replace contents and check if anything changed
  const newContents = makeReplacements(contents, find, replace);
  if (newContents === contents) {
    return false;
  }

  //Write to file
  fs.writeFileSync(file, newContents, enc);
  return true;
}

/**
 * Helper to replace in a single file (async)
 */
function replaceAsync(file, find, replace, enc) {
  return new Promise((resolve, reject) => {
    fs.readFile(file, enc, (error, contents) => {
      //istanbul ignore if
      if (error) {
        return reject(error);
      }

      //Replace contents and check if anything changed
      let newContents = makeReplacements(contents, find, replace);
      if (newContents === contents) {
        return resolve({file, hasChanged: false});
      }

      //Write to file
      fs.writeFile(file, newContents, enc, error => {
        //istanbul ignore if
        if (error) {
          return reject(error);
        }
        resolve({file, hasChanged: true});
      });
    });
  });
}

/**
 * Promise wrapper for glob
 */
function globPromise(pattern, allowEmptyPaths) {
  return new Promise((resolve, reject) => {
    glob(pattern, {nodir: true}, (error, files) => {

      //istanbul ignore if: hard to make glob error
      if (error) {
        return reject(error);
      }

      //Error if no files match, unless allowEmptyPaths is true
      if (files.length === 0 && !allowEmptyPaths) {
        return reject(new Error('No files match the pattern: ' + pattern));
      }

      //Resolve
      resolve(files);
    });
  });
}

/**
 * Replace in file helper
 */
function replaceInFile(config, cb) {

  //Parse config
  try {
    config = parseConfig(config);
  }
  catch (error) {
    if (cb) {
      return cb(error, null);
    }
    return Promise.reject(error);
  }

  //Get config and globs
  const {files, find, replace, allowEmptyPaths, encoding} = config;
  const globs = Array.isArray(files) ? files : [files];

  //Find files
  return Promise
    .all(globs.map(pattern => globPromise(pattern, allowEmptyPaths)))

    //Flatten array
    .then(files => [].concat.apply([], files))

    //Make replacements
    .then(files => Promise.all(files.map(file => {
      return replaceAsync(file, find, replace, encoding);
    })))

    //Convert results to array of changed files
    .then(results => {
      return results
        .filter(result => result.hasChanged)
        .map(result => result.file);
    })

    //Handle via callback or return
    .then(changedFiles => {
      if (cb) {
        cb(null, changedFiles);
      }
      return changedFiles;
    })

    //Handle error via callback, or rethrow
    .catch(error => {
      if (cb) {
        cb(error);
      }
      else {
        throw error;
      }
    });
}

/**
 * Sync API
 */
replaceInFile.sync = function(config) {

  //Parse config
  config = parseConfig(config);

  //Get config and globs
  const {files, find, replace, encoding} = config;
  const globs = Array.isArray(files) ? files : [files];
  const changedFiles = [];

  //Process synchronously
  globs.forEach(pattern => {
    glob
      .sync(pattern, {nodir: true})
      .forEach(file => {
        if (replaceSync(file, find, replace, encoding)) {
          changedFiles.push(file);
        }
      });
  });

  //Return changed files
  return changedFiles;
};

//Export
module.exports = replaceInFile;
