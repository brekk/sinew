/* global test, expect */
import path from "path"
import { readFile } from "./io"
const here = (...x) => path.join(__dirname, ...x)

const jsonPkg = here("..", "package.json")

test("readFile", done => {
  readFile(jsonPkg).fork(done, raw => {
    expect(JSON.parse(raw)).toMatchSnapshot()
    done()
  })
})
