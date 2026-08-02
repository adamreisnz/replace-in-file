import {expect, use} from 'chai'
import chaiAsPromised from 'chai-as-promised'
import fs from 'node:fs'
import fsAsync from 'node:fs/promises'
import {Readable, Writable} from 'node:stream'
import {pipeline} from 'node:stream/promises'
import {ReplaceTransform, replaceStreamAsync} from './stream.ts'
import {makeReplacements} from './replace.ts'
import {parseConfig} from './config.ts'
import type {FromValue, From, To, ReplaceInFileConfig} from '../types.ts'

//Enable promise assertions
use(chaiAsPromised)

/**
 * Helper to run input through a single transform with a given chunk size
 */
async function runTransform(
  input: string, search: FromValue, replacement: To,
  {chunkSize = 4, maxMatchLength = 1024, file = 'test-file'} = {}
): Promise<{output: string, transform: ReplaceTransform}> {
  const transform = new ReplaceTransform(search, replacement, file, maxMatchLength)
  const chunks: string[] = []
  for (let i = 0; i < input.length; i += chunkSize) {
    chunks.push(input.slice(i, i + chunkSize))
  }
  let output = ''
  const sink = new Writable({
    objectMode: true,
    write(chunk, _encoding, callback) {
      output += chunk
      callback()
    },
  })
  await pipeline(Readable.from(chunks), transform, sink)
  return {output, transform}
}

/**
 * Helper to assert transform output equals native String.replace for every
 * chunk size, so boundary handling is exercised at every offset. Runs both
 * with the given window size, which forces incremental processing, and the
 * default window, under which short inputs are processed in a single pass.
 */
async function expectParity(
  input: string, search: string | RegExp, replacement: To, window = 4
) {
  const [, expected] = makeReplacements(input, search, replacement, 'test-file')
  for (const maxMatchLength of new Set([window, 1024])) {
    for (let chunkSize = 1; chunkSize <= input.length + 1; chunkSize++) {
      const {output} = await runTransform(input, search, replacement, {chunkSize, maxMatchLength})
      expect(output).to.equal(expected,
        `chunk size ${chunkSize}, window ${maxMatchLength}`
      )
    }
  }
}

/**
 * Helper to run streaming replacement on a file
 */
function streamConfig(config: ReplaceInFileConfig) {
  return parseConfig(Object.assign({streaming: true}, config))
}

/**
 * Specs
 */
describe('helpers/stream.ts', () => {

  /**
   * ReplaceTransform
   */
  describe('ReplaceTransform', () => {

    it('should replace global regex matches across all chunk boundaries', async () => {
      await expectParity('the cat sat on the cat mat, cat!', /cat/g, 'dog')
    })

    it('should replace matches larger than the chunk size', async () => {
      await expectParity('a longmatchhere b longmatchhere c', /longmatchhere/g, 'x', 16)
    })

    it('should only replace the first occurrence for non global regexes', async () => {
      await expectParity('one cat, two cat, three cat', /cat/, 'dog')
    })

    it('should only replace the first occurrence for plain strings', async () => {
      await expectParity('one cat, two cat, three cat', 'cat', 'dog')
    })

    it('should treat regex special characters in strings literally', async () => {
      await expectParity('price is $5.00 (approx)', '$5.00 (approx)', 'money')
    })

    it('should handle an empty string search', async () => {
      await expectParity('abc', '', 'x')
    })

    it('should handle an empty input', async () => {
      const {output, transform} = await runTransform('', /cat/g, 'dog')
      expect(output).to.equal('')
      expect(transform.hasReplaced).to.be.false
    })

    it('should handle matches at the very start and end of input', async () => {
      await expectParity('cat in the hat cat', /cat/g, 'dog')
    })

    it('should handle adjacent matches', async () => {
      await expectParity('catcatcat', /cat/g, 'dog')
    })

    it('should handle patterns matching the empty string', async () => {
      await expectParity('abc', /x*/g, '-')
    })

    it('should expand dollar patterns in replacements', async () => {
      await expectParity('the cat sat', /c(a)t/g, '[$&|$1|$$|$2|$;]')
    })

    it('should expand named capture groups', async () => {
      await expectParity('the cat sat', /c(?<vowel>a)t/g, '<$<vowel>|$<nope>>')
    })

    it('should treat named group references without named groups as literal', async () => {
      await expectParity('the cat sat', /c(a)t/g, '$<vowel>')
    })

    it('should expand two digit capture group references', async () => {
      const from = /(a)(b)(c)(d)(e)(f)(g)(h)(i)(j)(k)?/g
      await expectParity('_abcdefghijk_', from, '$11|$10|$12|$99', 16)
      await expectParity('_abcdefghij_', from, '$11|$10', 16)
      await expectParity('the cat', /c(a)t/g, '$99')
    })

    it('should expand single digit references followed by literal digits', async () => {
      await expectParity('_ab_', /(a)(b)/g, '$12|$19')
    })

    it('should expand undefined optional groups as empty strings', async () => {
      await expectParity('_b_ ab', /(a)?(b)/g, '[$1$2]')
      await expectParity('_b_', /(a)?(b)/g, '[$13]')
    })

    it('should expand preceding and following portions', async () => {
      //$` and $' refer to the buffered window when streaming, so parity
      //only holds when the input is processed in a single pass
      const input = 'the cat sat'
      const [, expected] = makeReplacements(input, /cat/, `[$\`|$']`, 'test-file')
      const {output} = await runTransform(input, /cat/, `[$\`|$']`, {chunkSize: input.length})
      expect(output).to.equal(expected)
    })

    it('should respect start and end anchors', async () => {
      await expectParity('cat cat cat', /^cat/g, 'dog')
      await expectParity('cat cat cat', /cat$/g, 'dog')
      await expectParity('cat cat cat', /^cat$/g, 'dog')
    })

    it('should respect line anchors with the multiline flag', async () => {
      const input = 'cat one\nlong line with cat\ncat two\nnot a cat'
      await expectParity(input, /^cat/gm, 'dog')
      await expectParity(input, /cat$/gm, 'dog')
    })

    it('should respect lookbehind and lookahead assertions', async () => {
      await expectParity('big cat, the cat', /(?<=big )cat/g, 'dog', 8)
      await expectParity('cat sat, cat ran', /cat(?= sat)/g, 'dog', 8)
    })

    it('should handle case insensitive and unicode flags', async () => {
      await expectParity('Cat CAT cat', /cat/gi, 'dog')
      await expectParity('a\u{1F984}b\u{1F984}c', /\u{1F984}/gu, 'unicorn')
    })

    it('should call replacement functions with match, groups, offset and file', async () => {
      const calls: unknown[][] = []
      const {output} = await runTransform('xx cat yy cat', /c(a)t/g, (...args) => {
        calls.push(args)
        return 'dog'
      }, {chunkSize: 3})
      expect(output).to.equal('xx dog yy dog')
      expect(calls).to.have.lengthOf(2)
      expect(calls[0]).to.deep.equal(['cat', 'a', 3, 'test-file'])
      expect(calls[1]).to.deep.equal(['cat', 'a', 10, 'test-file'])
    })

    it('should pass absolute offsets when processing incrementally', async () => {
      const offsets: number[] = []
      const {output} = await runTransform('xx cat yy cat', /cat/g, (...args) => {
        offsets.push(args[1] as number)
        return 'dog'
      }, {chunkSize: 2, maxMatchLength: 4})
      expect(output).to.equal('xx dog yy dog')
      expect(offsets).to.deep.equal([3, 10])
    })

    it('should expose the file name as the last replacement function argument', async () => {
      const {output} = await runTransform('a cat', /cat/g, (...args: string[]) => args.pop()!, {
        file: 'some-file',
      })
      expect(output).to.equal('a some-file')
    })

    it('should pass the named groups object to replacement functions', async () => {
      const calls: unknown[][] = []
      await runTransform('a cat', /c(?<vowel>a)t/g, (...args) => {
        calls.push(args)
        return 'dog'
      })
      expect(calls).to.have.lengthOf(1)
      const [match, capture, offset, groups, file] = calls[0]!
      expect(match).to.equal('cat')
      expect(capture).to.equal('a')
      expect(offset).to.equal(2)
      expect(groups).to.deep.equal({vowel: 'a'})
      expect(file).to.equal('test-file')
    })

    it('should count matches and replacements', async () => {
      const {transform} = await runTransform('cat cat cat', /cat/g, 'dog')
      expect(transform.numMatches).to.equal(3)
      expect(transform.numReplacements).to.equal(3)
    })

    it('should not count identical replacements as changes', async () => {
      const {transform, output} = await runTransform('cat cat', /cat/g, 'cat')
      expect(output).to.equal('cat cat')
      expect(transform.numMatches).to.equal(2)
      expect(transform.numReplacements).to.equal(0)
      expect(transform.hasReplaced).to.be.false
    })

    it('should detect changes from replacement functions', async () => {
      const {transform} = await runTransform('cat cat', /cat/g, match => match)
      expect(transform.numMatches).to.equal(2)
      expect(transform.numReplacements).to.equal(2)
      expect(transform.hasReplaced).to.be.false
    })

    it('should only find regex matches up to the max match length', async () => {
      const {output} = await runTransform('start aXXXXXXXXXXb end', /a.*b/g, '-', {
        chunkSize: 4,
        maxMatchLength: 4,
      })
      expect(output).to.equal('start aXXXXXXXXXXb end')
    })
  })

  /**
   * replaceStreamAsync()
   */
  describe('replaceStreamAsync()', () => {

    //Test data
    const testData = 'a re place c'

    /**
     * Prepare and clean up test files
     */
    beforeEach(() => fsAsync.writeFile('stream-test', testData, 'utf8'))
    afterEach(async () => {
      const files = await fsAsync.readdir('.')
      await Promise.all(files
        .filter(file => file.startsWith('stream-test'))
        .map(file => fsAsync.unlink(file))
      )
    })

    it('should replace contents in a file', async () => {
      const config = streamConfig({files: 'stream-test', from: /re\splace/g, to: 'b'})
      const result = await replaceStreamAsync('stream-test', config.from!, config.to!, config)
      expect(result).to.deep.equal({file: 'stream-test', hasChanged: true})
      expect(fs.readFileSync('stream-test', 'utf8')).to.equal('a b c')
    })

    it('should not leave temporary files behind', async () => {
      const config = streamConfig({files: 'stream-test', from: /re\splace/g, to: 'b'})
      await replaceStreamAsync('stream-test', config.from!, config.to!, config)
      const files = await fsAsync.readdir('.')
      expect(files.filter(file => file.includes('.tmp'))).to.have.lengthOf(0)
    })

    it('should not modify the file on a dry run', async () => {
      const config = streamConfig({files: 'stream-test', from: /re\splace/g, to: 'b', dry: true, countMatches: true})
      const result = await replaceStreamAsync('stream-test', config.from!, config.to!, config)
      expect(result).to.deep.equal({
        file: 'stream-test', hasChanged: true, numMatches: 1, numReplacements: 1,
      })
      expect(fs.readFileSync('stream-test', 'utf8')).to.equal(testData)
      const files = await fsAsync.readdir('.')
      expect(files.filter(file => file.includes('.tmp'))).to.have.lengthOf(0)
    })

    it('should not rewrite the file when nothing matched', async () => {
      const {ino} = fs.statSync('stream-test')
      const config = streamConfig({files: 'stream-test', from: /nope/g, to: 'b'})
      const result = await replaceStreamAsync('stream-test', config.from!, config.to!, config)
      expect(result.hasChanged).to.be.false
      expect(fs.readFileSync('stream-test', 'utf8')).to.equal(testData)
      expect(fs.statSync('stream-test').ino).to.equal(ino)
    })

    it('should preserve the file mode', async () => {
      fs.chmodSync('stream-test', 0o764)
      const config = streamConfig({files: 'stream-test', from: /re\splace/g, to: 'b'})
      await replaceStreamAsync('stream-test', config.from!, config.to!, config)
      expect(fs.statSync('stream-test').mode & 0o777).to.equal(0o764)
    })

    it('should write to a different file with getTargetFile', async () => {
      const config = streamConfig({
        files: 'stream-test', from: /re\splace/g, to: 'b',
        getTargetFile: source => `${source}-target`,
      })
      const result = await replaceStreamAsync('stream-test', config.from!, config.to!, config)
      expect(result.hasChanged).to.be.true
      expect(fs.readFileSync('stream-test', 'utf8')).to.equal(testData)
      expect(fs.readFileSync('stream-test-target', 'utf8')).to.equal('a b c')
    })

    it('should apply multiple replacements in sequence', async () => {
      const from: From[] = [/re\splace/g, /a b/g]
      const to: To[] = ['b', 'x']
      const config = streamConfig({files: 'stream-test', from, to, countMatches: true})
      const result = await replaceStreamAsync('stream-test', from, to, config)
      const [, expected] = makeReplacements(testData, from, to, 'stream-test')
      expect(fs.readFileSync('stream-test', 'utf8')).to.equal(expected)
      expect(result.numMatches).to.equal(2)
      expect(result.numReplacements).to.equal(2)
    })

    it('should skip patterns without a replacement', async () => {
      const from: From[] = [/a/g, /c/g]
      const to: To[] = ['x']
      const config = streamConfig({files: 'stream-test', from, to})
      await replaceStreamAsync('stream-test', from, to, config)
      expect(fs.readFileSync('stream-test', 'utf8')).to.equal('x re plxce c')
    })

    it('should not touch the file if no patterns have replacements', async () => {
      const from: From[] = [/a/g]
      const to: To[] = []
      const config = streamConfig({files: 'stream-test', from, to, countMatches: true})
      const result = await replaceStreamAsync('stream-test', from, to, config)
      expect(result).to.deep.equal({
        file: 'stream-test', hasChanged: false, numMatches: 0, numReplacements: 0,
      })
      expect(fs.readFileSync('stream-test', 'utf8')).to.equal(testData)
    })

    it('should pass the file to from functions', async () => {
      let passed = ''
      const from: From = file => {
        passed = file
        return /re\splace/g
      }
      const config = streamConfig({files: 'stream-test', from, to: 'b'})
      await replaceStreamAsync('stream-test', from, config.to!, config)
      expect(passed).to.equal('stream-test')
      expect(fs.readFileSync('stream-test', 'utf8')).to.equal('a b c')
    })

    it('should reject when the file does not exist and clean up', async () => {
      const config = streamConfig({files: 'stream-test-missing', from: /x/g, to: 'y'})
      await expect(
        replaceStreamAsync('stream-test-missing', config.from!, config.to!, config)
      ).to.be.rejected
      const files = await fsAsync.readdir('.')
      expect(files.filter(file => file.includes('.tmp'))).to.have.lengthOf(0)
    })

    it('should produce output identical to buffered mode on larger content', async function() {
      this.timeout(10000)

      //Generate content larger than the default stream chunk size, with
      //matches positioned to fall across chunk boundaries
      const words = ['cat', 'dog', 'catamaran', 'concat', 'x'.repeat(97), 'y']
      let content = ''
      let i = 0
      while (content.length < 2 * 1024 * 1024) {
        content += words[i % words.length] + ((i % 7 === 0) ? '\n' : ' ')
        i++
      }
      await fsAsync.writeFile('stream-test-large', content, 'utf8')

      //Compare buffered and streaming results
      const from = [/\bcat\b/g, /dog(?= )/g]
      const to = ['feline', '$&gone']
      const [buffered, expected] = makeReplacements(
        content, from, to, 'stream-test-large', true
      )
      const config = streamConfig({files: 'stream-test-large', from, to, countMatches: true})
      const result = await replaceStreamAsync('stream-test-large', from, to, config)
      expect(fs.readFileSync('stream-test-large', 'utf8')).to.equal(expected)
      expect(result.hasChanged).to.equal(buffered.hasChanged)
      expect(result.numMatches).to.equal(buffered.numMatches)
      expect(result.numReplacements).to.equal(buffered.numReplacements)
    })

    it('should handle multi byte characters split across read chunks', async () => {
      const content = `unicorns: ${'\u{1F984}'.repeat(10)}!`
      await fsAsync.writeFile('stream-test-emoji', content, 'utf8')
      const config = streamConfig({files: 'stream-test-emoji', from: /\u{1F984}/gu, to: 'U'})
      await replaceStreamAsync('stream-test-emoji', config.from!, config.to!, config)
      expect(fs.readFileSync('stream-test-emoji', 'utf8')).to.equal(`unicorns: ${'U'.repeat(10)}!`)
    })
  })
})
