import fs from "graceful-fs"
import { node } from "fluture"
import { curry, curryN, __ as $, pipe } from "ramda"

// async - future-producing

/**
 * fs.readFile but curried
 * @method readRaw
 * @public
 * @param {string} path - path-to-a-file
 * @param {string} format - file format
 * @param {function} callback - standard nodeback style callback
 * @return null
 * @example
 * import { readRaw } from "sinew"
 * import { pipe, map, __ as skip } from "ramda"
 * import { node } from "fluture"
 *
 * export readFileAndDoStuff = pipe(
 *   pipe(
 *     readRaw(skip, 'utf8'),
 *     node
 *   ),
 *   map(x => "preamble:\n" + x)
 * )
 */
export const readRaw = curryN(3, fs.readFile)
/**
 * fs.readFile but curried and with utf8 format chosen
 * @method readUTF8
 * @public
 * @param {string} path - path-to-a-file
 * @param {function} callback - a node-style nodeback function
 * @return {string} a future value of a string
 * @example
 * import { readUTF8 } from "sinew"
 * import { pipe, map, __ as skip } from "ramda"
 * import { node } from "fluture"
 *
 * export readFileAndDoStuff = pipe(
 *   pipe(
 *     readUTF8(skip),
 *     node
 *   ),
 *   map(x => "preamble:\n" + x)
 * )
 */
export const readUTF8 = readRaw($, `utf8`)

/**
 * fs.readFile but utf8 and returning a Future
 * @method readFile
 * @public
 * @param {string} path - path-to-a-file
 * @return {Future<string>} a future value of a string
 * @example
 * import { readFile } from "sinew"
 * import { pipe, map } from "ramda"
 *
 * export readFileAndDoStuff = pipe(
 *   readFile,
 *   map(x => "preamble:\n" + x)
 * )
 */
export const readFile = pipe(
  readUTF8,
  node
)

/**
 * fs.readFile but curried; arity 4
 * @method writeRaw
 * @public
 * @param {string} path - path-to-a-file
 * @param {*} data - data to write to a path
 * @param {string|object} format - format or opts
 * @param {function} callback - a nodeback-style callback function
 * @example
 * import {writeRaw} from "sinew"
 * writeRaw("my-file.md", "cool", "utf8", (e) => {
 *   if(e) console.warn(e)
 *   // done
 * })
 */
export const writeRaw = curryN(4, fs.writeFile)

/**
 * fs.readFile but curried; format utf8
 * @method writeRaw
 * @public
 * @param {string} path - path-to-a-file
 * @param {*} data - data to write to a path
 * @param {function} callback - a nodeback-style callback function
 * @example
 * import { writeUTF8 } from "sinew"
 *
 * writeUTF8('my-file.md', 'cool', (e) => {
 *   if(e) console.warn(e)
 *   // done
 * })
 */
export const writeUTF8 = writeRaw($, $, `utf8`)

/**
 * Write a utf8 file and wrap the action in a future
 * @method writeFile
 * @public
 * @param {string} to - path-to-a-file
 * @param {string} data - data to write
 * @return {Future<string>} a future-wrapped value(?)
 * @example
 * import { writeFile, readFile } from "sinew"
 * import { curry, pipe, map, chain } from "ramda"
 *
 * const prepend = curry((pre, file, data) => pipe(
 *   readFile(file),
 *   map(raw => pre = raw),
 *   chain(writeFile)
 * ))
 */
export const writeFile = curry((to, data) =>
  pipe(
    writeUTF8(to),
    node
  )(data)
)
