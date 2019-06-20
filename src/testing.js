import path from "path"
import execa from "execa"
import { curry, pipe, prop } from "ramda"

// import { trace } from "xtrace"

export const is = curry((expected, actual) => expect(actual).toEqual(expected))
export const matches = x => expect(x).toMatchSnapshot()

export const testHook = curry((property, done, fn, x) =>
  pipe(
    prop(property),
    fn,
    () => done()
  )(x)
)

export const testHookStdout = testHook("stdout")
export const testHookStderr = testHook("stderr")

export const testCLI = curry(([exe, ...args], testName, fn) => {
  test(testName, done =>
    execa(exe, args)
      .catch(done)
      .then(testHookStdout(done, fn))
  )
})

export const testCLIError = curry(([exe, ...args], testName, fn) => {
  test(testName, done => execa(exe, args).catch(testHookStderr(done, fn)))
})

export const resolveFrom = dir => (...x) => path.resolve(dir, ...x)
