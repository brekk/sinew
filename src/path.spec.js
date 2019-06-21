import { relativePathWithCWD } from "./path"

test("relativePathWithCWD", () => {
  const x = relativePathWithCWD(__dirname, "..")
  expect(
    relativePathWithCWD(__dirname, "..").slice(x.lastIndexOf("/"))
  ).toEqual("/..")
})
