# Replace in file

[![npm version](https://img.shields.io/npm/v/replace-in-file.svg)](https://www.npmjs.com/package/replace-in-file)
[![ci status](https://github.com/adamreisnz/replace-in-file/actions/workflows/ci.yml/badge.svg)](https://github.com/adamreisnz/replace-in-file/actions/workflows/ci.yml)
[![github issues](https://img.shields.io/github/issues/adamreisnz/replace-in-file.svg)](https://github.com/adamreisnz/replace-in-file/issues)

A simple utility to quickly replace text in one or more files or globs. Works synchronously or asynchronously with either promises or callbacks. Make a single replacement or multiple replacements at once.

## Index
- [Installation](#installation)
- [Basic usage](#basic-usage)
  - [Asynchronous replacement](#asynchronous-replacement)
  - [Synchronous replacement](#synchronous-replacement)
  - [Return value](#return-value)
  - [Counting matches and replacements](#counting-matches-and-replacements)
- [Advanced usage](#advanced-usage)
  - [Replace a single file or glob](#replace-a-single-file-or-glob)
  - [Replace multiple files or globs](#replace-multiple-files-or-globs)
  - [Replace first occurrence only](#replace-first-occurrence-only)
  - [Replace all occurrences](#replace-all-occurrences)
  - [Multiple values with the same replacement](#multiple-values-with-the-same-replacement)
  - [Custom regular expressions](#custom-regular-expressions)
  - [Multiple values with different replacements](#multiple-values-with-different-replacements)
  - [Multiple replacements with different options](#multiple-replacements-with-different-options)
  - [Using callbacks for `from`](#using-callbacks-for-from)
  - [Using callbacks for `to`](#using-callbacks-for-to)
  - [Saving to a different file](#saving-to-a-different-file)
  - [Ignore a single file or glob](#ignore-a-single-file-or-glob)
  - [Ignore multiple files or globs](#ignore-multiple-files-or-globs)
  - [Allow empty/invalid paths](#allow-emptyinvalid-paths)
  - [Disable globs](#disable-globs)
  - [Specify glob configuration](#specify-glob-configuration)
  - [Making replacements on network drives](#making-replacements-on-network-drives)
  - [Specify character encoding](#specify-character-encoding)
  - [Dry run](#dry-run)
  - [Replacing in large files (streaming)](#replacing-in-large-files-streaming)
  - [Using custom processors](#using-custom-processors)
  - [Using a custom file system API](#using-a-custom-file-system-api)
- [CLI usage](#cli-usage)
- [A note on using globs with the CLI](#a-note-on-using-globs-with-the-cli)
- [Version information](#version-information)
- [License](#license)

## Installation
```shell
# Using npm
npm i replace-in-file

# Using yarn
yarn add replace-in-file

# Using pnpm
pnpm add replace-in-file
```

## Basic usage

### Asynchronous replacement

```js
import {replaceInFile} from 'replace-in-file'

const options = {
  files: 'path/to/file',
  from: /foo/g,
  to: 'bar',
}

try {
  const results = await replaceInFile(options)
  console.log('Replacement results:', results)
}
catch (error) {
  console.error('Error occurred:', error)
}
```

### Synchronous replacement

```js
import {replaceInFileSync} from 'replace-in-file'

const options = {
  files: 'path/to/file',
  from: /foo/g,
  to: 'bar',
}

try {
  const results = replaceInFileSync(options)
  console.log('Replacement results:', results)
}
catch (error) {
  console.error('Error occurred:', error)
}
```

### Return value

The return value of the library is an array of replacement results against each file that was processed. This includes files in which no replacements were made.

Each result contains the following values:

- `file`: The path to the file that was processed
- `hasChanged`: Flag to indicate if the file was changed or not

```js
const results = replaceInFileSync({
  files: 'path/to/files/*.html',
  from: /foo/g,
  to: 'bar',
})

console.log(results)

// [
//   {
//     file: 'path/to/files/file1.html',
//     hasChanged: true,
//   },
//   {
//     file: 'path/to/files/file2.html',
//     hasChanged: true,
//   },
//   {
//     file: 'path/to/files/file3.html',
//     hasChanged: false,
//   },
// ]

```

To get an array of changed files, simply map the results as follows:

```js
const changedFiles = results
  .filter(result => result.hasChanged)
  .map(result => result.file)
```

### Counting matches and replacements
By setting the `countMatches` configuration flag to `true`, the number of matches and replacements per file will be counted and present in the results array.

- `numMatches`: Indicates the number of times a match was found in the file
- `numReplacements`: Indicates the number of times a replacement was made in the file

Note that the number of matches can be higher than the number of replacements if a match and replacement are the same string.

```js
const results = replaceInFileSync({
  files: 'path/to/files/*.html',
  from: /foo/g,
  to: 'bar',
  countMatches: true,
})

console.log(results)

// [
//   {
//     file: 'path/to/files/file1.html',
//     hasChanged: true,
//     numMatches: 3,
//     numReplacements: 3,
//   },
//   {
//     file: 'path/to/files/file2.html',
//     hasChanged: true,
//     numMatches: 1,
//     numReplacements: 1,
//   },
//   {
//     file: 'path/to/files/file3.html',
//     hasChanged: false,
//     numMatches: 0,
//     numReplacements: 0,
//   },
// ]
```

## Advanced usage

### Replace a single file or glob
```js
const options = {
  files: 'path/to/file',
}
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
}
```

### Replace first occurrence only

```js
const options = {
  from: 'foo',
  to: 'bar',
}
```

### Replace all occurrences
Please note that the value specified in the `from` parameter is passed straight to the native [String replace method](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace). As such, if you pass a string as the `from` parameter, it will _only replace the first occurrence_.

To replace multiple occurrences at once, you must use a regular expression for the `from` parameter with the global flag enabled, e.g. `/foo/g`.

```js
const options = {
  from: /foo/g,
  to: 'bar',
}
```

### Multiple values with the same replacement

These will be replaced sequentially.

```js
const options = {
  from: [/foo/g, /baz/g],
  to: 'bar',
}
```

### Multiple values with different replacements

These will be replaced sequentially.

```js
const options = {
  from: [/foo/g, /baz/g],
  to: ['bar', 'bax'],
}
```

### Multiple replacements with different options

There is no direct API in this package to make multiple replacements on different files with different options. However, you can easily accomplish this in your scripts as follows:

```js
const replacements = [
  {
    files: 'path/to/file1',
    from: /foo/g,
    to: 'bar',
  },
  {
    files: 'path/to/file2',
    from: /bar/g,
    to: 'foo',
  }
]

await Promise.all(
  replacements.map(options => replaceInFile(options))
)
```

### Custom regular expressions

Use the [RegExp](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp) constructor to create any regular expression.

```js
const str = 'foo'
const regex = new RegExp('^' + str + 'bar', 'i')
const options = {
  from: regex,
  to: 'bar',
}
```

### Using callbacks for `from`
You can also specify a callback that returns a string or a regular expression. The callback receives the name of the file in which the replacement is being performed, thereby allowing the user to tailor the search string. The following example uses a callback to produce a search string dependent on the filename:

```js
const options = {
  files: 'path/to/file',
  from: (file) => new RegExp(file, 'g'),
  to: 'bar',
}
```

### Using callbacks for `to`
As the `to` parameter is passed to the native [String replace method](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace), you can also specify a callback. The following example uses a callback to convert matching strings to lowercase:

```js
const options = {
  files: 'path/to/file',
  from: /SomePattern[A-Za-z-]+/g,
  to: (match) => match.toLowerCase(),
}
```

This callback provides for an extra argument above the String replace method, which is the name of the file in which the replacement is being performed. The following example replaces the matched string with the filename:

```js
const options = {
  files: 'path/to/file',
  from: /SomePattern[A-Za-z-]+/g,
  to: (...args) => args.pop(),
}
```

### Saving to a different file
You can specify a `getTargetFile` config param to modify the target file for saving the new file contents to. For example:

```js
const options = {
  files: 'path/to/files/*.html',
  getTargetFile: source => `new/path/${source}`,
  from: 'foo',
  to: 'bar',
}
```

Note that the target directory is not created for you, so it must already exist.

### Ignore a single file or glob

```js
const options = {
  ignore: 'path/to/ignored/file',
}
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
}
```

Please note that there is an [open issue with Glob](https://github.com/isaacs/node-glob/issues/309) that causes ignored patterns to be ignored when using a `./` prefix in your files glob. To work around this, simply remove the prefix, e.g. use `**/*` instead of `./**/*`.

### Allow empty/invalid paths
If set to true, empty or invalid paths will fail silently and no error will be thrown. For asynchronous replacement only. Defaults to `false`.

```js
const options = {
  allowEmptyPaths: true,
}
```

### Disable globs
You can disable globs if needed using this flag. Use this when you run into issues with file paths like files like `//SERVER/share/file.txt`. Defaults to `false`.

```js
const options = {
  disableGlobs: true,
}
```

### Specify glob configuration
Specify configuration passed to the [glob](https://www.npmjs.com/package/glob) call:

```js
const options = {

  //Glob settings here (examples given below)
  glob: {

    //To include hidden files (starting with a dot)
    dot: true,

    //To fix paths on Windows OS when path.join() is used to create paths
    windowsPathsNoEscape: true,
  },
}
```

Please note that the setting `nodir` will always be passed as `false`.

### Making replacements on network drives
To make replacements in files on network drives, you may need to specify the UNC path as the `cwd` config option. This will then be passed to glob and prefixed to your paths accordingly. See [#56](https://github.com/adamreisnz/replace-in-file/issues/56) for more details.

### Specify character encoding
Use a different character encoding for reading/writing files. Defaults to `utf-8`.

```js
const options = {
  encoding: 'utf8',
}
```

### Dry run
To do a dry run without actually making replacements, for testing purposes. Defaults to `false`.

```js
const options = {
  dry: true,
}
```

### Replacing in large files (streaming)

By default, files are read into memory in full. This is fast and allows the whole contents to be matched at once, but for very large files it uses memory proportional to the file size, and files larger than the maximum string size supported by Node.js (about 500MB) cannot be processed at all.

For those cases you can enable streaming mode, which processes files through Node streams with a bounded amount of memory, regardless of file size:

```js
const options = {
  files: 'path/to/huge/file.log',
  from: /needle/g,
  to: 'replacement',
  streaming: true,
}
```

Streaming mode finds matches across chunk boundaries, so the result is normally identical to the in-memory replacement. There are however some inherent constraints to be aware of:

- Streaming is only available for asynchronous replacement, as Node streams are asynchronous by nature. Using `streaming` with `replaceInFileSync` throws an error.
- A stream cannot match text of unbounded length, so regular expression matches are only guaranteed to be found if the match (including any lookahead or lookbehind) fits within a window of `maxMatchLength` characters (default `1024`). Regex matches longer than this window may be missed. Plain string values for `from` are always matched exactly, regardless of length. If you expect longer matches, increase the window:

  ```js
  const options = {
    streaming: true,
    maxMatchLength: 10000,
  }
  ```

- When using a callback for `to`, the callback receives the match, any capture groups, the offset within the file and the file name — but not the full file contents argument, as it never exists in one piece. The file name is always the last argument, so the documented `(...args) => args.pop()` pattern keeps working.
- The `$\`` and `$'` replacement patterns refer to the buffered window rather than the whole file contents when streaming.
- Streaming cannot be combined with custom [processors](#using-custom-processors) or a [custom file system API](#using-a-custom-file-system-api), as both operate on full file contents.

Changed files are written atomically: replacements are streamed to a temporary file next to the target, which then replaces the target, preserving its file mode. The target file is therefore never left half-written, even if the process is interrupted mid-replacement.

### Using custom processors

For advanced usage where complex processing is needed it's possible to use a callback that will receive content as an argument and should return it processed.

```js
const results = await replaceInFile({
  files: 'path/to/files/*.html',
  processor: (input) => input.replace(/foo/g, 'bar'),
})
```
The custom processor will receive the path of the file being processed as a second parameter:

```js
const results = await replaceInFile({
  files: 'path/to/files/*.html',
  processor: (input, file) => input.replace(/foo/g, file),
})
```

This also supports passing an array of functions that will be executed sequentially

```js
function someProcessingA(input) {
  const chapters = input.split('###')
  chapters[1] = chapters[1].replace(/foo/g, 'bar')
  return chapters.join('###')
}

function someProcessingB(input) {
  return input.replace(/foo/g, 'bar')
}

const results = replaceInFileSync({
  files: 'path/to/files/*.html',
  processor: [someProcessingA, someProcessingB],
})
```

Alongside the `processor`, there is also `processorAsync` which is the equivalent for asynchronous processing. It should return a promise that resolves with the processed content:

```js
const results = await replaceInFile({
  files: 'path/to/files/*.html',
  processorAsync: async (input, file) => {
    const asyncResult = await doAsyncOperation(input, file);
    return input.replace(/foo/g, asyncResult)
  },
})
```

### Using a custom file system API
`replace-in-file` defaults to using `'node:fs/promises'` and `'node:fs'` to provide file reading and write APIs.
You can provide an `fs` or `fsSync` object of your own to switch to a different file system, such as a mock file system for unit tests.

* For the asynchronous APIs, the provided `fs` must provide the `readFile` and `writeFile` methods.
* For the synchronous APIs, the provided `fsSync` must provide the `readFileSync` and `writeFileSync` methods.

Custom `fs` and `fsSync` implementations should have the same parameters and returned values as their [built-in Node `fs`](https://nodejs.org/api/fs.html) equivalents.

```js
replaceInFile({
  files: 'path/to/file',
  from: 'a',
  fs: {
    readFile: async (file, encoding) => {
      console.log(`Reading ${file} with encoding ${encoding}...`)
      return 'fake file contents'
    },
    writeFile: async (file, newContents, encoding) => {
      console.log(`Writing ${file} with encoding ${encoding}: ${newContents}`)
    },
  },
  to: 'b',
})
```

Or for the sync API:

```js
replaceInFileSync({
  files: 'path/to/file',
  from: 'a',
  fsSync: {
    readFileSync: (file, encoding) => {
      console.log(`Reading ${file} with encoding ${encoding}...`)
      return 'fake file contents'
    },
    writeFileSync: (file, newContents, encoding) => {
      console.log(`Writing ${file} with encoding ${encoding}: ${newContents}`)
    },
  },
  to: 'b',
})
```

## CLI usage

```sh
replace-in-file from to some/file.js,some/**/glob.js
  [--configFile=config.json]
  [--ignore=ignore/files.js,ignore/**/glob.js]
  [--encoding=utf-8]
  [--disableGlobs]
  [--verbose]
  [--quiet]
  [--dry]
  [--streaming]
  [--maxMatchLength=1024]
```

Multiple files or globs can be replaced by providing a comma separated list.

The flags `--disableGlobs`, `--ignore` and `--encoding` are supported in the CLI.

There is no CLI flag for `allowEmptyPaths`, as this setting is only relevant for
asynchronous replacement and the CLI replaces synchronously unless `--streaming`
is used.

To list the changed files, use the `--verbose` flag. Success output can be suppressed by using the `--quiet` flag.

To do a dry run without making any actual changes, use `--dry`.

To process large files with bounded memory usage, use `--streaming`, optionally with `--maxMatchLength` (see [Replacing in large files](#replacing-in-large-files-streaming)).

A regular expression may be used for the `from` parameter by passing in a string correctly formatted as a regular expression. The library will automatically detect that it is a regular expression.

The `from` and `to` parameters, as well as the files list, can be omitted if you provide this
information in a configuration file.

You can provide a path to a configuration file
(JSON) with the `--configFile` flag. This path will be resolved using
Node’s built in `path.resolve()`, so you can pass in an absolute or relative path.

If you are using a configuration file, and you want to use a regular expression for the `from` value, ensure that it starts with a `/`, for example:

```json
{
  "from": "/cat/g",
  "to": "dog"
}
```

## A note on using globs with the CLI
When using the CLI, the glob pattern is handled by the operating system. But if you specify the glob pattern in the configuration file, the package will use the glob module from the Node modules, and this can lead to different behaviour despite using the same pattern.

For example, the following will only look at top level files:

```json
{
  "from": "cat",
  "to": "dog"
}
```

```sh
replace-in-file **  --configFile=config.json
```

However, this example is recursive:

```json
{
  "files": "**",
  "from": "cat",
  "to": "dog"
}
```

```sh
replace-in-file --configFile=config.json
```

If you want to do a recursive file search as an argument you must use:

```sh
replace-in-file $(ls l {,**/}*)  --configFile=config.json
```

## Version information
From version 9.0.0 onwards, this package requires Node 22.12.0 or higher, as older versions of Node have reached end of life. If you need support for older versions of Node, please use a previous version of this package. The package is written in TypeScript as of version 9.0.0, and type definitions are generated directly from the source code.

From version 8.0.0 onwards, this package requires Node 18 or higher.

As 8.0.0 was a significant rewrite, please [open an issue](https://github.com/adamreisnz/replace-in-file/issues) if you run into any problems or unexpected behaviour.

See the [Changelog](CHANGELOG.md) for more information.

## License
(MIT License)

Copyright 2015-2026, Adam Reis

See the [LICENSE](LICENSE) file for the full license text.
