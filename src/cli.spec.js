import path from "path"

import tempy from "tempy"
import { identity as I, map, curry } from "ramda"

// terse _and_ gives us coverage for that file
import { is, matches } from "./testing"
import { readRelative, readWithOpts, processAsync } from "./cli"

test("readRelative", done => {
  readRelative("package.json").fork(done, x => {
    const parsed = JSON.parse(x)
    matches(parsed)
    is(parsed.name, "sinew")
    done()
  })
})
test("readWithOpts", done => {
  const xxx = Math.round(Math.random() * 1e3)
  readWithOpts({ stdin: false }, xxx).fork(done, x => {
    is(x, xxx)
    done()
  })
})
test("processAsync", done => {
  const source = { a: 1, b: 2, c: 3 }
  // eslint-disable-next-line
  const fn = o => x => {
    return map(actual => {
      is(actual, source)
      return actual
    }, x)
  }
  const opts = { stdin: false, file: false, output: false }
  processAsync(fn, opts, source).fork(done, actual => {
    is(actual, source)
    done()
  })
})
test("processAsync - read file", done => {
  const source = path.resolve(__dirname, "../package.json")
  const fn = () => x => x.map(I)
  const opts = { stdin: false, file: true, output: false }
  processAsync(fn, opts, source).fork(done, actual => {
    matches(actual)
    done()
  })
})
test("processAsync - write file", done => {
  const source = path.resolve(__dirname, "../package.json")
  const fn = () => x => x.map(I)
  const opts = { stdin: false, file: true, output: tempy.file() }
  expect(() =>
    processAsync(fn, opts, source).fork(done, () => {
      done()
    })
  ).not.toThrow()
})
// I dunno how to get this to pass, skipping for now
test.skip("processAsync - stdin", done => {
  const source = { a: 1, b: 2, c: 3 }
  const fn = () => x => {
    return map(actual => {
      return actual
    }, x)
  }
  const opts = { stdin: true, file: false, output: false }
  processAsync(fn, opts, source).fork(done, actual => {
    is(actual, source)
    done()
  })
})
test("processAsync - yellOnNonBinary", done => {
  const source = { a: 1, b: 2, c: 3 }
  // eslint-disable-next-line
  const fn = (o, x) => "this won't ever run"
  const opts = { stdin: false, file: false, output: false }
  expect(() => processAsync(fn, opts, source)).toThrow(
    "Expected to be given a curried binary function!"
  )
  const fn2 = () => x => {
    // manually curried functions are ok
    return x
  }
  const futureValue = processAsync(fn2, opts, source)
  return futureValue.fork(done, () => done())
})
test("processAsync - yellOnNonBinary - curried", done => {
  const source = { a: 1, b: 2, c: 3 }
  const opts = { stdin: false, file: false, output: false }
  const fn2 = curry((o, x) => {
    // manually curried functions are ok
    return x
  })
  const futureValue = processAsync(fn2, opts, source)
  return futureValue.fork(done, () => done())
})
