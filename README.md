# Replace in file

[![npm version](https://img.shields.io/npm/v/replace-in-file.svg)](https://www.npmjs.com/package/replace-in-file)
[![node dependencies](https://david-dm.org/adamreisnz/replace-in-file.svg)](https://david-dm.org/adamreisnz/replace-in-file)
[![build status](https://travis-ci.org/adamreisnz/replace-in-file.svg?branch=master)](https://travis-ci.org/adamreisnz/replace-in-file)
[![coverage status](https://coveralls.io/repos/github/adamreisnz/replace-in-file/badge.svg?branch=master)](https://coveralls.io/github/adamreisnz/replace-in-file?branch=master)
[![github issues](https://img.shields.io/github/issues/adamreisnz/replace-in-file.svg)](https://github.com/adamreisnz/replace-in-file/issues)

A simple utility to quickly replace text in one or more files or globs. Works synchronously or asynchronously with either promises or callbacks. Make a single replacement or multiple replacements at once.

## Installation
```shell
npm install replace-in-file
```

## Usage

Specify options:

```js
const replace = require('replace-in-file');
const options = {

  //Single file
  files: 'path/to/file',

  //Multiple files
  files: [
    'path/to/file',
    'path/to/other/file',
  ],

  //Glob(s)
  files: [
    'path/to/files/*.html',
    'another/**/*.path',
  ],

  //Replacement to make (string or regex)
  from: /foo/g,
  to: 'bar',

  //Multiple replacements with the same string (replaced sequentially)
  from: [/foo/g, /baz/g],
  to: 'bar',

  //Multiple replacements with different strings (replaced sequentially)
  from: [/foo/g, /baz/g],
  to: ['bar', 'bax'],

  //Specify if empty/invalid file paths are allowed (defaults to false)
  //If set to true these paths will fail silently and no error will be thrown.
  allowEmptyPaths: false,

  //Character encoding for reading/writing files (defaults to utf-8)
  encoding: 'utf8',
};
```

Asynchronous replacement, with promises:

```js
replace(options)
  .then(changedFiles => {
    console.log('Modified files:', changedFiles.join(', '));
  })
  .catch(error => {
    console.error('Error occurred:', error);
  });
```

Asynchronous replacement, with callback:

```js
replace(options, (error, changedFiles) => {
  if (error) {
    return console.error('Error occurred:', error);
  }
  console.log('Modified files:', changedFiles.join(', '));
});
```

Synchronous replacement:

```js
try {
  let changedFiles = replace.sync(options);
  console.log('Modified files:', changedFiles.join(', '));
}
catch (error) {
  console.error('Error occurred:', error);
}
```

Via CLI:

```sh
replace-in-file from to some/file.js,some/**/glob.js [--isRegex]
```

The flags `allowEmptyPaths` and `encoding` are supported in the CLI.
In addition, the CLI supports the `verbose` flag to list the changed files.

Multiple files or globs can be replaced by providing a comma separated list.

A regular expression may be used for the `from` parameter by specifying the `--isRegex` flag.

## License
(MIT License)

Copyright 2015-2017, [Adam Reis](http://adam.reis.nz)
