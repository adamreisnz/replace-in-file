## 9.0.0
The package now requires Node 22.12.0 or higher, as Node 18 and Node 20 have reached end of life. If you need support for older versions of Node, please use version 8.x.x.

### Breaking changes
- Node 22.12.0 or higher is now required (dependencies `yargs@18` and `chalk@6` require it)
- Strings passed to `from` are now only converted to a regular expression if they both start and end with a slash (e.g. `"/cat/g"`), as documented. Previously, plain strings that merely ended in a slash and optional flag characters (e.g. `"assets/img"` or `"foo/"`) were silently converted to regular expressions as well.

### New features
- Added a `streaming` option for processing large files with bounded memory usage. Files are streamed through Node streams instead of being read into memory in full, with matches found across chunk boundaries. This also enables processing of files larger than the maximum string size supported by Node.js (about 500MB), which previously failed outright. Regex matches are guaranteed up to a configurable `maxMatchLength` window (default `1024` characters); plain string values are always matched exactly. Streaming is available for asynchronous replacement via the API (`streaming: true`) and in the CLI via `--streaming`. See the README for details and constraints.

### Other changes
- The codebase has been converted to TypeScript. Type definitions are now generated from the source code instead of being maintained by hand, fixing several inaccuracies in the previous type definitions:
  - The types incorrectly declared a default export and a `replaceInFile.replaceInFileSync` namespace API, both of which were removed from the runtime in 8.0.0
  - `processFile` and `processFileSync` were missing from the types
  - The `cwd`, `verbose`, `quiet`, `fs` and `fsSync` options were missing from the config type
- The package now ships compiled output from the `dist` folder, and an `exports` map has been added. Deep imports into package internals (e.g. `replace-in-file/src/...`) are no longer possible
- Upgraded all dependencies, including chalk to 6.x
- The repository now uses pnpm as its package manager

## 8.0.0
The package has been converted to an ES module and now requires Node 18 or higher. If you need support for Node 16 or below, please use version 7.x.x.

### Breaking changes
- Package has been converted to an ES module
- No longer providing a default export. Use the named exports `replaceInFile` or `replaceInFileSync` instead.
- The `replace.sync` syntax is no longer available. Use the named export `replaceInFileSync` instead.
- The callback API has been removed for asynchronous replacements. Please use promises or `async/await` instead.
- Configuration files provided to the CLI using the `--configFile` flag can now only be JSON.
- To use a custom `fs` implementation, you must now specify `fs` config parameter for the async API, and `fsSync` for the sync API. For the asynchronous APIs, the provided `fs` must provide the `readFile` and `writeFile` methods. For the synchronous APIs, the provided `fsSync` must provide the `readFileSync` and `writeFileSync` methods.
- If a `cwd` parameter is provided, it will no longer be prefixed to each path using basic string concatenation, but rather uses `path.join()` to ensure correct path concatenation.


### New features
- The `isRegex` flag is no longer required.
- You can now specify a `getTargetFile` config param to modify the target file for saving the new file contents to. For example:


```js
const options = {
  files: 'path/to/files/*.html',
  getTargetFile: source => `new/path/${source}`,
  from: 'foo',
  to: 'bar',
}
```

## 7.0.0
Strings provided to the `from` value are now escaped for regex matching when counting of matches is enabled. This is unlikely to result in any breaking changes, but as a precaution the major version has been bumped.

## 6.0.0
From version 6.0.0 onwards, replace in file requires Node 10 or higher. If you need support for Node 8, please use version 5.x.x.

## 5.0.0
From version 5.0.0 onwards, replace in file requires Node 8 or higher. If you need support for Node 6, please use version 4.x.x.

## 4.0.0

### Breaking changes
The return value is now a results array instead of an array with changed files. The new results array includes each file that was processed, with a flag to indicate whether or not the file was changed, and optionally information about the number of matches and replacements that were made. See the readme for more details.

To update existing code and obtain an array of changed files again, simply convert the results array as follows:

```js
const results = await replace(options);
const changedFiles = results
  .filter(result => result.hasChanged)
  .map(result => result.file);
```

### New features
- Added `countMatches` flag to count the number of matches and replacements per file [#38](https://github.com/adamreisnz/replace-in-file/issues/38), [#42](https://github.com/adamreisnz/replace-in-file/issues/42), [#61](https://github.com/adamreisnz/replace-in-file/issues/61)
- Added `--quiet` flag for CLI to suppress success output [#63](https://github.com/adamreisnz/replace-in-file/issues/63)
- Added `cwd` configuration parameter for network drive replacements [#56](https://github.com/adamreisnz/replace-in-file/issues/56)

## 3.0.0

### Breaking changes
From version 3.0.0 onwards, replace in file requires Node 6 or higher. If you need support for Node 4 or 5, please use version 2.x.x.
