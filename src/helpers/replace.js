
/**
 * Get replacement helper
 */
export function getReplacement(replace, isArray, i) {
  if (isArray && typeof replace[i] === 'undefined') {
    return null
  }
  if (isArray) {
    return replace[i]
  }
  return replace
}

/**
 * Escape string to make it safe for use in a regex
 */
export function escapeRegex(string) {
  if (typeof string === 'string') {
    return string.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')
  }
  return string
}

/**
 * Helper to make replacements
 */
export function makeReplacements(contents, from, to, file, count) {

  //Turn into array
  if (!Array.isArray(from)) {
    from = [from]
  }

  //Check if replace value is an array and prepare result
  const isArray = Array.isArray(to)
  const result = {file}

  //Counting? Initialize number of matches
  if (count) {
    result.numMatches = 0
    result.numReplacements = 0
  }

  //Make replacements
  const newContents = from.reduce((contents, item, i) => {

    //Call function if given, passing in the filename
    if (typeof item === 'function') {
      item = item(file)
    }

    //Get replacement value
    let replacement = getReplacement(to, isArray, i)
    if (replacement === null) {
      return contents
    }

    //Call function if given, appending the filename
    if (typeof replacement === 'function') {
      const original = replacement
      replacement = (...args) => original(...args, file)
    }

    //Count matches
    if (count) {
      const matches = contents.match(escapeRegex(item))
      if (matches) {
        const replacements = matches.filter(match => match !== replacement)
        result.numMatches += matches.length
        result.numReplacements += replacements.length
      }
    }

    //Make replacement
    return contents.replace(item, replacement)
  }, contents)

  //Check if changed
  result.hasChanged = (newContents !== contents)

  //Return result and new contents
  return [result, newContents]
}

/**
 * Helper to replace in a single file (sync)
 */
export function replaceSync(source, from, to, config) {

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
export async function replaceAsync(source, from, to, config) {

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
