import type {GlobOptionsWithFileTypesFalse} from 'glob'

/**
 * Replacement source and target values
 */
export type FromValue = string | RegExp
export type FromCallback = (file: string) => FromValue
export type From = FromValue | FromCallback

/**
 * The replacement is passed to String.replace(), which calls it with the match,
 * any capture groups, the offset and the full string, with the file name
 * appended. The argument types therefore vary per call, and `unknown` would
 * reject the documented `(...args) => args.pop()` usage.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ToCallback = (...args: any[]) => string
export type To = string | ToCallback

/**
 * Processor and target file callbacks
 */
export type Processor = (contents: string, file: string) => string
export type ProcessorAsync = (contents: string, file: string) => string | Promise<string>
export type GetTargetFile = (source: string) => string

/**
 * File system interfaces (subset of node:fs/promises and node:fs)
 */
export interface AsyncFs {
  readFile(path: string, encoding: BufferEncoding): Promise<string>
  writeFile(path: string, contents: string, encoding: BufferEncoding): Promise<void>
}
export interface SyncFs {
  readFileSync(path: string, encoding: BufferEncoding): string
  writeFileSync(path: string, contents: string, encoding: BufferEncoding): void
}

/**
 * Configuration as provided by the user
 */
export interface ReplaceInFileConfig {
  files?: string | string[]
  from?: From | From[]
  to?: To | To[]
  ignore?: string | string[]
  encoding?: string
  disableGlobs?: boolean
  allowEmptyPaths?: boolean
  countMatches?: boolean
  verbose?: boolean
  quiet?: boolean
  dry?: boolean
  streaming?: boolean
  maxMatchLength?: number
  glob?: GlobOptionsWithFileTypesFalse
  cwd?: string | null
  getTargetFile?: GetTargetFile
  processor?: Processor | Processor[]
  processorAsync?: ProcessorAsync | ProcessorAsync[]
  fs?: AsyncFs
  fsSync?: SyncFs
}

/**
 * Configuration after parsing, with defaults applied
 */
export interface ParsedConfig extends ReplaceInFileConfig {
  files: string[]
  ignore: string[]
  encoding: BufferEncoding
  disableGlobs: boolean
  allowEmptyPaths: boolean
  countMatches: boolean
  verbose: boolean
  quiet: boolean
  dry: boolean
  streaming: boolean
  maxMatchLength: number
  glob: GlobOptionsWithFileTypesFalse
  cwd: string | null
  getTargetFile: GetTargetFile
  fs: AsyncFs
  fsSync: SyncFs
}

/**
 * CLI arguments as parsed by yargs
 */
export interface CliArguments extends Pick<ReplaceInFileConfig,
  'ignore' | 'encoding' | 'disableGlobs' | 'verbose' | 'quiet' | 'dry' |
  'streaming' | 'maxMatchLength'
> {
  _: (string | number)[]
  configFile?: string
  help?: boolean
  h?: boolean
}

/**
 * Result of a replacement operation on a single file
 */
export interface ReplaceResult {
  file: string
  hasChanged: boolean
  numMatches?: number
  numReplacements?: number
}
