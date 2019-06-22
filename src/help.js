import cliui from "cliui"
import color from "kleur"
import {
  curry,
  find,
  equals,
  identity as I,
  join,
  map,
  path,
  pathOr,
  pipe,
  propOr,
  reduce,
  toPairs
} from "ramda"
import stripAnsi from "strip-ansi"
// import { trace } from "xtrace"

// wrap the color functions with a guard which tests config.color before use
const [red, yellow, bold, underline] = [
  color.red,
  color.yellow,
  color.bold,
  color.underline
].map(z => withColor => (...x) => (withColor ? z : I)(...x))

/**
 * A utility function for matching yargs-parser types
 * @private
 * @method matchesTypeFromConfig
 * @param {object} config - a config object
 * @param {string} type - a yargs-parser type: one of string | boolean | array | number
 * @param {*} x - something to compare to
 * @return {boolean}
 */
export const matchesTypeFromConfig = curry((config, type, x) =>
  pipe(
    propOr([], type),
    find(equals(x))
  )(config)
)

/**
 * A utility function for generating flags
 * @private
 * @method flag
 * @param {string} z - a string
 * @return {string} flags
 */
export const flag = z => (stripAnsi(z).length === 1 ? `-` : `--`) + z

/**
 * A utility function for converting an array of strings into a string of flags
 * @private
 * @method flagify
 * @param {boolean} useColors - should we generate colored flags
 * @param {string[]} flags - an array of flag names
 * @return {string}
 */
export const flagify = curry((useColors, flags) =>
  pipe(
    map(
      pipe(
        yellow(useColors),
        flag
      )
    ),
    join(", ")
  )(flags)
)
/**
 * A utility function for wrapping a string with another string or an array of strings
 * @private
 * @method wrapChars
 * @param {string[]|string} a - something to wrap with
 * @param {*} b - something to wrap
 * @return {string}
 */
export const wrapChars = curry((a, b) => a[0] + b + a[1])

const TYPES = ["string", "boolean", "array", "number"]

/**
 * A utility function for throwing when w.raw.descriptions[x.name] doesn't exist
 * @private
 * @method getRawDescriptionsOrThrow
 * @param {object} w - a configuration object
 * @param {object} x - a specific flag object
 * @param {string} x.name - a string
 * @return {string}
 */
export const getRawDescriptionsOrThrow = curry((w, x) =>
  pipe(
    pathOr("TBD", ["raw", "descriptions", x.name]),
    d => {
      if (d === "TBD") {
        throw new Error(`${x.name} needs a description!`)
      }
      return d
    }
  )(w)
)
/**
 * A utility function for grabbing w.raw.yargsOpts.default[x.name]
 * @private
 * @method getDefaults
 * @param {object} w - a configuration object
 * @param {object} x - a specific flag object
 * @param {string} x.name - a string
 * @return {string}
 */
export const getDefaults = curry((w, x) =>
  pathOr(" ", ["raw", "yargsOpts", "default", x.name], w)
)

/**
 * If a given flag has a type, find it
 * @private
 * @method getType
 * @param {object} w - a configuration object
 * @param {object} x - a specific flag object
 * @param {string[]} x.flags - an array of flags
 * @return {string} type
 */
const getType = curry((w, x) => {
  const matcher = matchesTypeFromConfig(w.raw.yargsOpts)
  const findFlag = t => (find(matcher(t), x.flags) ? t : false)
  const type = TYPES.map(findFlag).find(I)
  return type
})

/**
 * Automagically insert type information from yargs-parser object
 * @private
 * @method convertFlag
 * @param {object} w - a configuration object
 * @param {object} x - a specific flag object
 * @return {object} an updated flag object
 */
export const convertFlag = curry((w, x) => {
  // historically these were guarded assignments,
  // we should update the test cases to make sure we can't
  // fall into an unsafe case
  const type = getType(w, x)
  const description = getRawDescriptionsOrThrow(w, x)
  const def = getDefaults(w, x)
  return Object.assign({}, x, { type, description, default: def })
})

/**
 * A utility function for getting flag information from a yargs-parser config
 * @private
 * @method getFlagInformation
 * @param {object} conf - a configuration object
 * @return {object} flag information
 */
export const getFlagInformation = conf =>
  pipe(
    path(["yargsOpts", "alias"]),
    toPairs,
    map(([k, v]) => ({ flags: [k, ...v], name: k })),
    reduce(({ raw, data }, y) => ({ raw, data: data.concat(y) }), {
      raw: conf,
      data: []
    }),
    w => map(convertFlag(w), w.data)
  )(conf)

/**
 * A utility function for default values
 * @private
 * @method getDefaultDiv
 * @param {string} def - a default value for a given flag
 * @return {object|string} the default value or a cliui div
 */
const getDefaultDiv = def =>
  def !== " "
    ? { text: `(default: ${def})`, align: "right", padding: [0, 2, 0, 0] }
    : def

/**
 * Convert a yargs-parser object and a config into a help string
 * @public
 * @method helpWithOptions
 * @param {object} conf - a configuration object
 * @param {object} argv - a yargs-parser parsed argv
 * @return {string} formatted string
 */
export const helpWithOptions = curry((conf, argv) => {
  const { color: useColors } = argv
  const ui = cliui()
  const flags = getFlagInformation(conf)
  ui.div(
    `\n${underline(useColors)("Usage:")} ${bold(useColors)(
      conf.name
    )} <flags> [input]\n`
  )
  ui.div(`${underline(useColors)("Flags:")}\n`)
  flags.forEach(({ default: def, flags: tags, description, type }) =>
    ui.div(
      { text: flagify(useColors, tags), padding: [0, 0, 1, 1], align: "left" },
      {
        text: pipe(
          red(useColors),
          wrapChars(`[]`)
        )(type),
        width: 15,
        padding: [0, 1, 0, 1],
        align: "center"
      },
      { text: description, width: 36 },
      getDefaultDiv(def)
    )
  )
  return ui.toString()
})
