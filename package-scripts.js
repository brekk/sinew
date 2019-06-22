const utils = require("nps-utils")
const pkg = require("./package.json")
const { concurrent, series } = utils
const { nps: npsAll } = concurrent

const name = pkg.name

// const seriesNPS = (...x) => `nps ` + x.join(` && nps `)
const sd = (script, description) =>
  description ? { script, description } : script

const SKIP_DEPCHECK_FOR = [
  `@babel/cli`,
  `@babel/core`,
  `@babel/plugin-transform-destructuring`,
  `@babel/preset-env`,
  `babel-core`,
  `babel-eslint`,
  `babel-jest`,
  `depcheck`,
  `documentation`,
  `docusaurus`,
  `husky`,
  `jest`,
  `prettier-eslint`,
  `rollup`,
  `nps`
]
const inner = 'map(y => y.replace(/`/g, "\\\\`"))'

module.exports = {
  scripts: {
    dependencies: sd(
      `depcheck --specials=bin,eslint,babel --ignores=${SKIP_DEPCHECK_FOR}`,
      `check dependencies`
    ),
    readme: sd(
      `documentation readme -s "API" src/**.js --access public`,
      `regenerate the readme`
    ),
    lint: {
      description: `lint both the js and the jsdoc`,
      script: npsAll(`lint.src`, `lint.jsdoc`),
      src: sd(`eslint src/*.js --env jest --fix`, `lint js files`),
      jsdoc: sd(`documentation lint src/*/*.js`, `lint jsdoc in files`)
    },
    test: {
      script: `NODE_ENV=test jest --verbose --coverage`,
      description: `run all tests with coverage`,
      watch: `NODE_ENV=test jest --verbose --coverage --watchAll`
    },
    docs: {
      description: `auto regen the docs`,
      script: `documentation build src/**.js -f html -o docs`,
      serve: sd(`documentation serve src/**.js`, `serve the documentation`)
    },
    bundle: sd(`rollup -c rollup.config.js`, `generate bundles`),
    // build: sd(
    //   series(
    //     `babel src -d . --ignore src/*.spec.js,src/*.fixture.js,src/index.js`
    //   ),
    //   `convert files individually`
    // ),
    care: sd(
      series(
        // `nps build`,
        `nps bundle`,
        npsAll(`docs`, `lint`, `test`, `readme`, `dependencies`)
      ),
      `run all the things`
    ),
    generate: `nps bundle`
  }
}
