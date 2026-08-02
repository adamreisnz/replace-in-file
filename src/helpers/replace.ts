import type {ParsedConfig, From, FromValue, To, ToCallback, ReplaceResult} from '../types.js'

/**
 * Get replacement helper
 */
export function getReplacement(
  replace: To | To[], isArray: boolean, i: number
): To | null {
  if (isArray && typeof (replace as To[])[i] === 'undefined') {
    return null
  }
  if (isArray) {
    return (replace as To[])[i]!
  }
  return replace as To
}

/**
 * Escape string to make it safe for use in a regex
 */
export function escapeRegex<T>(string: T): T | string {
  if (typeof string === 'string') {
    return string.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')
  }
  return string
}

/**
 * Helper to make replacements
 */
export function makeReplacements(
  contents: string, from: From | From[], to: To | To[],
  file: string, count?: boolean
): [ReplaceResult, string] {

  //Turn into array
  if (!Array.isArray(from)) {
    from = [from]
  }

  //Check if replace value is an array and prepare result
  const isArray = Array.isArray(to)
  const result: ReplaceResult = {file, hasChanged: false}

  //Counting? Initialize number of matches
  if (count) {
    result.numMatches = 0
    result.numReplacements = 0
  }

  //Make replacements
  const newContents = from.reduce((contents: string, item: From, i: number) => {

    //Call function if given, passing in the filename
    if (typeof item === 'function') {
      item = item(file) as FromValue
    }

    //Get replacement value
    let replacement = getReplacement(to, isArray, i)
    if (replacement === null) {
      return contents
    }

    //Call function if given, appending the filename
    if (typeof replacement === 'function') {
      const original = replacement
      replacement = (...args: unknown[]) => original(...args, file)
    }

    //Count matches
    if (count) {
      const matches = contents.match(escapeRegex(item as string | RegExp))
      if (matches) {
        const replacements = matches.filter(match => match !== replacement)
        result.numMatches! += matches.length
        result.numReplacements! += replacements.length
      }
    }

    //Make replacement
    return contents.replace(item, replacement as string & ToCallback)
  }, contents)

  //Check if changed
  result.hasChanged = (newContents !== contents)

  //Return result and new contents
  return [result, newContents]
}

/**
 * Helper to replace in a single file (sync)
 */
export function replaceSync(
  source: string, from: From | From[], to: To | To[], config: ParsedConfig
): ReplaceResult {

  //Extract relevant config and read file contents
  const {getTargetFile, encoding, dry, countMatches, fsSync} = config
  const contents = fsSync.readFileSync(source, encoding)

  //Replace contents and check if anything changed
  const [result, newContents] = makeReplacements(
    contents, from, to, source, countMatches
  )

  //Get target file
  const target = getTargetFile(source)

  //Contents changed and not a dry run? Write to file
  if (result.hasChanged && !dry) {
    fsSync.writeFileSync(target, newContents, encoding)
  }

  //Return result
  return result
}

/**
 * Helper to replace in a single file (async)
 */
export async function replaceAsync(
  source: string, from: From | From[], to: To | To[], config: ParsedConfig
): Promise<ReplaceResult> {

  //Extract relevant config and read file contents
  const {getTargetFile, encoding, dry, countMatches, fs} = config
  const contents = await fs.readFile(source, encoding)

  //Make replacements
  const [result, newContents] = makeReplacements(
    contents, from, to, source, countMatches
  )

  //Get target file
  const target = getTargetFile(source)

  //Contents changed and not a dry run? Write to file
  if (result.hasChanged && !dry) {
    await fs.writeFile(target, newContents, encoding)
  }

  //Return result
  return result
}
