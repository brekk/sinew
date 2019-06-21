import {
  is,
  matches,
  testHook,
  testCLI,
  testCLIError,
  resolveFrom
} from "./testing"

test("resolveFrom", () => {
  const actual = resolveFrom(__dirname)("..", "package.json")
  const modified = actual.slice(
    actual.lastIndexOf("/", actual.lastIndexOf(`/`) - 1)
  )
  is("/sinew/package.json", modified)
})

test("testHook", done => {
  const x = Math.round(Math.random() * 1e3)
  const value = { cool: x }
  const property = "cool"
  const fn = actual => {
    is(actual, x)
  }
  testHook(property, done, fn, value)
})

testCLI(["nps"], "testCLI", actual => {
  matches(actual)
})
// not sure how best to test this yet, skipping
// testCLIError(["not-really-anything-at-all"], "testCLIError", actual => {
//   console.log(">", actual, "<")
//   is(actual, "<--")
// })
