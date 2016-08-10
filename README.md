# Replace in file

[![npm version](https://img.shields.io/npm/v/replace-in-file.svg)](https://www.npmjs.com/package/replace-in-file)
[![node dependencies](https://david-dm.org/adambuczynski/replace-in-file.svg)](https://david-dm.org/adambuczynski/replace-in-file)
[![build status](https://travis-ci.org/adambuczynski/replace-in-file.svg?branch=master)](https://travis-ci.org/adambuczynski/replace-in-file)
[![coverage status](https://coveralls.io/repos/github/adambuczynski/replace-in-file/badge.svg?branch=master)](https://coveralls.io/github/adambuczynski/replace-in-file?branch=master)
[![github issues](https://img.shields.io/github/issues/adambuczynski/replace-in-file.svg)](https://github.com/adambuczynski/replace-in-file/issues)

A simple utility to quickly replace text in one or more files.

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
  replace: /Find me/g,
  with: 'Replacement',

  //Specify if empty/invalid file paths are allowed, defaults to false.
  //If set to true, these paths will fail silently and no error will be thrown.
  allowEmptyPaths: false,
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

## License
(MIT License)

Copyright 2015-2016, [Adam Buczynski](http://adambuczynski.com)
