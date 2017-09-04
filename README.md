# Replace in file

[![npm version](https://img.shields.io/npm/v/replace-in-file.svg)](https://www.npmjs.com/package/replace-in-file)
[![node dependencies](https://david-dm.org/adamreisnz/replace-in-file.svg)](https://david-dm.org/adamreisnz/replace-in-file)
[![build status](https://travis-ci.org/adamreisnz/replace-in-file.svg?branch=master)](https://travis-ci.org/adamreisnz/replace-in-file)
[![coverage status](https://coveralls.io/repos/github/adamreisnz/replace-in-file/badge.svg?branch=master)](https://coveralls.io/github/adamreisnz/replace-in-file?branch=master)
[![github issues](https://img.shields.io/github/issues/adamreisnz/replace-in-file.svg)](https://github.com/adamreisnz/replace-in-file/issues)

A simple utility to quickly replace text in one or more files or globs. Works synchronously or asynchronously with either promises or callbacks. Make a single replacement or multiple replacements at once.

## Installation
```shell
# Using npm
npm install replace-in-file

# Using yarn
yarn add replace-in-file
```

## Usage

### Specify options

```js
const replace = require('replace-in-file');
const options = {

  //Single file or glob
  files: 'path/to/file',

  //Multiple files or globs
  files: [
    'path/to/file',
    'path/to/other/file',
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

  //Single file or glob to ignore
  ignore: 'path/to/ignored/file',

  //Multiple files or globs to ignore
  ignore: [
    'path/to/ignored/file',
    'path/to/other/ignored_file',
    'path/to/ignored_files/*.html',
    'another/**/*.ignore',
  ]
};
```

### Replacing multiple occurrences
Please note that the value specified in the `from` parameter is passed straight to the native [String replace method](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace). As such, if you pass a string as the `from` parameter, it will _only replace the first occurrence_.

To replace multiple occurrences at once, you must use a regular expression for the `from` parameter with the global flag enabled, e.g. `/foo/g`.

### Using callbacks for `to`
As the `to` parameter is passed straight to the native [String replace method](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace), you can also specify a callback. The following example uses a callback to convert matching strings to lowercase:

```js
const options = {
  files: 'path/to/file',
  from: /SomePattern[A-Za-z-]+/g,
  to: (match) => match.toLowerCase(),
};
```

### Asynchronous replacement with promises

```js
replace(options)
  .then(changedFiles => {
    console.log('Modified files:', changedFiles.join(', '));
  })
  .catch(error => {
    console.error('Error occurred:', error);
  });
```

### Asynchronous replacement with callback

```js
replace(options, (error, changedFiles) => {
  if (error) {
    return console.error('Error occurred:', error);
  }
  console.log('Modified files:', changedFiles.join(', '));
});
```

### Synchronous replacement

```js
try {
  const changedFiles = replace.sync(options);
  console.log('Modified files:', changedFiles.join(', '));
}
catch (error) {
  console.error('Error occurred:', error);
}
```

### Return value

The return value of the library is an array of file names of files that were modified (e.g.
had some of the contents replaced). If no replacements were made, the return array will be empty.

For example:

```js
const changedFiles = replace.sync({
  files: 'path/to/files/*.html',
  from: 'a',
  to: 'b',
});

// changedFiles could be an array like:
[
  'path/to/files/file1.html',
  'path/to/files/file3.html',
  'path/to/files/file5.html',
]
```

### CLI usage

```sh
replace-in-file from to some/file.js,some/**/glob.js
  [--ignore=ignore/files.js,ignore/**/glob.js]
  [--encoding=utf-8]
  [--allowEmptyPaths]
  [--isRegex]
  [--verbose]
```

The flags `allowEmptyPaths`, `ignore` and `encoding` are supported in the CLI.
In addition, the CLI supports the `verbose` flag to list the changed files.

Multiple files or globs can be replaced by providing a comma separated list.

A regular expression may be used for the `from` parameter by specifying the `--isRegex` flag.

## License
(MIT License)

Copyright 2015-2017, [Adam Reis](https://adam.reis.nz)
