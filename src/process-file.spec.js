import {expect, use, should} from 'chai'
import chaiAsPromised from 'chai-as-promised'
import {processFile, processFileSync} from './process-file.js'
import fsAsync from 'node:fs/promises'
import fs from 'node:fs'

//Enable should assertion style for usage with chai-as-promised
should()
use(chaiAsPromised)

/**
 * Specifications
 */
describe('Process a file', () => {

  //Test JSON
  const testData = 'a re place c'

  /**
   * Prepare test files
   */
  beforeEach(() => Promise.all([
    fsAsync.writeFile('test1', testData, 'utf8'),
    fsAsync.writeFile('test2', testData, 'utf8'),
    fsAsync.writeFile('test3', 'nope', 'utf8'),
  ]))

  /**
   * Clean up test files
   */
  afterEach(() => Promise.all([
    fsAsync.unlink('test1'),
    fsAsync.unlink('test2'),
    fsAsync.unlink('test3'),
  ]))

  function fromToToProcessor(config) {
    const from = config.from
    const to = config.to
    delete config.from
    delete config.to
    config.processor = (content) => {
      return content.replace(from, to)
    }
    return config
  }

  function appendFileProcessor(config) {
    config.processor = (content, file) => {
      return `${content}${file}`
    }
    return config
  }

  /**
   * Async
   */
  describe('Async', () => {

    it('should run processor', done => {
      processFile({
        files: 'test1',
        processor: (input) => {
          return input.replace(/re\splace/g, 'b')
        },
      }).then(() => {
        const test1 = fs.readFileSync('test1', 'utf8')
        const test2 = fs.readFileSync('test2', 'utf8')
        expect(test1).to.equal('a b c')
        expect(test2).to.equal(testData)
        done()
      })
    })

    it('should replace contents in a single file with regex', done => {
      processFile(fromToToProcessor({
        files: 'test1',
        from: /re\splace/g,
        to: 'b',
      })).then(() => {
        const test1 = fs.readFileSync('test1', 'utf8')
        const test2 = fs.readFileSync('test2', 'utf8')
        expect(test1).to.equal('a b c')
        expect(test2).to.equal(testData)
        done()
      })
    })

    it('should replace contents with a string replacement', done => {
      processFile(fromToToProcessor({
        files: 'test1',
        from: 're place',
        to: 'b',
      })).then(() => {
        const test1 = fs.readFileSync('test1', 'utf8')
        expect(test1).to.equal('a b c')
        done()
      })
    })

    it('should replace contents in a an array of files', done => {
      processFile(fromToToProcessor({
        files: ['test1', 'test2'],
        from: /re\splace/g,
        to: 'b',
      })).then(() => {
        const test1 = fs.readFileSync('test1', 'utf8')
        const test2 = fs.readFileSync('test2', 'utf8')
        expect(test1).to.equal('a b c')
        expect(test2).to.equal('a b c')
        done()
      })
    })

    it('should expand globs', done => {
      processFile(fromToToProcessor({
        files: 'test*',
        from: /re\splace/g,
        to: 'b',
      })).then(() => {
        const test1 = fs.readFileSync('test1', 'utf8')
        const test2 = fs.readFileSync('test2', 'utf8')
        expect(test1).to.equal('a b c')
        expect(test2).to.equal('a b c')
        done()
      })
    })

    it('should expand globs while excluding ignored files', done => {
      processFile(fromToToProcessor({
        files: 'test*',
        ignore: 'test1',
        from: /re\splace/g,
        to: 'b',
      })).then(() => {
        const test1 = fs.readFileSync('test1', 'utf8')
        const test2 = fs.readFileSync('test2', 'utf8')
        expect(test1).to.equal('a re place c')
        expect(test2).to.equal('a b c')
        done()
      })
    })

    it('should replace substrings', done => {
      processFile(fromToToProcessor({
        files: 'test1',
        from: /(re)\s(place)/g,
        to: '$2 $1',
      })).then(() => {
        const test1 = fs.readFileSync('test1', 'utf8')
        expect(test1).to.equal('a place re c')
        done()
      })
    })

    it('should fulfill the promise on success', () => {
      return processFile(fromToToProcessor({
        files: 'test1',
        from: /re\splace/g,
        to: 'b',
      })).should.be.fulfilled
    })

    it('should reject the promise with an error on failure', () => {
      return expect(processFile(fromToToProcessor({
        files: 'nope',
        from: /re\splace/g,
        to: 'b',
      }))).to.eventually.be.rejectedWith(Error)
    })

    it('should not reject the promise if allowEmptyPaths is true', () => {
      return processFile(fromToToProcessor({
        files: 'nope',
        allowEmptyPaths: true,
        from: /re\splace/g,
        to: 'b',
      })).should.be.fulfilled
    })

    it('should return a results array', done => {
      processFile(fromToToProcessor({
        files: 'test1',
        from: /re\splace/g,
        to: 'b',
      })).then(results => {
        expect(results).to.be.instanceof(Array)
        expect(results).to.have.length(1)
        expect(results[0].file).to.equal('test1')
        done()
      })
    })

    it('should mark if something was replaced', done => {
      processFile(fromToToProcessor({
        files: 'test1',
        from: /re\splace/g,
        to: 'b',
      })).then(results => {
        expect(results[0].hasChanged).to.equal(true)
        done()
      })
    })

    it('should not mark if nothing was replaced', done => {
      processFile(fromToToProcessor({
        files: 'test1',
        from: 'nope',
        to: 'b',
      })).then(results => {
        expect(results[0].hasChanged).to.equal(false)
        done()
      })
    })

    it('should return correct results for multiple files', done => {
      processFile(fromToToProcessor({
        files: ['test1', 'test2', 'test3'],
        from: /re\splace/g,
        to: 'b',
      })).then(results => {
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

    it('should not replace in a dry run', done => {
      processFile(fromToToProcessor({
        files: ['test1', 'test2'],
        from: /re\splace/g,
        to: 'b',
        dry: true,
      })).then(() => {
        const test1 = fs.readFileSync('test1', 'utf8')
        const test2 = fs.readFileSync('test2', 'utf8')
        expect(test1).to.equal('a re place c')
        expect(test2).to.equal('a re place c')
        done()
      })
    })

    it('should return changed files for a dry run', done => {
      processFile(fromToToProcessor({
        files: ['test1', 'test2', 'test3'],
        from: /re\splace/g,
        to: 'b',
        dry: true,
      })).then(results => {
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
      processFile(fromToToProcessor({
        files: 'test1',
        from: /re\splace/g,
        to: 'b',
        allowEmptyPaths: true,
        glob: {
          ignore: ['test1'],
        },
      })).then(() => {
        const test1 = fs.readFileSync('test1', 'utf8')
        expect(test1).to.equal('a re place c')
        done()
      })
    })

    it('should ignore empty glob configuration', done => {
      processFile(fromToToProcessor({
        files: 'test1',
        from: /re\splace/g,
        to: 'b',
        glob: null,
      })).then(() => {
        const test1 = fs.readFileSync('test1', 'utf8')
        expect(test1).to.equal('a b c')
        done()
      })
    })

    describe('fs', () => {
      it('reads and writes using a custom fs when provided', done => {
        const before = 'abc'
        let written

        const fs = {
          readFile: async () => {
            return before
          },
          writeFile: async (_fileName, data) => {
            written = data
          },
        }

        processFile({
          files: 'test1',
          fs,
          processor: (input) => {
            return input.replace(/b/, 'z')
          },
        }).then(() => {
          expect(written).to.equal('azc')
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
      processFileSync(fromToToProcessor({
        files: 'test1',
        from: /re\splace/g,
        to: 'b',
      }))
      const test1 = fs.readFileSync('test1', 'utf8')
      const test2 = fs.readFileSync('test2', 'utf8')
      expect(test1).to.equal('a b c')
      expect(test2).to.equal(testData)
    })

    it('should replace contents with a string replacement', function() {
      processFileSync(fromToToProcessor({
        files: 'test1',
        from: 're place',
        to: 'b',
      }))
      const test1 = fs.readFileSync('test1', 'utf8')
      expect(test1).to.equal('a b c')
    })

    it('should replace contents in a an array of files', function() {
      processFileSync(fromToToProcessor({
        files: ['test1', 'test2'],
        from: /re\splace/g,
        to: 'b',
      }))
      const test1 = fs.readFileSync('test1', 'utf8')
      const test2 = fs.readFileSync('test2', 'utf8')
      expect(test1).to.equal('a b c')
      expect(test2).to.equal('a b c')
    })

    it('should expand globs', function() {
      processFileSync(fromToToProcessor({
        files: 'test*',
        from: /re\splace/g,
        to: 'b',
      }))
      const test1 = fs.readFileSync('test1', 'utf8')
      const test2 = fs.readFileSync('test2', 'utf8')
      expect(test1).to.equal('a b c')
      expect(test2).to.equal('a b c')
    })

    it('should return a results array', function() {
      const results = processFileSync(fromToToProcessor({
        files: 'test1',
        from: /re\splace/g,
        to: 'b',
      }))
      expect(results).to.be.instanceof(Array)
      expect(results).to.have.length(1)
      expect(results[0].file).to.equal('test1')
    })

    it('should mark if something was replaced', function() {
      const results = processFileSync(fromToToProcessor({
        files: 'test1',
        from: /re\splace/g,
        to: 'b',
      }))
      expect(results[0].hasChanged).to.equal(true)
    })

    it('should not mark if nothing was replaced', function() {
      const results = processFileSync(fromToToProcessor({
        files: 'test1',
        from: 'nope',
        to: 'b',
      }))
      expect(results[0].hasChanged).to.equal(false)
    })

    it('should return corret results for multiple files', function() {
      const results = processFileSync(fromToToProcessor({
        files: ['test1', 'test2', 'test3'],
        from: /re\splace/g,
        to: 'b',
      }))
      expect(results).to.have.length(3)
      expect(results[0].file).to.equal('test1')
      expect(results[0].hasChanged).to.equal(true)
      expect(results[1].file).to.equal('test2')
      expect(results[1].hasChanged).to.equal(true)
      expect(results[2].file).to.equal('test3')
      expect(results[2].hasChanged).to.equal(false)
    })

    it('should expand globs while excluding ignored files', () => {
      processFileSync(fromToToProcessor({
        files: 'test*',
        ignore: 'test1',
        from: /re\splace/g,
        to: 'b',
      }))
      const test1 = fs.readFileSync('test1', 'utf8')
      const test2 = fs.readFileSync('test2', 'utf8')
      expect(test1).to.equal('a re place c')
      expect(test2).to.equal('a b c')
    })

    it('should support an array of ignored files', () => {
      processFileSync(fromToToProcessor({
        files: 'test*',
        ignore: ['test1', 'test3'],
        from: /re\splace/g,
        to: 'b',
      }))
      const test1 = fs.readFileSync('test1', 'utf8')
      const test2 = fs.readFileSync('test2', 'utf8')
      expect(test1).to.equal('a re place c')
      expect(test2).to.equal('a b c')
    })

    it('should not fail when the ignore parameter is undefined', () => {
      processFileSync(fromToToProcessor({
        files: 'test*',
        ignore: undefined,
        from: /re\splace/g,
        to: 'b',
      }))
      const test1 = fs.readFileSync('test1', 'utf8')
      const test2 = fs.readFileSync('test2', 'utf8')
      expect(test1).to.equal('a b c')
      expect(test2).to.equal('a b c')
    })

    it('should work without expanding globs if disabled', () => {
      processFileSync(fromToToProcessor({
        files: ['test1', 'test2'],
        from: /re\splace/g,
        to: 'b',
        disableGlobs: true,
      }))
      const test1 = fs.readFileSync('test1', 'utf8')
      const test2 = fs.readFileSync('test2', 'utf8')
      expect(test1).to.equal('a b c')
      expect(test2).to.equal('a b c')
    })

    it('should not replace in a dry run', () => {
      processFileSync(fromToToProcessor({
        files: ['test1', 'test2'],
        from: /re\splace/g,
        to: 'b',
        dry: true,
      }))
      const test1 = fs.readFileSync('test1', 'utf8')
      const test2 = fs.readFileSync('test2', 'utf8')
      expect(test1).to.equal('a re place c')
      expect(test2).to.equal('a re place c')
    })

    it('should return changed files for a dry run', () => {
      const results = processFileSync(fromToToProcessor({
        files: ['test1', 'test2', 'test3'],
        from: /re\splace/g,
        to: 'b',
        dry: true,
      }))
      expect(results).to.have.length(3)
      expect(results[0].file).to.equal('test1')
      expect(results[0].hasChanged).to.equal(true)
      expect(results[1].file).to.equal('test2')
      expect(results[1].hasChanged).to.equal(true)
      expect(results[2].file).to.equal('test3')
      expect(results[2].hasChanged).to.equal(false)
    })

    it('should pass filename to processor as second parameter', () => {
      processFileSync(appendFileProcessor({
        files: 'test*',
      }))
      const test1 = fs.readFileSync('test1', 'utf8')
      const test2 = fs.readFileSync('test2', 'utf8')
      const test3 = fs.readFileSync('test3', 'utf8')
      expect(test1).to.equal(`${testData}test1`)
      expect(test2).to.equal(`${testData}test2`)
      expect(test3).to.equal('nopetest3')
    })

    describe('fsSync', () => {
      it('reads and writes using a custom fsSync when provided', done => {
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

        const results = processFileSync({
          files: 'test1',
          fsSync,
          processor: (input) => {
            return input.replace(/a/, 'z')
          },
        })

        expect(results[0].file).to.equal('test1')
        expect(written).to.equal('z')
        done()
      })
    })
  })

  describe('module export', () => {
    it(`exports named processFile and processFileSync from module`, () => {
      expect(processFile).to.be.a('function')
      expect(processFileSync).to.be.a('function')
    })
  })
})
