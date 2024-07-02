import {expect, use, should} from 'chai'
import chaiAsPromised from 'chai-as-promised'
import {replaceInFile, replaceInFileSync} from './replace-in-file.js'
import fsAsync from 'node:fs/promises'
import fs from 'node:fs'

//Enable should assertion style for usage with chai-as-promised
should()
use(chaiAsPromised)

/**
 * Specs
 */
describe('Replace in file', () => {

  //Test JSON
  const testData = 'a re place c'
  const testData2 = `app.setVersion('\${sourceVersion}');`

  /**
   * Prepare test files
   */
  beforeEach(() => Promise.all([
    fsAsync.writeFile('test1', testData, 'utf8'),
    fsAsync.writeFile('test2', testData, 'utf8'),
    fsAsync.writeFile('test3', 'nope', 'utf8'),
    fsAsync.writeFile('test4', testData2, 'utf8'),
  ]))

  /**
   * Clean up test files
   */
  afterEach(() => Promise.all([
    fsAsync.unlink('test1'),
    fsAsync.unlink('test2'),
    fsAsync.unlink('test3'),
    fsAsync.unlink('test4'),
  ]))

  /**
   * Async
   */
  describe('Async', () => {

    it('should replace contents in a single file with regex', done => {
      replaceInFile({
        files: 'test1',
        from: /re\splace/g,
        to: 'b',
      }).then(() => {
        const test1 = fs.readFileSync('test1', 'utf8')
        const test2 = fs.readFileSync('test2', 'utf8')
        expect(test1).to.equal('a b c')
        expect(test2).to.equal(testData)
        done()
      })
    })

    it('should pass file as an arg to a "from" function', done => {
      replaceInFile({
        files: 'test1',
        from: (file) => {
          expect(file).to.equal('test1')
          return /re\splace/g
        },
        to: 'b',
      }).then(() => {
        const test1 = fs.readFileSync('test1', 'utf8')
        const test2 = fs.readFileSync('test2', 'utf8')
        expect(test1).to.equal('a b c')
        expect(test2).to.equal(testData)
        done()
      })
    })

    it(`should pass the match as first arg and file as last arg to a replacer function replace contents in a single file with regex`, done => {
      replaceInFile({
        files: 'test1',
        from: /re\splace/g,
        to: (match, ...args) => {
          const file = args.pop()
          expect(match).to.equal('re place')
          expect(file).to.equal('test1')
          return 'b'
        },
      }).then(() => {
        const test1 = fs.readFileSync('test1', 'utf8')
        const test2 = fs.readFileSync('test2', 'utf8')
        expect(test1).to.equal('a b c')
        expect(test2).to.equal(testData)
        done()
      })
    })

    it('should replace contents with a string replacement', done => {
      replaceInFile({
        files: 'test1',
        from: 're place',
        to: 'b',
      }).then(() => {
        const test1 = fs.readFileSync('test1', 'utf8')
        expect(test1).to.equal('a b c')
        done()
      })
    })

    it(`should store in the correct target file if getTargetFile is used`, done => {
      replaceInFile({
        files: 'test1',
        getTargetFile: () => 'test2',
        from: 're place',
        to: 'b',
      })
        .then(() => {
          const test1 = fs.readFileSync('test1', 'utf8')
          const test2 = fs.readFileSync('test2', 'utf8')
          expect(test1).to.equal('a re place c')
          expect(test2).to.equal('a b c')
          done()
        })
    })

    it(`should pass the match as first arg and file as last arg to a replacer function and replace contents with a string replacement`, done => {
      replaceInFile({
        files: 'test1',
        from: 're place',
        to: (match, ...args) => {
          const file = args.pop()
          expect(match).to.equal('re place')
          expect(file).to.equal('test1')
          return 'b'
        },
      }).then(() => {
        const test1 = fs.readFileSync('test1', 'utf8')
        expect(test1).to.equal('a b c')
        done()
      })
    })

    it('should replace contents in a an array of files', done => {
      replaceInFile({
        files: ['test1', 'test2'],
        from: /re\splace/g,
        to: 'b',
      }).then(() => {
        const test1 = fs.readFileSync('test1', 'utf8')
        const test2 = fs.readFileSync('test2', 'utf8')
        expect(test1).to.equal('a b c')
        expect(test2).to.equal('a b c')
        done()
      })
    })

    it('should expand globs', done => {
      replaceInFile({
        files: 'test*',
        from: /re\splace/g,
        to: 'b',
      }).then(() => {
        const test1 = fs.readFileSync('test1', 'utf8')
        const test2 = fs.readFileSync('test2', 'utf8')
        expect(test1).to.equal('a b c')
        expect(test2).to.equal('a b c')
        done()
      })
    })

    it('should expand globs while excluding ignored files', done => {
      replaceInFile({
        files: 'test*',
        ignore: 'test1',
        from: /re\splace/g,
        to: 'b',
      }).then(() => {
        const test1 = fs.readFileSync('test1', 'utf8')
        const test2 = fs.readFileSync('test2', 'utf8')
        expect(test1).to.equal('a re place c')
        expect(test2).to.equal('a b c')
        done()
      })
    })

    it('should replace substrings', done => {
      replaceInFile({
        files: 'test1',
        from: /(re)\s(place)/g,
        to: '$2 $1',
      }).then(() => {
        const test1 = fs.readFileSync('test1', 'utf8')
        expect(test1).to.equal('a place re c')
        done()
      })
    })

    it('should fulfill the promise on success', () => {
      return replaceInFile({
        files: 'test1',
        from: /re\splace/g,
        to: 'b',
      }).should.be.fulfilled
    })

    it('should reject the promise with an error on failure', () => {
      return expect(replaceInFile({
        files: 'nope',
        from: /re\splace/g,
        to: 'b',
      })).to.eventually.be.rejectedWith(Error)
    })

    it('should not reject the promise if allowEmptyPaths is true', () => {
      return replaceInFile({
        files: 'nope',
        allowEmptyPaths: true,
        from: /re\splace/g,
        to: 'b',
      }).should.be.fulfilled
    })

    it('should return a results array', done => {
      replaceInFile({
        files: 'test1',
        from: /re\splace/g,
        to: 'b',
      }).then(results => {
        expect(results).to.be.instanceof(Array)
        expect(results).to.have.length(1)
        expect(results[0].file).to.equal('test1')
        done()
      })
    })

    it('should mark if something was replaced', done => {
      replaceInFile({
        files: 'test1',
        from: /re\splace/g,
        to: 'b',
      }).then(results => {
        expect(results[0].hasChanged).to.equal(true)
        done()
      })
    })

    it('should not mark if nothing was replaced', done => {
      replaceInFile({
        files: 'test1',
        from: 'nope',
        to: 'b',
      }).then(results => {
        expect(results[0].hasChanged).to.equal(false)
        done()
      })
    })

    it('should return correct results for multiple files', done => {
      replaceInFile({
        files: ['test1', 'test2', 'test3'],
        from: /re\splace/g,
        to: 'b',
      }).then(results => {
        expect(results).to.have.length(3)
        expect(results[0].file).to.equal('test1')
        expect(results[0].hasChanged).to.equal(true)
        expect(results[1].file).to.equal('test2')
        expect(results[1].hasChanged).to.equal(true)
        expect(results[2].file).to.equal('test3')
        expect(results[2].hasChanged).to.equal(false)
        done()
      })
    })

    it('should make multiple replacements with the same string', done => {
      replaceInFile({
        files: ['test1', 'test2', 'test3'],
        from: [/re/g, /place/g],
        to: 'b',
      }).then(() => {
        const test1 = fs.readFileSync('test1', 'utf8')
        const test2 = fs.readFileSync('test2', 'utf8')
        expect(test1).to.equal('a b b c')
        expect(test2).to.equal('a b b c')
        done()
      })
    })

    it('should make multiple replacements with different strings', done => {
      replaceInFile({
        files: ['test1', 'test2', 'test3'],
        from: [/re/g, /place/g],
        to: ['b', 'e'],
      }).then(() => {
        const test1 = fs.readFileSync('test1', 'utf8')
        const test2 = fs.readFileSync('test2', 'utf8')
        expect(test1).to.equal('a b e c')
        expect(test2).to.equal('a b e c')
        done()
      })
    })

    it('should not replace with missing replacement values', done => {
      replaceInFile({
        files: ['test1', 'test2', 'test3'],
        from: [/re/g, /place/g],
        to: ['b'],
      }).then(() => {
        const test1 = fs.readFileSync('test1', 'utf8')
        const test2 = fs.readFileSync('test2', 'utf8')
        expect(test1).to.equal('a b place c')
        expect(test2).to.equal('a b place c')
        done()
      })
    })

    it('should not replace in a dry run', done => {
      replaceInFile({
        files: ['test1', 'test2'],
        from: /re\splace/g,
        to: 'b',
        dry: true,
      }).then(() => {
        const test1 = fs.readFileSync('test1', 'utf8')
        const test2 = fs.readFileSync('test2', 'utf8')
        expect(test1).to.equal('a re place c')
        expect(test2).to.equal('a re place c')
        done()
      })
    })

    it('should return changed files for a dry run', done => {
      replaceInFile({
        files: ['test1', 'test2', 'test3'],
        from: /re\splace/g,
        to: 'b',
        dry: true,
      }).then(results => {
        expect(results).to.have.length(3)
        expect(results[0].file).to.equal('test1')
        expect(results[0].hasChanged).to.equal(true)
        expect(results[1].file).to.equal('test2')
        expect(results[1].hasChanged).to.equal(true)
        expect(results[2].file).to.equal('test3')
        expect(results[2].hasChanged).to.equal(false)
        done()
      })
    })

    it('should accept glob configuration', done => {
      replaceInFile({
        files: 'test1',
        from: /re\splace/g,
        to: 'b',
        allowEmptyPaths: true,
        glob: {
          ignore: ['test1'],
        },
      }).then(() => {
        const test1 = fs.readFileSync('test1', 'utf8')
        expect(test1).to.equal('a re place c')
        done()
      })
    })

    it('should ignore empty glob configuration', done => {
      replaceInFile({
        files: 'test1',
        from: /re\splace/g,
        to: 'b',
        glob: null,
      }).then(() => {
        const test1 = fs.readFileSync('test1', 'utf8')
        expect(test1).to.equal('a b c')
        done()
      })
    })

    it('should count matches if specified in config', done => {
      replaceInFile({
        files: 'test1',
        from: [/re/g, /place/g],
        to: 'test',
        countMatches: true,
      }).then(results => {
        expect(results[0].numMatches).to.equal(2)
        done()
      })
    })

    it('should not count matches if not specified in config', done => {
      replaceInFile({
        files: 'test1',
        from: [/re/g, /place/g],
        to: 'test',
      }).then(results => {
        expect(results[0].numMatches).to.be.undefined
        done()
      })
    })

    it('should return 0 matches if match not found', done => {
      replaceInFile({
        files: 'test1',
        from: 'nope',
        to: 'test',
        countMatches: true,
      }).then(results => {
        expect(results[0].numMatches).to.equal(0)
        done()
      })
    })

    //Processors
    describe('processors', () => {
      it('uses custom processor', done => {
        replaceInFile({
          files: 'test1',
          processor: input => input.replace(/place/, 'plop'),
        })
          .then(() => {
            const test1 = fs.readFileSync('test1', 'utf8')
            expect(test1).to.equal('a re plop c')
            done()
          })
      })
      it('uses array of custom processors', done => {
        replaceInFile({
          files: 'test1',
          processor: [
            input => input.replace(/place/, 'plop'),
            input => input.replace(/plop/, 'bloop'),
          ],
        })
          .then(() => {
            const test1 = fs.readFileSync('test1', 'utf8')
            expect(test1).to.equal('a re bloop c')
            done()
          })
      })
    })

    describe('fs', () => {
      it('reads and writes using a custom fs when provided', done => {
        const before = 'a'
        let written

        const fs = {
          readFile: async () => {
            return before
          },
          writeFile: async (_fileName, data) => {
            written = data
          },
        }

        replaceInFile({
          files: 'test1',
          from: /a/,
          fs,
          to: 'z',
        }).then(() => {
          expect(written).to.equal('z')
          done()
        })
      })
    })
  })

  /**
   * Sync
   */
  describe('Sync', () => {

    it('should replace contents in a single file with regex', function() {
      replaceInFileSync({
        files: 'test1',
        from: /re\splace/g,
        to: 'b',
      })
      const test1 = fs.readFileSync('test1', 'utf8')
      const test2 = fs.readFileSync('test2', 'utf8')
      expect(test1).to.equal('a b c')
      expect(test2).to.equal(testData)
    })

    it('should pass file as an arg to a "from" function', function() {
      replaceInFileSync({
        files: 'test1',
        from: (file) => {
          expect(file).to.equal('test1')
          return /re\splace/g
        },
        to: 'b',
      })
      const test1 = fs.readFileSync('test1', 'utf8')
      const test2 = fs.readFileSync('test2', 'utf8')
      expect(test1).to.equal('a b c')
      expect(test2).to.equal(testData)
    })

    it(`should pass the match as first arg and file as last arg to a replacer function replace contents in a single file with regex`, function() {
      replaceInFileSync({
        files: 'test1',
        from: /re\splace/g,
        to: (match, ...args) => {
          const file = args.pop()
          expect(match).to.equal('re place')
          expect(file).to.equal('test1')
          return 'b'
        },
      })
      const test1 = fs.readFileSync('test1', 'utf8')
      const test2 = fs.readFileSync('test2', 'utf8')
      expect(test1).to.equal('a b c')
      expect(test2).to.equal(testData)
    })

    it('should replace contents with a string replacement', function() {
      replaceInFileSync({
        files: 'test1',
        from: 're place',
        to: 'b',
      })
      const test1 = fs.readFileSync('test1', 'utf8')
      expect(test1).to.equal('a b c')
    })

    it(`should store in the correct target file if getTargetFile is used`, () => {
      replaceInFileSync({
        files: 'test1',
        getTargetFile: () => 'test2',
        from: 're place',
        to: 'b',
      })
      const test1 = fs.readFileSync('test1', 'utf8')
      const test2 = fs.readFileSync('test2', 'utf8')
      expect(test1).to.equal('a re place c')
      expect(test2).to.equal('a b c')
    })

    it(`should pass the match as first arg and file as last arg to a replacer function and replace contents with a string replacement`, function() {
      replaceInFileSync({
        files: 'test1',
        from: 're place',
        to: (match, ...args) => {
          const file = args.pop()
          expect(match).to.equal('re place')
          expect(file).to.equal('test1')
          return 'b'
        },
      })
      const test1 = fs.readFileSync('test1', 'utf8')
      expect(test1).to.equal('a b c')
    })

    it('should replace contents in a an array of files', function() {
      replaceInFileSync({
        files: ['test1', 'test2'],
        from: /re\splace/g,
        to: 'b',
      })
      const test1 = fs.readFileSync('test1', 'utf8')
      const test2 = fs.readFileSync('test2', 'utf8')
      expect(test1).to.equal('a b c')
      expect(test2).to.equal('a b c')
    })

    it('should expand globs', function() {
      replaceInFileSync({
        files: 'test*',
        from: /re\splace/g,
        to: 'b',
      })
      const test1 = fs.readFileSync('test1', 'utf8')
      const test2 = fs.readFileSync('test2', 'utf8')
      expect(test1).to.equal('a b c')
      expect(test2).to.equal('a b c')
    })

    it('should return a results array', function() {
      const results = replaceInFileSync({
        files: 'test1',
        from: /re\splace/g,
        to: 'b',
      })
      expect(results).to.be.instanceof(Array)
      expect(results).to.have.length(1)
      expect(results[0].file).to.equal('test1')
    })

    it('should mark if something was replaced', function() {
      const results = replaceInFileSync({
        files: 'test1',
        from: /re\splace/g,
        to: 'b',
      })
      expect(results[0].hasChanged).to.equal(true)
    })

    it('should not mark if nothing was replaced', function() {
      const results = replaceInFileSync({
        files: 'test1',
        from: 'nope',
        to: 'b',
      })
      expect(results[0].hasChanged).to.equal(false)
    })

    it('should return correct results for multiple files', function() {
      const results = replaceInFileSync({
        files: ['test1', 'test2', 'test3'],
        from: /re\splace/g,
        to: 'b',
      })
      expect(results).to.have.length(3)
      expect(results[0].file).to.equal('test1')
      expect(results[0].hasChanged).to.equal(true)
      expect(results[1].file).to.equal('test2')
      expect(results[1].hasChanged).to.equal(true)
      expect(results[2].file).to.equal('test3')
      expect(results[2].hasChanged).to.equal(false)
    })

    it('should make multiple replacements with the same string', () => {
      replaceInFileSync({
        files: ['test1', 'test2', 'test3'],
        from: [/re/g, /place/g],
        to: 'b',
      })
      const test1 = fs.readFileSync('test1', 'utf8')
      const test2 = fs.readFileSync('test2', 'utf8')
      expect(test1).to.equal('a b b c')
      expect(test2).to.equal('a b b c')
    })

    it('should make multiple replacements with different strings', () => {
      replaceInFileSync({
        files: ['test1', 'test2', 'test3'],
        from: [/re/g, /place/g],
        to: ['b', 'e'],
      })
      const test1 = fs.readFileSync('test1', 'utf8')
      const test2 = fs.readFileSync('test2', 'utf8')
      expect(test1).to.equal('a b e c')
      expect(test2).to.equal('a b e c')
    })

    it('should not replace with missing replacement values', () => {
      replaceInFileSync({
        files: ['test1', 'test2', 'test3'],
        from: [/re/g, /place/g],
        to: ['b'],
      })
      const test1 = fs.readFileSync('test1', 'utf8')
      const test2 = fs.readFileSync('test2', 'utf8')
      expect(test1).to.equal('a b place c')
      expect(test2).to.equal('a b place c')
    })

    it('should expand globs while excluding ignored files', () => {
      replaceInFileSync({
        files: 'test*',
        ignore: 'test1',
        from: /re\splace/g,
        to: 'b',
      })
      const test1 = fs.readFileSync('test1', 'utf8')
      const test2 = fs.readFileSync('test2', 'utf8')
      expect(test1).to.equal('a re place c')
      expect(test2).to.equal('a b c')
    })

    it('should support an array of ignored files', () => {
      replaceInFileSync({
        files: 'test*',
        ignore: ['test1', 'test3'],
        from: /re\splace/g,
        to: 'b',
      })
      const test1 = fs.readFileSync('test1', 'utf8')
      const test2 = fs.readFileSync('test2', 'utf8')
      expect(test1).to.equal('a re place c')
      expect(test2).to.equal('a b c')
    })

    it('should work without expanding globs if disabled', () => {
      replaceInFileSync({
        files: ['test1', 'test2'],
        from: /re\splace/g,
        to: 'b',
        disableGlobs: true,
      })
      const test1 = fs.readFileSync('test1', 'utf8')
      const test2 = fs.readFileSync('test2', 'utf8')
      expect(test1).to.equal('a b c')
      expect(test2).to.equal('a b c')
    })

    it('should not replace in a dry run', () => {
      replaceInFileSync({
        files: ['test1', 'test2'],
        from: /re\splace/g,
        to: 'b',
        dry: true,
      })
      const test1 = fs.readFileSync('test1', 'utf8')
      const test2 = fs.readFileSync('test2', 'utf8')
      expect(test1).to.equal('a re place c')
      expect(test2).to.equal('a re place c')
    })

    it('should return changed files for a dry run', () => {
      const results = replaceInFileSync({
        files: ['test1', 'test2', 'test3'],
        from: /re\splace/g,
        to: 'b',
        dry: true,
      })
      expect(results).to.have.length(3)
      expect(results[0].file).to.equal('test1')
      expect(results[0].hasChanged).to.equal(true)
      expect(results[1].file).to.equal('test2')
      expect(results[1].hasChanged).to.equal(true)
      expect(results[2].file).to.equal('test3')
      expect(results[2].hasChanged).to.equal(false)
    })

    it('should count matches and replacements if specified in config', () => {
      const results = replaceInFileSync({
        files: 'test1',
        from: [/re/g, /place/g],
        to: 'test',
        countMatches: true,
      })
      expect(results[0].numMatches).to.equal(2)
      expect(results[0].numReplacements).to.equal(2)
    })

    it('should differentiate between matches and replacements', () => {
      const results = replaceInFileSync({
        files: 'test1',
        from: [/re/g, /place/g],
        to: 're',
        countMatches: true,
      })
      expect(results[0].numMatches).to.equal(2)
      expect(results[0].numReplacements).to.equal(1)
    })

    it('should count multiple replacements correctly', () => {
      const results = replaceInFileSync({
        files: 'test1',
        from: [/re/g, /place/g],
        to: 'place',
        countMatches: true,
      })
      expect(results[0].numMatches).to.equal(3)
      expect(results[0].numReplacements).to.equal(1)
    })

    it(`should not count matches or replacements if not specified in config`, () => {
      const results = replaceInFileSync({
        files: 'test1',
        from: [/re/g, /place/g],
        to: 'test',
      })
      expect(results[0].numMatches).to.be.undefined
      expect(results[0].numReplacements).to.be.undefined
    })

    it('should return 0 matches and replacements if match not found', () => {
      const results = replaceInFileSync({
        files: 'test1',
        from: 'nope',
        to: 'test',
        countMatches: true,
      })
      expect(results[0].numMatches).to.equal(0)
      expect(results[0].numReplacements).to.equal(0)
    })

    describe('fsSync', () => {
      it('reads and writes using a custom fsSync when provided', () => {
        const before = 'a'
        let written

        const fsSync = {
          readFileSync: () => {
            return before
          },
          writeFileSync: (_fileName, data) => {
            written = data
            return data
          },
        }

        const results = replaceInFileSync({
          files: 'test1',
          from: /a/,
          fsSync,
          to: 'z',
        })

        expect(results[0].file).to.equal('test1')
        expect(written).to.equal('z')
      })
    })

    //Processors
    describe('processors', () => {
      it('uses custom processor', () => {
        replaceInFileSync({
          files: 'test1',
          processor: input => input.replace(/place/, 'plop'),
        })
        const test1 = fs.readFileSync('test1', 'utf8')
        expect(test1).to.equal('a re plop c')
      })
      it('uses array of custom processors', () => {
        replaceInFileSync({
          files: 'test1',
          processor: [
            input => input.replace(/place/, 'plop'),
            input => input.replace(/plop/, 'bloop'),
          ],
        })
        const test1 = fs.readFileSync('test1', 'utf8')
        expect(test1).to.equal('a re bloop c')
      })
    })

    //#197
    describe('#197', () => {
      before(() => fs.writeFileSync('test197', 'ABC 123\n6666666\nDEF 456', 'utf8'))
      after(() => fs.unlinkSync('test197'))
      it('should replace contents when a regex string is passed', () => {
        replaceInFileSync({
          files: 'test197',
          from: '/\\w{3} \\d{3}/g',
          to: 'replaced',
        })
        const test197 = fs.readFileSync('test197', 'utf8')
        expect(test197).to.equal('replaced\n6666666\nreplaced')
      })
    })
  })

  describe('module export', () => {
    it(`exports named replaceInFile and replaceInFileSync from module`, () => {
      expect(replaceInFile).to.be.a('function')
      expect(replaceInFileSync).to.be.a('function')
    })
  })

  //https://github.com/adamreisnz/replace-in-file/issues/156
  describe('special characters', () => {
    it(`should replace contents with special characters and count matches correctly`, done => {
      const results = replaceInFileSync({
        files: 'test4',
        from: '${sourceVersion}',
        to: '1.0.0',
        countMatches: true,
      })
      const test4 = fs.readFileSync('test4', 'utf8')
      expect(test4).to.equal(`app.setVersion('1.0.0');`)
      expect(results).to.have.length(1)
      expect(results[0].file).to.equal('test4')
      expect(results[0].hasChanged).to.equal(true)
      expect(results[0].numMatches).to.equal(1)
      done()
    })
    it(`should replace contents with special characters and count matches correctly (2)`, done => {
      const results = replaceInFileSync({
        files: 'test4',
        from: `\${sourceVersion}')`,
        to: '1.0.0',
        countMatches: true,
      })
      const test4 = fs.readFileSync('test4', 'utf8')
      expect(test4).to.equal(`app.setVersion('1.0.0;`)
      expect(results).to.have.length(1)
      expect(results[0].file).to.equal('test4')
      expect(results[0].hasChanged).to.equal(true)
      expect(results[0].numMatches).to.equal(1)
      done()
    })
  })
})
