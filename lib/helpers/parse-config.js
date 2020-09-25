'use strict';

const iconv = require('iconv-lite');

/**
 * Defaults
 */
const defaults = {
  ignore: [],
  encoding: 'utf-8',
  disableGlobs: false,
  allowEmptyPaths: false,
  countMatches: false,
  isRegex: false,
  verbose: false,
  quiet: false,
  dry: false,
  glob: {},
  cwd: null,
};

/**
 * Parse config
 */
module.exports = function parseConfig(config) {

  //Validate config
  if (typeof config !== 'object' || config === null) {
    throw new Error('Must specify configuration object');
  }

  //Fix glob
  config.glob = config.glob || {};

  //Extract data
  const {files, from, to, ignore, encoding} = config;

  //Validate values
  if (typeof files === 'undefined') {
    throw new Error('Must specify file or files');
  }
  if (typeof from === 'undefined') {
    throw new Error('Must specify string or regex to replace');
  }
  if (typeof to === 'undefined') {
    throw new Error('Must specify a replacement (can be blank string)');
  }

  switch (false) {
    case encoding in config:
      config.enable = 'utf-8';
      break;
    case iconv.encodingExists(encoding):
      throw new Error(`Encoding: ${encoding} not supported yet`);
    default:
      break;
  }

  //Ensure arrays
  if (!Array.isArray(files)) {
    config.files = [files];
  }
  if (!Array.isArray(ignore)) {
    if (typeof ignore === 'undefined') {
      config.ignore = [];
    }
    else {
      config.ignore = [ignore];
    }
  }

  //Merge config with defaults
  return Object.assign({}, defaults, config);
};
