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
 * @param {string} path-to-a-file
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
 * fs.readFile but returning a Future
 * @method readFile
 * @public
 * @param {string} path-to-a-file
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

export const writeRaw = curryN(4, fs.writeFile)
export const writeUTF8 = writeRaw($, $, `utf8`)

export const writeFile = curry((to, data) =>
  pipe(
    writeUTF8(to),
    // node(done => fs.writeFile(to, data, `utf8`, done))
    node
  )(data)
)
