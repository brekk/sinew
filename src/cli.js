import F from "fluture"
import { curry, pipe, chain, identity as I } from "ramda"
import getStdin from "get-stdin"

// import { trace } from "xtrace"

import { relativePathWithCWD } from "./path"
import { readFile, writeFile } from "./io"

/**
 * Read a file but coerce the given path to be relative
 * @private
 * @method readRelative
 * @param {string} to - a path
 * @return {Future<string>} the value of a file
 */
export const readRelative = pipe(
  relativePathWithCWD(process.cwd()),
  readFile
)
/**
 * getStdin but Futures instead of Promises
 * @private
 * @method readStdin
 * @return {Future<string>} stdin wrapped in a Future
 */
export const readStdin = F.encaseP(getStdin)

/**
 * Read from stdin or wrap the second param with a Future
 * @private
 * @method readWithOpts
 * @param {object} opts - a config object
 * @param {boolean} opts.stdin - read from stdin?
 * @param {string} source - raw value
 * @return {Future<string>} a Future-wrapped string
 */
export const readWithOpts = curry((opts, source) =>
  // always return a future
  opts.stdin
    ? /* istanbul ignore next */
      readStdin() /* eslint-disable-line */
    : F.of(source)
)

/**
 * Return the function given or throw if it's not a binary function
 * NB: only active in non-production environments
 * @method ensureBinary
 * @param {function} fn - a function
 * @return {function}
 */
// sorry for being hetero-normative
const ensureBinary = fn => {
  /* istanbul ignore next */
  if (process.env.NODE_ENV !== "production") {
    if (typeof fn !== "function" || typeof fn("test") !== "function") {
      throw new TypeError("Expected to be given a curried binary function!")
    }
  }
  return fn
}

/**
 * Simplify the process of creating a Future-based command-line tool
 * @method processAsync
 * @param {function} fn - a binary future-processing function
 * @param {object} opts - an object of opts
 * @param {boolean} opts.file - read from a file?
 * @param {string} opts.output - the name of a file to write to
 * @param {string} source - an instruction to parse
 * @return {Future} a future value of an executable process
 * @example
 * import {processAsync} from "sinew"
 * import {pipe, map} from "ramda"
 * // ...
 * export const json2yaml = processAsync(
 *   curry((opts, source) =>
 *     pipe(
 *       chain(parseJSON),
 *       map(toYAML(opts))
 *     )(source)
 *   )
 *  )
 */
export const processAsync = curry((fn, opts, source) =>
  pipe(
    // read from a file || stdin || raw string
    opts.file ? readRelative : readWithOpts(opts),
    // process the Future value (remember to use `map` in most cases)
    ensureBinary(fn)(opts),
    // write to a file?
    opts.output ? chain(writeFile(opts.output)) : I
  )(source)
)
