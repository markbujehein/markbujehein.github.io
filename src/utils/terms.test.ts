import { expect, test } from "vitest";
import { markTerms } from "./terms";

test("marks a listed abbreviation and keeps the surrounding text", () => {
  expect(markTerms("INS, QENS and NPD", ["INS", "NPD"])).toEqual([
    { term: "INS" },
    { text: ", QENS and " },
    { term: "NPD" },
  ]);
});

test("handles terms joined by a slash", () => {
  expect(markTerms("SAXS/WAXS", ["SAXS", "WAXS"])).toEqual([
    { term: "SAXS" },
    { text: "/" },
    { term: "WAXS" },
  ]);
});

test("does not match inside longer words", () => {
  expect(markTerms("INSIGHT into BINS", ["INS"])).toEqual([{ text: "INSIGHT into BINS" }]);
});

test("is case-sensitive, so 'ins' in prose stays text", () => {
  expect(markTerms("the ins and outs", ["INS"])).toEqual([{ text: "the ins and outs" }]);
});

test("returns the whole text when there are no terms or no matches", () => {
  expect(markTerms("plain text", [])).toEqual([{ text: "plain text" }]);
  expect(markTerms("plain text", ["INS"])).toEqual([{ text: "plain text" }]);
});

test("marks every occurrence", () => {
  expect(markTerms("INS then INS", ["INS"])).toEqual([
    { term: "INS" },
    { text: " then " },
    { term: "INS" },
  ]);
});
