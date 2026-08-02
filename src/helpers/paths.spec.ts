import {expect, use} from 'chai'
import chaiAsPromised from 'chai-as-promised'
import {pathsSync, pathsAsync} from './paths.ts'
import type {ParsedConfig} from '../types.ts'

//Enable promise assertions
use(chaiAsPromised)

/**
 * Specs
 */
describe('helpers/path.js', () => {

  //Patterns
  const patterns = ['**/*.ts', '**/*.json']

  /**
   * pathsSync()
   */
  describe('pathsSync()', () => {

    it('should prefix each path with cwd if specified', () => {
      const paths = pathsSync(patterns, {
        cwd: './src/helpers/',
      } as ParsedConfig)
      expect(paths).to.be.an('array')
      expect(paths).to.have.lengthOf(9)
      expect(paths[0]).to.equal('src/helpers/stream.ts')
    })

    it('should return patterns as is if globs have been disabled', () => {
      const paths = pathsSync(patterns, {
        disableGlobs: true,
      } as ParsedConfig)
      expect(paths).to.be.an('array')
      expect(paths).to.have.lengthOf(2)
      expect(paths[0]).to.equal('**/*.ts')
      expect(paths[1]).to.equal('**/*.json')
    })
  })

  /**
   * pathsAsync()
   */
  describe('pathsAsync()', () => {

    it('should return patterns as is if globs have been disabled', async () => {
      const paths = await pathsAsync(patterns, {
        disableGlobs: true,
      } as ParsedConfig)
      expect(paths).to.be.an('array')
      expect(paths).to.have.lengthOf(2)
      expect(paths[0]).to.equal('**/*.ts')
      expect(paths[1]).to.equal('**/*.json')
    })
  })
})
