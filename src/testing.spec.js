import { pipe } from "ramda"
import {
  is,
  matches,
  testHook,
  testCLI,
  testCommand,
  testShell,
  resolveFrom
} from "./testing"

const sliceFromSecondToLastSlash = x =>
  x.slice(x.lastIndexOf("/", x.lastIndexOf("/") - 1))

test("resolveFrom", () => {
  const actual = resolveFrom(__dirname)("..", "package.json")
  pipe(
    sliceFromSecondToLastSlash,
    is("/sinew/package.json")
  )(actual)
})

test("testHook", done => {
  const x = Math.round(Math.random() * 1e3)
  const value = { cool: x }
  const property = "cool"
  const fn = is(x)
  testHook(property, done, fn, value)
})

testCLI(["nps"], "testCLI", actual => {
  matches(actual)
})
testCommand(["nps"], matches)

testShell("echo cool", "testShell", is("cool"))

// not sure how best to test this yet, skipping
// testCLIError(["not-really-anything-at-all"], "testCLIError", actual => {
//   console.log(">", actual, "<")
//   is(actual, "<--")
// })
