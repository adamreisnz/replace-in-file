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
    test: 'a re place c'
  };

  /**
   * Prepare test files
   */
  beforeEach(function(done) {
    Promise.all([
      jf.writeFileSync('test1.json', testJson),
      jf.writeFileSync('test2.json', testJson)
    ]).then(done);
  });

  /**
   * Clean up test files
   */
  afterEach(function(done) {
    Promise.all([
      fs.unlink('test1.json'),
      fs.unlink('test2.json')
    ]).then(done);
  });

  /**
   * Replace in one file
   */
  it('should replace contents in a single file', function(done) {
    replace({
      files: 'test1.json',
      replace: /re\splace/g,
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
      replace: /re\splace/g,
      with: 'b'
    }, function(error) {
      var test1 = jf.readFileSync('test1.json');
      var test2 = jf.readFileSync('test2.json');
      expect(test1.test).toBe('a b c');
      expect(test2.test).toBe('a b c');
      done();
    });
  });

  /**
   * Replace in one file
   */
  it('should replace contents with a string replacement', function(done) {
    replace({
      files: 'test1.json',
      replace: 're place',
      with: 'b'
    }, function(error) {
      var test1 = jf.readFileSync('test1.json');
      expect(test1.test).toBe('a b c');
      done();
    });
  });
});
