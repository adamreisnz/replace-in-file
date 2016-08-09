'use strict';

/**
 * Dependencies
 */
let replace = require('../lib/replace-in-file');
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
    writeFile('test2', testData, 'utf8'),
    writeFile('test3', 'nope', 'utf8'),
  ]));

  /**
   * Clean up test files
   */
  afterEach(() => Promise.all([
    deleteFile('test1'),
    deleteFile('test2'),
    deleteFile('test3'),
  ]));

  /**
   * Async
   */
  describe('Async', () => {

    /**
     * Tests
     */
    it('should replace contents in a single file with regex', function(done) {
      replace({
        files: 'test1',
        replace: /re\splace/g,
        with: 'b',
      }, () => {
        let test1 = fs.readFileSync('test1', 'utf8');
        let test2 = fs.readFileSync('test2', 'utf8');
        expect(test1).to.equal('a b c');
        expect(test2).to.equal(testData);
        done();
      });
    });

    it('should replace contents with a string replacement', function(done) {
      replace({
        files: 'test1',
        replace: 're place',
        with: 'b',
      }, () => {
        let test1 = fs.readFileSync('test1', 'utf8');
        expect(test1).to.equal('a b c');
        done();
      });
    });

    it('should replace contents in a an array of files', function(done) {
      replace({
        files: ['test1', 'test2'],
        replace: /re\splace/g,
        with: 'b',
      }, () => {
        let test1 = fs.readFileSync('test1', 'utf8');
        let test2 = fs.readFileSync('test2', 'utf8');
        expect(test1).to.equal('a b c');
        expect(test2).to.equal('a b c');
        done();
      });
    });

    it('should expand globs', function(done) {
      replace({
        files: 'test*',
        replace: /re\splace/g,
        with: 'b',
      }, () => {
        let test1 = fs.readFileSync('test1', 'utf8');
        let test2 = fs.readFileSync('test2', 'utf8');
        expect(test1).to.equal('a b c');
        expect(test2).to.equal('a b c');
        done();
      });
    });

    it('should not return an error on success', function(done) {
      replace({
        files: 'test1',
        replace: /re\splace/g,
        with: 'b',
      }, (error) => {
        expect(error).to.equal(null);
        done();
      });
    });

    it('should return an error on failure', function(done) {
      replace({
        files: 'nope',
        replace: /re\splace/g,
        with: 'b',
      }, (error) => {
        expect(error).not.to.equal(null);
        done();
      });
    });

    it('should not return an error if allowEmptyPaths is true', function(done) {
      replace({
        files: 'nope',
        allowEmptyPaths: true,
        replace: /re\splace/g,
        with: 'b',
      }, (error) => {
        expect(error).to.equal(null);
        done();
      });
    });

    it('should return a changed files array', function(done) {
      replace({
        files: 'test1',
        replace: /re\splace/g,
        with: 'b',
      }, (error, changedFiles) => {
        expect(changedFiles).to.be.instanceof(Array);
        done();
      });
    });

    it('should return in files if something was replaced', function(done) {
      replace({
        files: 'test1',
        replace: /re\splace/g,
        with: 'b',
      }, (error, changedFiles) => {
        expect(changedFiles).to.have.length(1);
        expect(changedFiles[0]).to.equal('test1');
        done();
      });
    });

    it('should not return in files if nothing replaced', function(done) {
      replace({
        files: 'test1',
        replace: 'nope',
        with: 'b',
      }, (error, changedFiles) => {
        expect(changedFiles).to.have.length(0);
        done();
      });
    });

    it('should return changed files for multiple files', function(done) {
      replace({
        files: ['test1', 'test2', 'test3'],
        replace: /re\splace/g,
        with: 'b',
      }, (error, changedFiles) => {
        expect(changedFiles).to.have.length(2);
        expect(changedFiles).to.contain('test1');
        expect(changedFiles).to.contain('test2');
        done();
      });
    });
  });

  /**
   * Sync
   */
  describe('Sync', () => {

    /**
     * Tests
     */
    it('should replace contents in a single file with regex', function() {
      replace({
        files: 'test1',
        replace: /re\splace/g,
        with: 'b',
      });
      let test1 = fs.readFileSync('test1', 'utf8');
      let test2 = fs.readFileSync('test2', 'utf8');
      expect(test1).to.equal('a b c');
      expect(test2).to.equal(testData);
    });

    it('should replace contents with a string replacement', function() {
      replace({
        files: 'test1',
        replace: 're place',
        with: 'b',
      });
      let test1 = fs.readFileSync('test1', 'utf8');
      expect(test1).to.equal('a b c');
    });

    it('should replace contents in a an array of files', function() {
      replace({
        files: ['test1', 'test2'],
        replace: /re\splace/g,
        with: 'b',
      });
      let test1 = fs.readFileSync('test1', 'utf8');
      let test2 = fs.readFileSync('test2', 'utf8');
      expect(test1).to.equal('a b c');
      expect(test2).to.equal('a b c');
    });

    it('should expand globs', function() {
      replace({
        files: 'test*',
        replace: /re\splace/g,
        with: 'b',
      });
      let test1 = fs.readFileSync('test1', 'utf8');
      let test2 = fs.readFileSync('test2', 'utf8');
      expect(test1).to.equal('a b c');
      expect(test2).to.equal('a b c');
    });

    it('should return a changed files array', function() {
      let changedFiles = replace({
        files: 'test1',
        replace: /re\splace/g,
        with: 'b',
      });
      expect(changedFiles).to.be.instanceof(Array);
    });

    it('should return in changed files if something was replaced', function() {
      let changedFiles = replace({
        files: 'test1',
        replace: /re\splace/g,
        with: 'b',
      });
      expect(changedFiles).to.have.length(1);
      expect(changedFiles[0]).to.equal('test1');
    });

    it('should not return in changed files if nothing replaced', function() {
      let changedFiles = replace({
        files: 'test1',
        replace: 'nope',
        with: 'b',
      });
      expect(changedFiles).to.have.length(0);
    });

    it('should return changed files for multiple files', function() {
      let changedFiles = replace({
        files: ['test1', 'test2', 'test3'],
        replace: /re\splace/g,
        with: 'b',
      });
      expect(changedFiles).to.have.length(2);
      expect(changedFiles).to.contain('test1');
      expect(changedFiles).to.contain('test2');
    });
  });
});
