import type {GlobOptions} from 'glob'

/**
 * Replacement source and target values
 */
export type FromValue = string | RegExp
export type FromCallback = (file: string) => FromValue | FromValue[]
export type From = FromValue | FromCallback
export type ToCallback = (...args: any[]) => string
export type To = string | ToCallback

/**
 * Processor callbacks
 */
export type Processor = (contents: string, file: string) => string
export type ProcessorAsync = (contents: string, file: string) => string | Promise<string>

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
  glob?: GlobOptions
  cwd?: string | null
  getTargetFile?(source: string): string
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
  glob: GlobOptions
  cwd: string | null
  getTargetFile(source: string): string
  fs: AsyncFs
  fsSync: SyncFs
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
