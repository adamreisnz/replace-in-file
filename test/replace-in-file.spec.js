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
   * Async with promises
   */
  describe('Async with promises', () => {

    /**
     * Tests
     */
    it('should replace contents in a single file with regex', done => {
      replace({
        files: 'test1',
        replace: /re\splace/g,
        with: 'b',
      }).then(() => {
        const test1 = fs.readFileSync('test1', 'utf8');
        const test2 = fs.readFileSync('test2', 'utf8');
        expect(test1).to.equal('a b c');
        expect(test2).to.equal(testData);
        done();
      });
    });

    it('should replace contents with a string replacement', done => {
      replace({
        files: 'test1',
        replace: 're place',
        with: 'b',
      }).then(() => {
        const test1 = fs.readFileSync('test1', 'utf8');
        expect(test1).to.equal('a b c');
        done();
      });
    });

    it('should replace contents in a an array of files', done => {
      replace({
        files: ['test1', 'test2'],
        replace: /re\splace/g,
        with: 'b',
      }).then(() => {
        const test1 = fs.readFileSync('test1', 'utf8');
        const test2 = fs.readFileSync('test2', 'utf8');
        expect(test1).to.equal('a b c');
        expect(test2).to.equal('a b c');
        done();
      });
    });

    it('should expand globs', done => {
      replace({
        files: 'test*',
        replace: /re\splace/g,
        with: 'b',
      }).then(() => {
        const test1 = fs.readFileSync('test1', 'utf8');
        const test2 = fs.readFileSync('test2', 'utf8');
        expect(test1).to.equal('a b c');
        expect(test2).to.equal('a b c');
        done();
      });
    });

    it('should fulfill the promise on success', () => {
      return replace({
        files: 'test1',
        replace: /re\splace/g,
        with: 'b',
      }).should.be.fulfilled;
    });

    it('should reject the promise with an error on failure', () => {
      return expect(replace({
        files: 'nope',
        replace: /re\splace/g,
        with: 'b',
      })).to.eventually.be.rejectedWith(Error);
    });

    it('should not reject the promise if allowEmptyPaths is true', () => {
      return replace({
        files: 'nope',
        allowEmptyPaths: true,
        replace: /re\splace/g,
        with: 'b',
      }).should.be.fulfilled;
    });

    it('should return a changed files array', done => {
      replace({
        files: 'test1',
        replace: /re\splace/g,
        with: 'b',
      }).then(changedFiles => {
        expect(changedFiles).to.be.instanceof(Array);
        done();
      });
    });

    it('should return in files if something was replaced', done => {
      replace({
        files: 'test1',
        replace: /re\splace/g,
        with: 'b',
      }).then(changedFiles => {
        expect(changedFiles).to.have.length(1);
        expect(changedFiles[0]).to.equal('test1');
        done();
      });
    });

    it('should not return in files if nothing replaced', done => {
      replace({
        files: 'test1',
        replace: 'nope',
        with: 'b',
      }).then(changedFiles => {
        expect(changedFiles).to.have.length(0);
        done();
      });
    });

    it('should return changed files for multiple files', done => {
      replace({
        files: ['test1', 'test2', 'test3'],
        replace: /re\splace/g,
        with: 'b',
      }).then(changedFiles => {
        expect(changedFiles).to.have.length(2);
        expect(changedFiles).to.contain('test1');
        expect(changedFiles).to.contain('test2');
        done();
      });
    });

    it('should make multiple replacements with the same string', done => {
      replace({
        files: ['test1', 'test2', 'test3'],
        replace: [/re/g, /place/g],
        with: 'b',
      }).then(() => {
        const test1 = fs.readFileSync('test1', 'utf8');
        const test2 = fs.readFileSync('test2', 'utf8');
        expect(test1).to.equal('a b b c');
        expect(test2).to.equal('a b b c');
        done();
      });
    });

    it('should make multiple replacements with different strings', done => {
      replace({
        files: ['test1', 'test2', 'test3'],
        replace: [/re/g, /place/g],
        with: ['b', 'e'],
      }).then(() => {
        const test1 = fs.readFileSync('test1', 'utf8');
        const test2 = fs.readFileSync('test2', 'utf8');
        expect(test1).to.equal('a b e c');
        expect(test2).to.equal('a b e c');
        done();
      });
    });

    it('should not replace with missing replacement values', done => {
      replace({
        files: ['test1', 'test2', 'test3'],
        replace: [/re/g, /place/g],
        with: ['b'],
      }).then(() => {
        const test1 = fs.readFileSync('test1', 'utf8');
        const test2 = fs.readFileSync('test2', 'utf8');
        expect(test1).to.equal('a b place c');
        expect(test2).to.equal('a b place c');
        done();
      });
    });
  });

  /**
   * Async with callback
   */
  describe('Async with callback', () => {

    /**
     * Tests
     */
    it('should replace contents in a single file with regex', done => {
      replace({
        files: 'test1',
        replace: /re\splace/g,
        with: 'b',
      }, () => {
        const test1 = fs.readFileSync('test1', 'utf8');
        const test2 = fs.readFileSync('test2', 'utf8');
        expect(test1).to.equal('a b c');
        expect(test2).to.equal(testData);
        done();
      });
    });

    it('should replace contents with a string replacement', done => {
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

    it('should replace contents in a an array of files', done => {
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

    it('should expand globs', done => {
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

    it('should not return an error on success', done => {
      replace({
        files: 'test1',
        replace: /re\splace/g,
        with: 'b',
      }, (error) => {
        expect(error).to.equal(null);
        done();
      });
    });

    it('should return an error on failure', done => {
      replace({
        files: 'nope',
        replace: /re\splace/g,
        with: 'b',
      }, (error) => {
        expect(error).not.to.equal(null);
        done();
      });
    });

    it('should not return an error if allowEmptyPaths is true', done => {
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

    it('should return a changed files array', done => {
      replace({
        files: 'test1',
        replace: /re\splace/g,
        with: 'b',
      }, (error, changedFiles) => {
        expect(changedFiles).to.be.instanceof(Array);
        done();
      });
    });

    it('should return in files if something was replaced', done => {
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

    it('should not return in files if nothing replaced', done => {
      replace({
        files: 'test1',
        replace: 'nope',
        with: 'b',
      }, (error, changedFiles) => {
        expect(changedFiles).to.have.length(0);
        done();
      });
    });

    it('should return changed files for multiple files', done => {
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

    it('should make multiple replacements with the same string', done => {
      replace({
        files: ['test1', 'test2', 'test3'],
        replace: [/re/g, /place/g],
        with: 'b',
      }, () => {
        const test1 = fs.readFileSync('test1', 'utf8');
        const test2 = fs.readFileSync('test2', 'utf8');
        expect(test1).to.equal('a b b c');
        expect(test2).to.equal('a b b c');
        done();
      });
    });

    it('should make multiple replacements with different strings', done => {
      replace({
        files: ['test1', 'test2', 'test3'],
        replace: [/re/g, /place/g],
        with: ['b', 'e'],
      }, () => {
        const test1 = fs.readFileSync('test1', 'utf8');
        const test2 = fs.readFileSync('test2', 'utf8');
        expect(test1).to.equal('a b e c');
        expect(test2).to.equal('a b e c');
        done();
      });
    });

    it('should not replace with missing replacement values', done => {
      replace({
        files: ['test1', 'test2', 'test3'],
        replace: [/re/g, /place/g],
        with: ['b'],
      }, () => {
        const test1 = fs.readFileSync('test1', 'utf8');
        const test2 = fs.readFileSync('test2', 'utf8');
        expect(test1).to.equal('a b place c');
        expect(test2).to.equal('a b place c');
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
      replace.sync({
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
      replace.sync({
        files: 'test1',
        replace: 're place',
        with: 'b',
      });
      let test1 = fs.readFileSync('test1', 'utf8');
      expect(test1).to.equal('a b c');
    });

    it('should replace contents in a an array of files', function() {
      replace.sync({
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
      replace.sync({
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
      let changedFiles = replace.sync({
        files: 'test1',
        replace: /re\splace/g,
        with: 'b',
      });
      expect(changedFiles).to.be.instanceof(Array);
    });

    it('should return in changed files if something was replaced', function() {
      let changedFiles = replace.sync({
        files: 'test1',
        replace: /re\splace/g,
        with: 'b',
      });
      expect(changedFiles).to.have.length(1);
      expect(changedFiles[0]).to.equal('test1');
    });

    it('should not return in changed files if nothing replaced', function() {
      let changedFiles = replace.sync({
        files: 'test1',
        replace: 'nope',
        with: 'b',
      });
      expect(changedFiles).to.have.length(0);
    });

    it('should return changed files for multiple files', function() {
      let changedFiles = replace.sync({
        files: ['test1', 'test2', 'test3'],
        replace: /re\splace/g,
        with: 'b',
      });
      expect(changedFiles).to.have.length(2);
      expect(changedFiles).to.contain('test1');
      expect(changedFiles).to.contain('test2');
    });

    it('should make multiple replacements with the same string', () => {
      replace.sync({
        files: ['test1', 'test2', 'test3'],
        replace: [/re/g, /place/g],
        with: 'b',
      });
      const test1 = fs.readFileSync('test1', 'utf8');
      const test2 = fs.readFileSync('test2', 'utf8');
      expect(test1).to.equal('a b b c');
      expect(test2).to.equal('a b b c');
    });

    it('should make multiple replacements with different strings', () => {
      replace.sync({
        files: ['test1', 'test2', 'test3'],
        replace: [/re/g, /place/g],
        with: ['b', 'e'],
      });
      const test1 = fs.readFileSync('test1', 'utf8');
      const test2 = fs.readFileSync('test2', 'utf8');
      expect(test1).to.equal('a b e c');
      expect(test2).to.equal('a b e c');
    });

    it('should not replace with missing replacement values', () => {
      replace.sync({
        files: ['test1', 'test2', 'test3'],
        replace: [/re/g, /place/g],
        with: ['b'],
      });
      const test1 = fs.readFileSync('test1', 'utf8');
      const test2 = fs.readFileSync('test2', 'utf8');
      expect(test1).to.equal('a b place c');
      expect(test2).to.equal('a b place c');
    });
  });
});
