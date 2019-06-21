import { red, yellow } from "kleur"

import {
  convertFlag,
  flag,
  flagify,
  getDefaults,
  getFlagInformation,
  getRawDescriptionsOrThrow,
  helpWithOptions,
  matchesTypeFromConfig,
  wrapChars
} from "./help"

import { CONFIG } from "./yargs.fixture"

test("matchesTypeFromConfig", () => {
  const x = Math.round(Math.random() * 1e3)
  const config = { cool: [x, 1, 2, 3] }
  const type = "cool"
  expect(matchesTypeFromConfig(config, type, x)).toEqual(x)
})
test("matchesTypeFromConfig - or", () => {
  const x = Math.round(Math.random() * 1e3)
  const config = { notCool: [x, 1, 2, 3] }
  const type = "cool"
  expect(matchesTypeFromConfig(config, type, x)).toBeFalsy()
})

test("flag", () => {
  const coolFlag = `--cool`
  expect(flag("cool")).toEqual(coolFlag)
  expect(flag("c")).toEqual(`-c`)
  expect(flag(red(`cool`))).toEqual(`--` + red(`cool`))
  expect(flag(red(`c`))).toEqual(`-` + red(`c`))
})
test("flagify", () => {
  const input = ["whoa", "how", "cool"]
  const flagged = flagify(true, input)
  expect(flagged).toEqual(
    `--${yellow("whoa")}, --${yellow("how")}, --${yellow("cool")}`
  )
})
test("wrapChars", () => {
  expect(wrapChars(["->", "<-"], ` xxx `)).toEqual(`-> xxx <-`)
  expect(wrapChars(`^$`, `xxx`)).toEqual(`^xxx$`)
})
test(`getFlagInformation - empty`, () => {
  const config = {}
  const actual = getFlagInformation(config)
  expect(actual).toEqual([])
})
test(`getFlagInformation`, () => {
  const actual = getFlagInformation(CONFIG)
  expect(actual).toEqual([
    {
      flags: ["file", "f"],
      name: "file",
      type: "boolean",
      description: "read from the file system",
      default: " "
    },
    {
      flags: ["help", "h"],
      name: "help",
      type: "boolean",
      description: "get help",
      default: " "
    },
    {
      flags: ["output", "o"],
      name: "output",
      type: "string",
      description: "write to the file system",
      default: " "
    },
    {
      flags: ["to", "t"],
      name: "to",
      type: "string",
      description: "set output format",
      default: " "
    },
    {
      flags: ["color", "k"],
      name: "color",
      type: "boolean",
      description: "use --no-color to turn colors off",
      default: true
    },
    {
      flags: ["verbose", "v"],
      name: "verbose",
      type: "number",
      description: "set verbosity 1 - 3",
      default: " "
    }
  ])
})

test("helpWithOptions", () => {
  const actual = helpWithOptions(CONFIG, true)
  const actualN = actual.split("\n")
  expect(actualN[0]).toEqual("")
  expect(actualN[1]).toEqual("Usage: yamfist <flags> [input]")
  expect(actualN[2]).toEqual("")
  expect(actualN[3]).toEqual("Flags:")
  expect(actualN[4]).toEqual("")
  expect(actualN[5]).toEqual(
    " --file, -f      [boolean]    read from the file system"
  )
  expect(actualN[6]).toEqual("")
  expect(actualN[7]).toEqual(" --help, -h      [boolean]    get help")
  expect(actualN[8]).toEqual("")
  expect(actualN[9]).toEqual(
    " --output, -o    [string]     write to the file system"
  )
  expect(actualN[10]).toEqual("")
  expect(actualN[11]).toEqual(" --to, -t        [string]     set output format")
  expect(actualN[12]).toEqual("")
  expect(actualN[13]).toEqual(
    " --color, -k     [boolean]    use --no-color to turn colors off      (default:"
  )
  expect(actualN[14].trim()).toEqual("true)")
  expect(actualN[15]).toEqual(
    " --verbose, -v   [number]     set verbosity 1 - 3"
  )
})
test("getRawDescriptionsOrThrow - throws", () => {
  const w = { raw: { descriptions: {} } }
  const x = { name: "cool" }
  expect(() => getRawDescriptionsOrThrow(w, x)).toThrow(
    `cool needs a description!`
  )
})
test("getRawDescriptionsOrThrow", () => {
  const cool = Math.round(Math.random() * 1e3)
  const w = { raw: { descriptions: { cool } } }
  const x = { name: "cool" }
  const actual = getRawDescriptionsOrThrow(w, x)
  const expected = cool
  expect(actual).toEqual(expected)
})

test("getDefaults - no match", () => {
  const actual = getDefaults({}, { name: 234234 })
  expect(actual).toEqual(" ")
})
test("getDefaults", () => {
  const cool = Math.round(Math.random() * 1e3)
  const actual = getDefaults(
    {
      raw: {
        yargsOpts: { default: { cool } }
      }
    },
    { name: "cool" }
  )
  expect(actual).toEqual(cool)
})

test("convertFlag", () => {
  const w = {
    raw: {
      yargsOpts: { boolean: [`a`] },
      descriptions: {
        automatic: "so cool"
      }
    }
  }
  const x = { flags: ["automatic", `a`], name: `automatic` }
  const actual = convertFlag(w, x)
  const expected = {
    default: " ",
    description: "so cool",
    flags: ["automatic", "a"],
    name: "automatic",
    type: "boolean"
  }
  expect(actual).toEqual(expected)
})
