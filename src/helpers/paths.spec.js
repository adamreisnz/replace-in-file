import {expect, use, should} from 'chai'
import chaiAsPromised from 'chai-as-promised'
import {pathsSync, pathsAsync} from './paths.js'

//Enable should assertion style for usage with chai-as-promised
should()
use(chaiAsPromised)

/**
 * Specs
 */
describe('helpers/path.js', () => {

  //Patterns
  const patterns = ['**/*.js', '**/*.json']

  /**
   * pathsSync()
   */
  describe('pathsSync()', () => {

    it('should prefix each path with cwd if specified', () => {
      const paths = pathsSync(patterns, {
        cwd: './src/helpers/',
      })
      expect(paths).to.be.an('array')
      expect(paths).to.have.lengthOf(7)
      expect(paths[0]).to.equal('src/helpers/replace.js')
    })

    it('should return patterns as is if globs have been disabled', () => {
      const paths = pathsSync(patterns, {
        disableGlobs: true,
      })
      expect(paths).to.be.an('array')
      expect(paths).to.have.lengthOf(2)
      expect(paths[0]).to.equal('**/*.js')
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
      })
      expect(paths).to.be.an('array')
      expect(paths).to.have.lengthOf(2)
      expect(paths[0]).to.equal('**/*.js')
      expect(paths[1]).to.equal('**/*.json')
    })
  })
})
