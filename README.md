# Replace in file
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

  //Replacement to make
  replace: /Find\sme/g,
  with: 'Replacement'
}, cb);
```

## License
(MIT License)

Copyright 2015, [Adam Buczynski](http://adambuczynski.com)
