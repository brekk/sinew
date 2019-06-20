import F from "fluture"
import { curry, pipe, chain, identity as I } from "ramda"
import getStdin from "get-stdin"

// import { trace } from "xtrace"

import { relativePathWithCWD } from "./path"
import { readFile, writeFile } from "./io"

const readRelative = pipe(
  relativePathWithCWD(process.cwd()),
  readFile
)

// getStdin.fork(good, bad)
const readStdin = F.encaseP(getStdin)
// always return a future
const readWithOpts = curry((opts, source) =>
  opts.stdin ? readStdin() : F.of(source)
)

/**
 * @method processAsync
 * @param {function} fn - a future-processing function
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
 *       trace("j2y"),
 *       chain(parseJSON),
 *       map(toYAML(opts))
 *     )(source)
 *   )
 *  )
 */
export const processAsync = curry((fn, opts, source) =>
  pipe(
    opts.file ? readRelative : readWithOpts(opts),
    fn(opts),
    opts.output ? chain(writeFile(opts.output)) : I
  )(source)
)
