import {replaceInFile, replaceInFileSync} from './src/replace-in-file.ts'
import {processFile, processFileSync} from './src/process-file.ts'

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
} from './src/types.ts'
