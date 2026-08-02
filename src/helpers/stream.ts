import crypto from 'node:crypto'
import {Transform, Writable} from 'node:stream'
import type {TransformCallback} from 'node:stream'
import {pipeline} from 'node:stream/promises'
import {createReadStream, createWriteStream} from 'node:fs'
import {stat, chmod, rename, rm, realpath} from 'node:fs/promises'
import {getReplacement, escapeRegex} from './replace.ts'
import type {ParsedConfig, From, FromValue, To, ReplaceResult} from '../types.ts'

/**
 * Parsed arguments of a String.replace() callback, which receives
 * (match, ...captures, offset, string) plus a trailing named groups
 * object if the regex contains named capture groups
 */
interface ReplaceArgs {
  match: string
  captures: (string | undefined)[]
  offset: number
  haystack: string
  groups?: Record<string, string | undefined>
}

/**
 * Helper to parse the arguments passed to a String.replace() callback
 */
function parseReplaceArgs(args: unknown[]): ReplaceArgs {
  const hasGroups = (typeof args[args.length - 1] === 'object')
  const i = hasGroups ? args.length - 2 : args.length - 1
  return {
    match: args[0] as string,
    captures: args.slice(1, i - 1) as (string | undefined)[],
    offset: args[i - 1] as number,
    haystack: args[i] as string,
    groups: hasGroups ?
      args[args.length - 1] as Record<string, string | undefined> :
      undefined,
  }
}

/**
 * Helper to expand $-patterns in a string replacement, mirroring the native
 * GetSubstitution semantics of String.replace() ($$, $&, $`, $', $n, $<name>)
 */
export function expandReplacement(
  template: string, {match, captures, offset, haystack, groups}: ReplaceArgs
): string {
  return template.replace(/\$(\$|&|`|'|\d{1,2}|<[^>]*>)/g, (whole, token: string) => {

    //Simple tokens
    if (token === '$') {
      return '$'
    }
    if (token === '&') {
      return match
    }
    if (token === '`') {
      return haystack.slice(0, offset)
    }
    if (token === `'`) {
      return haystack.slice(offset + match.length)
    }

    //Named capture group reference (literal if the regex has no named groups,
    //empty string if the regex has named groups but not this one)
    if (token.startsWith('<')) {
      if (!groups) {
        return whole
      }
      return groups[token.slice(1, -1)] ?? ''
    }

    //Numbered capture group reference: try two digits first, then one digit
    //with the second digit taken literally, otherwise leave as literal text
    if (token.length === 2) {
      const two = parseInt(token, 10)
      if (two >= 1 && two <= captures.length) {
        return captures[two - 1] ?? ''
      }
      const one = parseInt(token[0]!, 10)
      if (one >= 1 && one <= captures.length) {
        return (captures[one - 1] ?? '') + token[1]
      }
      return whole
    }
    const one = parseInt(token, 10)
    if (one >= 1 && one <= captures.length) {
      return captures[one - 1] ?? ''
    }
    return whole
  })
}

/**
 * Transform stream that applies a single from/to replacement to a stream of
 * text, finding matches across chunk boundaries. Matches up to the given
 * window size are guaranteed to be found exactly; regex matches longer than
 * the window are not. Memory usage stays bounded at roughly the incoming
 * chunk size plus twice the window size, regardless of file size.
 */
export class ReplaceTransform extends Transform {

  //Counters, available once the stream has finished
  numMatches = 0
  numReplacements = 0
  hasReplaced = false

  //Matching state
  private buffer = ''
  private context = ''
  private emitted = 0
  private done = false

  //Pattern configuration
  private readonly replacement: To
  private readonly file: string
  private readonly pattern: RegExp
  private readonly firstOnly: boolean
  private readonly window: number

  /**
   * Constructor
   */
  constructor(search: FromValue, replacement: To, file: string, maxMatchLength: number) {

    //Pass strings through unmodified between chained transforms
    super({objectMode: true})
    this.replacement = replacement
    this.file = file

    //Plain string search: exact, replaces the first occurrence only, and the
    //window only needs to cover the length of the search string itself
    if (typeof search === 'string') {
      this.pattern = new RegExp(escapeRegex(search) as string, 'g')
      this.firstOnly = true
      this.window = Math.max(search.length, 1)
    }

    //Regex search: match against a global copy so all matches are found, but
    //honour first-occurrence-only semantics when the g flag is absent
    else {
      this.pattern = search.flags.includes('g') ?
        search :
        new RegExp(search.source, search.flags + 'g')
      this.firstOnly = !search.flags.includes('g')
      this.window = maxMatchLength
    }
  }

  /**
   * Accumulate incoming text and process what can be decided
   */
  _transform(chunk: string, _encoding: BufferEncoding, callback: TransformCallback) {
    this.buffer += chunk
    this.processBuffer(false)
    callback()
  }

  /**
   * Process the remainder once the input ends
   */
  _flush(callback: TransformCallback) {
    this.processBuffer(true)
    callback()
  }

  /**
   * Process the buffered text, replacing matches that can no longer change
   * with more input and emitting the decided portion
   */
  private processBuffer(isFinal: boolean) {

    //First occurrence already replaced? No further matching needed
    if (this.firstOnly && this.done) {
      if (this.buffer.length > 0) {
        this.push(this.buffer)
        this.emitted += this.buffer.length
        this.buffer = ''
      }
      return
    }

    //Wait for at least a full window of undecided text, so that every
    //position we emit has had its full potential match window visible
    if (!isFinal && this.buffer.length < this.window) {
      return
    }

    //Prepend the retained context of already emitted text, so that line
    //anchors and lookbehind assertions evaluate correctly at the boundary
    const hay = this.context + this.buffer
    const contextLength = this.context.length

    //A match starting at or before this index cannot change with more input;
    //at the end of input, everything is decided
    const decided = isFinal ? hay.length : hay.length - this.window

    //Track how far we can emit and how much replacements change the length
    let commitEnd = isFinal ? hay.length : decided + 1
    let delta = 0

    //Replace all decided matches, leaving other matches untouched
    const out = hay.replace(this.pattern, (...args) => {
      const parsed = parseReplaceArgs(args)
      const {match, offset} = parsed

      //Skip matches in the already emitted context, matches that may still
      //change with more input, and later matches for first-only patterns
      if (offset < contextLength || offset > decided || this.done) {
        return match
      }

      //Expand the replacement
      const expansion = this.expand(parsed)

      //Update counters and state
      this.numMatches++
      if (match !== this.replacement) {
        this.numReplacements++
      }
      if (expansion !== match) {
        this.hasReplaced = true
      }
      if (this.firstOnly) {
        this.done = true
      }

      //Extend the emittable region to cover this match and track the
      //length difference its replacement introduces
      commitEnd = Math.max(commitEnd, offset + match.length)
      delta += expansion.length - match.length
      return expansion
    })

    //Emit the decided portion and retain the tail and fresh context
    const emit = out.slice(contextLength, commitEnd + delta)
    if (emit.length > 0) {
      this.push(emit)
    }
    const consumed = commitEnd - contextLength
    this.emitted += consumed
    this.context = hay.slice(Math.max(0, commitEnd - this.window), commitEnd)
    this.buffer = this.buffer.slice(consumed)
  }

  /**
   * Expand the replacement for a single match
   */
  private expand(parsed: ReplaceArgs): string {
    const {replacement, file} = this

    //Callback replacement: called with the match, capture groups, the
    //absolute offset within the input, the named groups object if present,
    //and the file name appended (the full contents argument is omitted,
    //as it does not exist when streaming)
    if (typeof replacement === 'function') {
      const {match, captures, offset, groups} = parsed
      const absolute = this.emitted + (offset - this.context.length)
      return groups ?
        replacement(match, ...captures, absolute, groups, file) :
        replacement(match, ...captures, absolute, file)
    }

    //String replacement with $-pattern expansion
    return expandReplacement(replacement, parsed)
  }
}

/**
 * Helper to replace in a single file using streams (async), keeping memory
 * usage bounded regardless of file size
 */
export async function replaceStreamAsync(
  source: string, from: From | From[], to: To | To[], config: ParsedConfig
): Promise<ReplaceResult> {

  //Extract relevant config
  const {getTargetFile, encoding, dry, countMatches, maxMatchLength} = config

  //Resolve patterns, calling functions if given, and create a transform for
  //each from/to pair, chained in sequence like the buffered implementation
  const patterns = Array.isArray(from) ? from : [from]
  const transforms: ReplaceTransform[] = []
  for (const [i, item] of patterns.entries()) {
    const search = (typeof item === 'function') ? item(source) : item
    const replacement = getReplacement(to, i)
    if (replacement !== null) {
      transforms.push(new ReplaceTransform(search, replacement, source, maxMatchLength))
    }
  }

  //Prepare result
  const result: ReplaceResult = {file: source, hasChanged: false}
  if (countMatches) {
    result.numMatches = 0
    result.numReplacements = 0
  }

  //No replacements to make?
  if (transforms.length === 0) {
    return result
  }

  //Stream the source through the transforms
  const reader = createReadStream(source, {encoding})
  const target = getTargetFile(source)

  //Dry run? Consume the stream without writing anywhere
  if (dry) {
    const sink = new Writable({
      objectMode: true,
      write(_chunk, _encoding, callback) {
        callback()
      },
    })
    await pipeline(reader, ...transforms, sink)
  }

  //Otherwise, stream to a temporary file next to the target, then move it
  //into place, so the target is never left half written
  else {
    const suffix = crypto.randomBytes(6).toString('hex')
    const temp = `${target}.${suffix}.tmp`
    const writer = createWriteStream(temp, {encoding})
    try {
      await pipeline(reader, ...transforms, writer)
    }
    catch (error) {
      await rm(temp, {force: true})
      throw error
    }

    //Contents changed and not a dry run? Move into place, resolving symlinks
    //so we replace the linked file rather than the link, and preserving the
    //mode of an existing target
    if (transforms.some(transform => transform.hasReplaced)) {
      const real = await realpath(target).catch(() => target)
      const mode = await stat(real).then(s => s.mode).catch(() => null)
      if (mode !== null) {
        await chmod(temp, mode)
      }
      await rename(temp, real)
    }
    else {
      await rm(temp, {force: true})
    }
  }

  //Aggregate counters into the result
  result.hasChanged = transforms.some(transform => transform.hasReplaced)
  if (countMatches) {
    result.numMatches = transforms.reduce((sum, t) => sum + t.numMatches, 0)
    result.numReplacements = transforms.reduce((sum, t) => sum + t.numReplacements, 0)
  }

  //Return result
  return result
}
