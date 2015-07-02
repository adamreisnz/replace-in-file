'use strict';

/**
 * Specifications
 */
describe('Replace in file', function() {

  //Get modules
  var replace = require('../lib/replaceInFile');
  var jf = require('jsonfile');
  var fs = require('fs');

  //Test JSON
  var testJson = {
    test: "a re place c"
  };
  var testRegex = /re\splace/g;

  /**
   * Prepare test files
   */
  beforeEach(function() {
    jf.writeFileSync('test1.json', testJson);
    jf.writeFileSync('test2.json', testJson);
  });

  /**
   * Clean up test files
   */
  afterEach(function() {
    fs.unlinkSync('test1.json');
    fs.unlinkSync('test2.json');
  });

  /**
   * Replace in one file
   */
  it('should replace contents in a single file', function(done) {
    replace({
      files: 'test1.json',
      replace: testRegex,
      with: 'b'
    }, function(error) {
      var test1 = jf.readFileSync('test1.json');
      expect(test1.test).toBe('a b c');
      done();
    });
  });

  /**
   * Replace in multiple file
   */
  it('should replace contents in a an array of files', function(done) {
    replace({
      files: ['test1.json', 'test2.json'],
      replace: testRegex,
      with: 'b'
    }, function(error) {
      var test1 = jf.readFileSync('test1.json');
      var test2 = jf.readFileSync('test2.json');
      expect(test1.test).toBe('a b c');
      expect(test2.test).toBe('a b c');
      done();
    });
  });
});
