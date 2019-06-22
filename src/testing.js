import path from "path"
import execa from "execa"
import { curry, pipe, prop } from "ramda"

// import { trace } from "xtrace"

/**
 * expect(actual).toEqual(expected) but curried
 * @method is
 * @public
 * @param {*} expected - an expected value
 * @param {*} actual - the actual value
 * @return {boolean}
 */
export const is = curry((expected, actual) => expect(actual).toEqual(expected))

/**
 * expect(actual).toMatchSnapshot alias as a unary function
 * @method matches
 * @public
 * @param {*} x - a value
 * @return {boolean} a boolean value
 */
export const matches = x => expect(x).toMatchSnapshot()

/**
 * A utility function for running assertions and then calling done
 * @private
 * @param {string} property - a property to pull off of the given value
 * @param {function} done - a function to call when everything is done
 * @param {function} assertion - a function to do your assertions
 * @param {*} x - a value to pass through the test
 */
export const testHook = curry((property, done, assertion, x) =>
  pipe(
    prop(property),
    assertion,
    () => done()
  )(x)
)

export const testHookStdout = testHook("stdout")
export const testHookStderr = testHook("stderr")

/**
 * A simplified way of testing asynchronous command-line calls using execa.shell
 * Designed for jest testing
 * @method testCLI
 * @public
 * @param {string[]} cli - commands and flags to pass to execa
 * @param {string} testName - the name of your test
 * @param {function} assertion - an assertion function. receives actual value as only param
 */
export const testShell = curry((cmd, testName, assertion) => {
  test(testName, done => {
    execa
      .shell(cmd)
      .catch(done)
      .then(testHookStdout(done, assertion))
  })
})

/**
 * A simplified way of testing asynchronous command-line calls
 * Designed for jest testing
 * @method testCLI
 * @public
 * @param {string[]} cli - commands and flags to pass to execa
 * @param {string} testName - the name of your test
 * @param {function} assertion - an assertion function. receives actual value as only param
 */
export const testCLI = curry(([exe, ...args], testName, assertion) => {
  test(testName, done =>
    execa(exe, args)
      .catch(done)
      .then(testHookStdout(done, assertion))
  )
})

// not sure how to test this yet, so commented out for now
// export const testCLIError = curry(([exe, ...args], testName, fn) => {
//   test(testName, done =>
//     execa(exe, args)
//       .catch(done)
//       .then(testHookStderr(done, fn))
//   )
// })

export const resolveFrom = dir => (...x) => path.resolve(dir, ...x)

export const testCommand = curry((args, assertion) =>
  testCLI(args, args.join(" "), assertion)
)
