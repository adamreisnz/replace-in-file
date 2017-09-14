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

## Basic usage

```js
//Load the library and specify options
const replace = require('replace-in-file');
const options = {
  files: 'path/to/file',
  from: /foo/g,
  to: 'bar',
};
```

### Asynchronous replacement with promises

```js
replace(options)
  .then(changes => {
    console.log('Modified files:', changes.join(', '));
  })
  .catch(error => {
    console.error('Error occurred:', error);
  });
```

### Asynchronous replacement with callback

```js
replace(options, (error, changes) => {
  if (error) {
    return console.error('Error occurred:', error);
  }
  console.log('Modified files:', changes.join(', '));
});
```

### Synchronous replacement

```js
try {
  const changes = replace.sync(options);
  console.log('Modified files:', changes.join(', '));
}
catch (error) {
  console.error('Error occurred:', error);
}
```

### Return value

The return value of the library is an array of file names of files that were modified (e.g.
had some of the contents replaced). If no replacements were made, the return array will be empty.

```js
const changes = replace.sync({
  files: 'path/to/files/*.html',
  from: 'foo',
  to: 'bar',
});

console.log(changes);

// [
//   'path/to/files/file1.html',
//   'path/to/files/file3.html',
//   'path/to/files/file5.html',
// ]
```

## Advanced usage

### Replace a single file or glob
```js
const options = {
  files: 'path/to/file',
};
```

### Replace multiple files or globs

```js
const options = {
  files: [
    'path/to/file',
    'path/to/other/file',
    'path/to/files/*.html',
    'another/**/*.path',
  ],
};
```

### Replace first occurrence only

```js
const options = {
  from: 'foo',
  to: 'bar',
};
```

### Replace all occurrences
Please note that the value specified in the `from` parameter is passed straight to the native [String replace method](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace). As such, if you pass a string as the `from` parameter, it will _only replace the first occurrence_.

To replace multiple occurrences at once, you must use a regular expression for the `from` parameter with the global flag enabled, e.g. `/foo/g`.

```js
const options = {
  from: /foo/g,
  to: 'bar',
};
```

### Multiple values with the same replacement

These will be replaced sequentially.

```js
const options = {
  from: [/foo/g, /baz/g],
  to: 'bar',
};
```

### Multiple values with different replacements

These will be replaced sequentially.

```js
const options = {
  from: [/foo/g, /baz/g],
  to: ['bar', 'bax'],
};
```

### Using callbacks for `to`
As the `to` parameter is passed straight to the native [String replace method](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace), you can also specify a callback. The following example uses a callback to convert matching strings to lowercase:

```js
const options = {
  files: 'path/to/file',
  from: /SomePattern[A-Za-z-]+/g,
  to: (match) => match.toLowerCase(),
};
```

### Ignore a single file or glob

```js
const options = {
  ignore: 'path/to/ignored/file',
};
```

### Ignore multiple files or globs

```js
const options = {
  ignore: [
    'path/to/ignored/file',
    'path/to/other/ignored_file',
    'path/to/ignored_files/*.html',
    'another/**/*.ignore',
  ],
};
```

### Allow empty/invalid paths
If set to true, empty or invalid paths will fail silently and no error will be thrown. For asynchronous replacement only. Defaults to `false`.

```js
const options = {
  allowEmptyPaths: true,
};
```

### Disable globs
You can disable globs if needed using this flag. Use this when you run into issues with file paths like files like `//SERVER/share/file.txt`. Defaults to `false`.

```js
const options = {
  disableGlobs: true,
};
```

### Specify character encoding
Use a different character encoding for reading/writing files. Defaults to `utf-8`.

```js
const options = {
  encoding: 'utf8',
};
```

## CLI usage

```sh
replace-in-file from to some/file.js,some/**/glob.js
  [--configFile=replace-config.js]
  [--ignore=ignore/files.js,ignore/**/glob.js]
  [--encoding=utf-8]
  [--disableGlobs]
  [--isRegex]
  [--verbose]
```

Multiple files or globs can be replaced by providing a comma separated list.

The flags `disableGlobs`, `ignore` and `encoding` are supported in the CLI.

The flag `allowEmptyPaths` is not supported in the CLI as the replacement is
synchronous, and the flag is only relevant for asynchronous replacement.

To list the changed files, use the `verbose` flag.

A regular expression may be used for the `from` parameter by specifying the `--isRegex` flag.

## Version information
From version 3.0.0 onwards, replace in file requires Node 6 or higher. If you need support for Node 4 or 5, use version 2.x.x.

## License
(MIT License)

Copyright 2015-2017, [Adam Reis](https://adam.reis.nz)
