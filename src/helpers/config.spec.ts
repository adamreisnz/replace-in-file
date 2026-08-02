import {expect, use, should} from 'chai'
import chaiAsPromised from 'chai-as-promised'
import {loadConfig, combineConfig, parseConfig, stringToRegex} from './config.js'
import fs from 'node:fs'

//Enable should assertion style for usage with chai-as-promised
should()
use(chaiAsPromised)

/**
 * Specs
 */
describe('helpers/config.js', () => {

  /**
   * Load config
   */
  describe('loadConfig()', () => {

    it('should error if no file is provided', () => {
      return expect(loadConfig(undefined as any)).to.eventually.be.rejectedWith(Error)
    })

    it('should error when an invalid file is provided', () => {
      return expect(loadConfig(42 as any)).to.eventually.be.rejectedWith(Error)
    })

    it('should read config from a valid file', async () => {

      //Test config
      const config = {
        files: ['file.txt'],
        from: 'foo',
        to: 'bar',
      }
      fs.writeFileSync('config.json', JSON.stringify(config), 'utf8')

      //Load config
      const cfg = await loadConfig('config.json')
      expect(cfg).to.be.an('object')
      expect(cfg.files).to.be.an('array')
      expect(cfg.files).to.eql(config.files)
      expect(cfg.from).to.equal(config.from)
      expect(cfg.to).to.equal(config.to)

      //Clean up
      fs.unlinkSync('config.json')
    })
  })

  /**
   * String to regex
   */
  describe('stringToRegex()', () => {

    it('should convert strings wrapped in slashes to a regex', () => {
      expect(stringToRegex('/cat/g')).to.eql(/cat/g)
      expect(stringToRegex('/cat/')).to.eql(/cat/)
      expect(stringToRegex('/^foo.*bar$/gim')).to.eql(/^foo.*bar$/gim)
    })

    it('should convert arrays of strings', () => {
      expect(stringToRegex(['/cat/g', 'dog'])).to.eql([/cat/g, 'dog'])
    })

    it('should leave strings without a leading slash untouched', () => {
      expect(stringToRegex('assets/img')).to.equal('assets/img')
      expect(stringToRegex('src/gui')).to.equal('src/gui')
      expect(stringToRegex('path/to/g')).to.equal('path/to/g')
      expect(stringToRegex('foo/')).to.equal('foo/')
      expect(stringToRegex('1.2/')).to.equal('1.2/')
      expect(stringToRegex('plain')).to.equal('plain')
    })

    it('should leave non-string values untouched', () => {
      expect(stringToRegex(/cat/g)).to.eql(/cat/g)
      expect(stringToRegex(42 as any)).to.equal(42)
      expect(stringToRegex(undefined)).to.equal(undefined)
    })
  })

  /**
   * Combine config
   */
  describe('combineConfig()', () => {
    it('should combine config with passed arguments', () => {
      const argv = {
        _: ['foo', 'bar', 'file.txt'],
        ignore: ['ignore-file.txt'],
        encoding: 'encoding',
        disableGlobs: true,
        dry: true,
        quiet: true,
      }
      const combined = combineConfig({}, argv)
      expect(combined.from).to.equal('foo')
      expect(combined.to).to.equal('bar')
      expect(combined.files).to.eql(['file.txt'])
      expect(combined.ignore).to.eql(['ignore-file.txt'])
      expect(combined.encoding).to.equal('encoding')
      expect(combined.disableGlobs).to.be.true
      expect(combined.dry).to.be.true
      expect(combined.quiet).to.be.true
    })
  })

  /**
   * Parse config
   */
  describe('parseConfig()', () => {

    it('should error if no config is provided', () => {
      expect(() => parseConfig(undefined as any)).to.throw(Error)
    })

    it('should error when an invalid config is provided', () => {
      expect(() => parseConfig(42 as any)).to.throw(Error)
      expect(() => parseConfig(null as any)).to.throw(Error)
    })

    it('should error when an invalid `processor` is specified', () => {
      expect(() => parseConfig({
        processor: 'foo' as any,
        files: ['test1', 'test2', 'test3'],
        from: [/re/g, /place/g],
        to: ['b'],
      })).to.throw(Error)
    })

    it('should error when an invalid `processorAsync` is specified', () => {
      expect(() => parseConfig({
        processorAsync: 'foo' as any,
        files: ['test1', 'test2', 'test3'],
        from: [/re/g, /place/g],
        to: ['b'],
      })).to.throw(Error)
    })

    it('should error when `files` are not specified', () => {
      expect(() => parseConfig({
        from: [/re/g, /place/g],
        to: ['b'],
      })).to.throw(Error)
    })

    it('should error when `from` is not specified', () => {
      expect(() => parseConfig({
        files: ['test1', 'test2', 'test3'],
        to: ['b'],
      })).to.throw(Error)
    })

    it('should error when `to` is not specified', () => {
      expect(() => parseConfig({
        files: ['test1', 'test2', 'test3'],
        from: [/re/g, /place/g],
      })).to.throw(Error)
    })

    it('should error when an invalid `getTargetFile` handler is specified', () => {
      expect(() => parseConfig({
        getTargetFile: 'foo' as any,
        files: ['test1', 'test2', 'test3'],
        from: [/re/g, /place/g],
        to: ['b'],
      })).to.throw(Error)
    })

    it('should convert `files` to an array', () => {
      const parsed = parseConfig({
        files: 'test1',
        from: [/re/g, /place/g],
        to: ['b'],
      })
      expect(parsed.files).to.eql(['test1'])
    })

    it('should default the `ignore` option to an empty array', () => {
      const parsed = parseConfig({
        files: ['test1'],
        from: [/re/g, /place/g],
        to: ['b'],
      })
      expect(parsed.ignore).to.eql([])
    })
    it('should convert the `ignore` option to an array', () => {
      const parsed = parseConfig({
        files: ['test1'],
        from: [/re/g, /place/g],
        to: ['b'],
        ignore: 'ignore-file.txt',
      })
      expect(parsed.ignore).to.eql(['ignore-file.txt'])
    })

    it('should default `encoding` to utf-8 if not provided or invalid', () => {
      const a = parseConfig({
        files: ['test1'],
        from: [/re/g, /place/g],
        to: ['b'],
      })
      const b = parseConfig({
        files: ['test1'],
        from: [/re/g, /place/g],
        to: ['b'],
        encoding: 42 as any,
      })
      const c = parseConfig({
        files: ['test1'],
        from: [/re/g, /place/g],
        to: ['b'],
        encoding: '',
      })
      expect(a.encoding).to.equal('utf-8')
      expect(b.encoding).to.equal('utf-8')
      expect(c.encoding).to.equal('utf-8')
    })

    it('should convert from regex if provided in JSON', async () => {
      const parsed = parseConfig({
        files: ['file.txt'],
        from: '/foo/g',
        to: 'bar',
      })
      expect(parsed.from).to.be.an.instanceof(RegExp)
    })

    it('should convert from an array of regexes if provided in JSON', async () => {
      const parsed = parseConfig({
        files: ['file.txt'],
        from: ['/foo/g', '/baz/g', 'plain'],
        to: 'bar',
      })
      expect(parsed.from).to.be.an.instanceof(Array)
      expect((parsed.from as any[])[0]).to.be.an.instanceof(RegExp)
      expect((parsed.from as any[])[1]).to.be.an.instanceof(RegExp)
      expect((parsed.from as any[])[2]).to.equal('plain')
    })

    it('should not convert from regex if it is a regular string', async () => {
      const parsed = parseConfig({
        files: ['file.txt'],
        from: '/foo',
        to: 'bar',
      })
      expect(parsed.from).not.to.be.an.instanceof(RegExp)
      expect(parsed.from).to.equal('/foo')
    })

    it('should overwrite the config defaults', () => {
      const parsed = parseConfig({
        files: 'test1',
        from: [/re/g, /place/g],
        to: ['b'],
        ignore: 'ignore-file.txt',
        encoding: 'encoding',
        disableGlobs: true,
        allowEmptyPaths: true,
        countMatches: true,
        verbose: true,
        quiet: true,
        dry: true,
        glob: 'glob' as any,
        cwd: 'cwd',
        fs: 'fs' as any,
        fsSync: 'fsSync' as any,
      })
      expect(parsed.ignore).to.eql(['ignore-file.txt'])
      expect(parsed.encoding).to.equal('encoding')
      expect(parsed.disableGlobs).to.be.true
      expect(parsed.allowEmptyPaths).to.be.true
      expect(parsed.countMatches).to.be.true
      expect(parsed.verbose).to.be.true
      expect(parsed.quiet).to.be.true
      expect(parsed.dry).to.be.true
      expect(parsed.glob).to.equal('glob')
      expect(parsed.cwd).to.equal('cwd')
      expect(parsed.fs).to.equal('fs')
      expect(parsed.fsSync).to.equal('fsSync')
    })
  })
})
