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
```js
var replace = require('replace-in-file');

replace({

  //Single file
  files: 'path/to/file',

  //Or multiple files
  files: [
    'path/to/file',
    'path/to/other/file',
  ],

  //Replacement to make (can be string or regex)
  replace: /Find me/g,
  with: 'Replacement'

}, function(error, changedFiles) {

  //Catch errors
  if (error) {
    return console.error('Error occurred:', error);
  }

  //List changed files
  console.log('Modified files:', changedFiles.join(', '));
});
```

## License
(MIT License)

Copyright 2015-2016, [Adam Buczynski](http://adambuczynski.com)
