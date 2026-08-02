import {replaceInFile, replaceInFileSync} from './src/replace-in-file.js'
import {processFile, processFileSync} from './src/process-file.js'

//Export
export {replaceInFile, replaceInFileSync, processFile, processFileSync}

//Export types
export type {
  ReplaceInFileConfig,
  ReplaceResult,
  From,
  FromValue,
  FromCallback,
  To,
  ToCallback,
  Processor,
  ProcessorAsync,
  GetTargetFile,
  AsyncFs,
  SyncFs
} from './src/types.js'
