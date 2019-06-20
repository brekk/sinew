import debug from "debug"
import { taggedSideEffect, scopedSideEffect } from "xtrace"
import { pipe } from "ramda"

const make = maker => name => {
  const tagger = debug(name)
  // debug.enable(`*`)
  return maker(tagger)
}

export const makeTracer = make(taggedSideEffect)
export const makeInspector = pipe(
  k => `inspector:${k}`,
  make(scopedSideEffect)
)
