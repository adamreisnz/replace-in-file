'use strict';

/**
 * Dependencies
 */
let replace = require('../lib/replaceInFile');
let fs = require('fs');
let writeFile = Promise.promisify(fs.writeFile);
let deleteFile = Promise.promisify(fs.unlink);

/**
 * Specifications
 */
describe('Replace in file', () => {

  //Test JSON
  let testData = 'a re place c';

  /**
   * Prepare test files
   */
  beforeEach(() => Promise.all([
    writeFile('test1', testData, 'utf8'),
    writeFile('test2', testData, 'utf8')
  ]));

  /**
   * Clean up test files
   */
  afterEach(() => Promise.all([
    deleteFile('test1'),
    deleteFile('test2')
  ]));

  /**
   * Replace in one file
   */
  it('should replace contents in a single file', function(done) {
    replace({
      files: 'test1',
      replace: /re\splace/g,
      with: 'b'
    }, () => {
      let test1 = fs.readFileSync('test1', 'utf8');
      let test2 = fs.readFileSync('test2', 'utf8');
      expect(test1).to.equal('a b c');
      expect(test2).to.equal(testData);
      done();
    });
  });

  /**
   * Replace in multiple file
   */
  it('should replace contents in a an array of files', function(done) {
    replace({
      files: ['test1', 'test2'],
      replace: /re\splace/g,
      with: 'b'
    }, () => {
      let test1 = fs.readFileSync('test1', 'utf8');
      let test2 = fs.readFileSync('test2', 'utf8');
      expect(test1).to.equal('a b c');
      expect(test2).to.equal('a b c');
      done();
    });
  });

  /**
   * Replace in one file
   */
  it('should replace contents with a string replacement', function(done) {
    replace({
      files: 'test1',
      replace: 're place',
      with: 'b'
    }, () => {
      let test1 = fs.readFileSync('test1', 'utf8');
      expect(test1).to.equal('a b c');
      done();
    });
  });
});
