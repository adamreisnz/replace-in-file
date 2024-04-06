
const chalk = require('chalk');
const parseConfig = require('./helpers/parse-config');
const getPathsSync = require('./helpers/get-paths-sync');
const getPathsAsync = require('./helpers/get-paths-async');
const replaceSync = require('./helpers/replace-sync');
const replaceAsync = require('./helpers/replace-async');
const processFile = require('./process-file');

/**
 * Replace in file helper
 */
async function replaceInFile(configCollection, cb) {
  // If 'configCollection' is passed as object, wrapping it with array
  const tempConfigCollection = Array.isArray(configCollection) ? configCollection : [configCollection];

  try {
    const resultPromiseCollection = tempConfigCollection.map((config) => {
      // If custom processor is provided use it instead
      if (config && config.processor) {
        return processFile(config, cb);
      }

      //Parse config
      try {
        config = parseConfig(config);
      }
      catch (error) {
        if (typeof cb === 'function') {
          return cb(error, null);
        }
        return Promise.reject(error);
      }

      //Get config
      const {files, from, to, dry, verbose} = config;

      //Dry run?
      //istanbul ignore if: No need to test console logs
      if (dry && verbose) {
        console.log(chalk.yellow('Dry run, not making actual changes'));
      }

      //Find paths
      return getPathsAsync(files, config)

        //Make replacements
        .then(paths => Promise.all(
          paths.map(file => replaceAsync(file, from, to, config))
        ))

        //Success handler
        .then(results => {
          if (typeof cb === 'function') {
            cb(null, results);
          }
          return results;
        })

        //Error handler
        .catch(error => {
          if (typeof cb === 'function') {
            cb(error);
          }
          throw new Error(error);
        });
    });

    // await for result promise to get settled
    const resultCollection = await Promise.all(resultPromiseCollection);

    // Flattening the resultCollection to 1 level depth
    return resultCollection.flat();
  }
  catch(error) {
    throw new Error(error);
  }
}

/**
 * Sync API
 */
function replaceInFileSync(configCollection) {
  // If 'configCollection' is passed as object, wrapping it with array
  const tempConfigCollection = Array.isArray(configCollection) ? configCollection : [configCollection];
  
  const resultCollection = tempConfigCollection.map((config) => {
    //If custom processor is provided use it instead
    if (config && config.processor) {
      return processFile.processFileSync(config);
    }

    //Parse config
    config = parseConfig(config);

    //Get config, paths, and initialize changed files
    const {files, from, to, dry, verbose} = config;
    const paths = getPathsSync(files, config);

    //Dry run?
    //istanbul ignore if: No need to test console logs
    if (dry && verbose) {
      console.log(chalk.yellow('Dry run, not making actual changes'));
    }

    //Process synchronously and return results
    return paths.map(path => replaceSync(path, from, to, config));
  });

  // Flattening the resultCollection to 1 level depth
  return resultCollection.flat();
}

// Self-reference to support named import
replaceInFile.replaceInFile = replaceInFile;
replaceInFile.replaceInFileSync = replaceInFileSync;
replaceInFile.sync = replaceInFileSync;

//Export
module.exports = replaceInFile;
