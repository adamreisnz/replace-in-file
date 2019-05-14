
declare module 'replace-in-file' {
  function replaceInFile(config: ReplaceInFileConfig): Promise<ReplaceResults>;
  function replaceInFile(config: ReplaceInFileConfig, cb: (error: Error, results: ReplaceResults) => void): void;
  export default replaceInFile;

  namespace replaceInFile {
    export function sync(config: ReplaceInFileConfig): ReplaceResults;
  }

  export interface ReplaceInFileConfig {
    files: string | string[];
    from: string | RegExp | string[] | RegExp[] | FromCallback;
    to: string | string[] | ToCallback;
    countMatches?: boolean;
    allowEmptyPaths?: boolean,
    disableGlobs?: boolean,
    encoding?: string,
    dry?:boolean
  }

  export interface ReplaceResults {
    file: string;
    hasChanged: boolean;
    numMatches?: number,
    numReplacements?: number,
  }
}

type FromCallback = (file: string) => string | RegExp | string[] | RegExp[];
type ToCallback = (match: string, file: string) => string | string[];
