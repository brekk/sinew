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

const [red, yellow, bold, underline] = [
  color.red,
  color.yellow,
  color.bold,
  color.underline
].map(z => withColor => (...x) => (withColor ? z : I)(...x))

const matchesTypeFromConfig = curry((config, type, x) =>
  pipe(
    propOr([], type),
    find(equals(x))
  )(config)
)

const flag = z => (stripAnsi(z).length === 1 ? `-` : `--`) + z
const flagify = curry((c, x) =>
  pipe(
    map(
      pipe(
        yellow(c),
        flag
      )
    ),
    join(", ")
  )(x)
)
export const wrapChars = curry((a, b) => a[0] + b + a[1])
export const getFlagInformation = conf =>
  pipe(
    path(["yargsOpts", "alias"]),
    toPairs,
    map(([k, v]) => ({ flags: [k, ...v], name: k })),
    reduce(({ raw, data }, y) => ({ raw, data: data.concat(y) }), {
      raw: conf,
      data: []
    }),
    w => {
      return map(x => {
        const matcher = matchesTypeFromConfig(w.raw.yargsOpts)
        const findFlag = t => (find(matcher(t), x.flags) ? t : false)
        const type = ["string", "boolean", "array", "number"]
          .map(findFlag)
          .find(I)
        if (type) x.type = type
        const description = pathOr("TBD", ["raw", "descriptions", x.name], w)
        if (description === "TBD")
          throw new Error(`${x.name} needs a description!`)
        if (description) x.description = description
        const def = pathOr(" ", ["raw", "yargsOpts", "default", x.name], w)
        if (def) x.default = def
        return x
      }, w.data)
    }
  )(conf)

export const helpWithOptions = curry((conf, argv) => {
  const ui = cliui()
  const flags = getFlagInformation(conf)
  ui.div(
    `\n${underline(argv.color)("Usage:")} ${bold(argv.color)(
      conf.name
    )} <flags> [input]\n`
  )
  ui.div(`${underline(argv.color)("Flags:")}\n`)
  flags.forEach(({ default: def, flags: tags, description, type }) =>
    ui.div(
      { text: flagify(argv.color, tags), padding: [0, 0, 1, 1], align: "left" },
      {
        text: pipe(
          red(argv.color),
          wrapChars(`[]`)
        )(type),
        width: 15,
        padding: [0, 1, 0, 1],
        align: "center"
      },
      { text: description, width: 36 },
      def !== " "
        ? { text: `(default: ${def})`, align: "right", padding: [0, 2, 0, 0] }
        : def
    )
  )
  return ui.toString()
})
