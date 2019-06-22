import resolve from "rollup-plugin-node-resolve"
import cjs from "rollup-plugin-commonjs"
import babel from "rollup-plugin-babel"
import cleanup from "rollup-plugin-cleanup"
import json from "rollup-plugin-json"
import progress from "rollup-plugin-progress"
// import prepack from "rollup-plugin-prepack"
import pkg from "./package.json"

const plugins = (preferBuiltins = true) => [
  progress(),
  json(),
  cjs({ extensions: [`.js`], include: `node_modules/**` }),
  babel(),
  resolve({ mainFields: ["module", "main"], preferBuiltins }),
  cleanup({ comments: `none` })
]

const external =
  [
    ...Object.keys(pkg.dependencies),
    ...Object.keys(pkg.peerDependencies || {}),
    "path",
    "fs"
  ] || []

const individual = (file, preferBuiltins = true) => ({
  input: `src/${file}`,
  external,
  output: [{ file, format: `cjs` }],
  plugins: plugins(preferBuiltins)
})

export default [
  {
    input: `src/index.js`,
    external,
    output: [
      { file: pkg.main, format: `cjs` },
      { file: pkg.module, format: `es` }
    ],
    plugins: plugins()
  },
  individual(`cli.js`),
  individual(`help.js`),
  individual(`io.js`),
  individual(`log.js`),
  individual(`path.js`),
  individual(`testing.js`)
]
