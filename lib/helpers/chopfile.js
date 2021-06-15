const fs = require('fs');

module.exports = {
  chopByFileSizeSync(filePath, encoding, chunkSize) {
    const file = fs.readFileSync(filePath, encoding);
    var chunks = Math.ceil(fs.statSync(filePath).size / chunkSize, chunkSize);
    var chunk = 0;
    const files = [];
    while (chunk <= chunks) {
      var offset = chunk * chunkSize;
      console.log('current chunk..', chunk);
      console.log('offset...', chunk * chunkSize);
      console.log('file blob from offset...', offset);
      files.push((file.slice(offset, offset + chunkSize)));
      chunk++;
    }
    return files.filter(v => v);
  },
  chopByFileSizeAsync(filePath, encoding, chunkSize) {
    return new Promise((resolve, reject) => {
      fs.readFile(filePath, encoding, (error, file) => {
        //istanbul ignore if
        if (error) {
          return reject(error);
        }
        var chunks = Math.ceil(fs.statSync(filePath).size / chunkSize, chunkSize);
        var chunk = 0;
        const files = [];
        while (chunk <= chunks) {
          var offset = chunk * chunkSize;
          console.log('current chunk..', chunk);
          console.log('offset...', chunk * chunkSize);
          console.log('file blob from offset...', offset);
          files.push((file.slice(offset, offset + chunkSize)));
          chunk++;
        }
        return resolve(files.filter(v => v));
      });
    });
  }
}
