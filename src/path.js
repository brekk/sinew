import path from "path"
import { curryN } from "ramda"

export const relativePathWithCWD = curryN(2, path.relative)
