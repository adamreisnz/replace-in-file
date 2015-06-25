# Replace in file
A simple utility to quickly replace text in one or more files.

## Installation
```shell
npm install replace-in-file
```

## Usage
```js
//Require module
var replace = require('replace-in-file');

//Replace contents in a single file
replace('path/to/file', /Find\sme/g, 'Replacement', cb);

//Replace contents in a several files
replace([
  'path/to/file',
  'path/to/other/file',
], /Find\sme/g, 'Replacement', cb);
```

## License
(MIT License)

Copyright 2015, [Adam Buczynski](http://adambuczynski.com)
