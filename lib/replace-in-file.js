'use strict';

/**
 * Module dependencies
 */
const fs = require('fs');
const glob = require('glob');
const chalk = require('chalk');

/**
 * Defaults
 */
const defaults = {
  allowEmptyPaths: false,
  encoding: 'utf-8',
  ignore: [],
};

/**
 * Parse config
 */
function parseConfig(config) {

  //Validate config
  if (typeof config !== 'object' || config === null) {
    throw new Error('Must specify configuration object');
  }

  //Backwards compatibilility
  if (typeof config.replace !== 'undefined' &&
    typeof config.from === 'undefined') {
    console.log(
      chalk.yellow('Option `replace` is deprecated. Use `from` instead.')
    );
    config.from = config.replace;
  }
  if (typeof config.with !== 'undefined' &&
    typeof config.to === 'undefined') {
    console.log(
      chalk.yellow('Option `with` is deprecated. Use `to` instead.')
    );
    config.to = config.with;
  }

  //Validate values
  if (typeof config.files === 'undefined') {
    throw new Error('Must specify file or files');
  }
  if (typeof config.from === 'undefined') {
    throw new Error('Must specify string or regex to replace');
  }
  if (typeof config.to === 'undefined') {
    throw new Error('Must specify a replacement (can be blank string)');
  }
  if (typeof config.ignore === 'undefined') {
    config.ignore = [];
  }

  //Use default encoding if invalid
  if (typeof config.encoding !== 'string' || config.encoding === '') {
    config.encoding = 'utf-8';
  }

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
function makeReplacements(contents, from, to) {

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
}

/**
 * Helper to replace in a single file (sync)
 */
function replaceSync(file, from, to, enc) {

  //Read contents
  const contents = fs.readFileSync(file, enc);

  //Replace contents and check if anything changed
  const newContents = makeReplacements(contents, from, to);
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
function replaceAsync(file, from, to, enc) {
  return new Promise((resolve, reject) => {
    fs.readFile(file, enc, (error, contents) => {
      //istanbul ignore if
      if (error) {
        return reject(error);
      }

      //Replace contents and check if anything changed
      let newContents = makeReplacements(contents, from, to);
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
function globPromise(pattern, ignore, allowEmptyPaths) {
  return new Promise((resolve, reject) => {
    glob(pattern, {ignore: ignore, nodir: true}, (error, files) => {

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
  // const {files, from, to, allowEmptyPaths, encoding, ignore} = config;
  const files = config.files;
  const from = config.from;
  const to = config.to;
  const encoding = config.encoding;
  const allowEmptyPaths = config.allowEmptyPaths;
  const ignore = config.ignore;
  const globs = Array.isArray(files) ? files : [files];
  const ignored = Array.isArray(ignore) ? ignore : [ignore];

  //Find files
  return Promise
    .all(globs.map(pattern => globPromise(pattern, ignored, allowEmptyPaths)))

    //Flatten array
    .then(files => [].concat.apply([], files))

    //Make replacements
    .then(files => Promise.all(files.map(file => {
      return replaceAsync(file, from, to, encoding);
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
  // const {files, from, to, encoding, ignore} = config;
  const files = config.files;
  const from = config.from;
  const to = config.to;
  const encoding = config.encoding;
  const ignore = config.ignore;
  const globs = Array.isArray(files) ? files : [files];
  const ignored = Array.isArray(ignore) ? ignore : [ignore];
  const changedFiles = [];

  //Process synchronously
  globs.forEach(pattern => {
    glob
      .sync(pattern, {ignore: ignored, nodir: true})
      .forEach(file => {
        if (replaceSync(file, from, to, encoding)) {
          changedFiles.push(file);
        }
      });
  });

  //Return changed files
  return changedFiles;
};

//Export
module.exports = replaceInFile;
