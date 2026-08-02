import type {ParsedConfig, From, FromValue, To, ReplaceResult} from '../types.js'

/**
 * Get replacement helper
 */
export function getReplacement(replace: To | To[], i: number): To | null {
  if (Array.isArray(replace)) {
    return replace[i] ?? null
  }
  return replace
}

/**
 * Escape string to make it safe for use in a regex
 */
export function escapeRegex(string: FromValue): FromValue {
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

  //Prepare result
  const result: ReplaceResult = {file, hasChanged: false}

  //Counting? Initialize number of matches
  if (count) {
    result.numMatches = 0
    result.numReplacements = 0
  }

  //Make replacements
  const newContents = from.reduce<string>((contents, item, i) => {

    //Call function if given, passing in the filename
    const search = (typeof item === 'function') ? item(file) : item

    //Get replacement value
    const replacement = getReplacement(to, i)
    if (replacement === null) {
      return contents
    }

    //Count matches
    if (count) {
      const matches = contents.match(escapeRegex(search))
      if (matches) {
        const replacements = matches.filter(match => match !== replacement)
        result.numMatches! += matches.length
        result.numReplacements! += replacements.length
      }
    }

    //Make replacement, appending the filename if a function is given
    if (typeof replacement === 'function') {
      return contents.replace(search, (...args: string[]) => replacement(...args, file))
    }
    return contents.replace(search, replacement)
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
