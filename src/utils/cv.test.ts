import { expect, test } from "vitest";
import { decodeEntities, sortByOrder } from "./cv";

test("decodeEntities turns &amp; into &", () => {
  expect(decodeEntities("Data Analysis &amp; Modelling")).toBe("Data Analysis & Modelling");
});

test("decodeEntities leaves other entities alone", () => {
  expect(decodeEntities("&lt;b&gt;")).toBe("&lt;b&gt;");
});

test("sortByOrder restores file order and leaves the input untouched", () => {
  const input = [{ data: { order: 2 } }, { data: { order: 0 } }, { data: { order: 1 } }];
  expect(sortByOrder(input).map((e) => e.data.order)).toEqual([0, 1, 2]);
  expect(input.map((e) => e.data.order)).toEqual([2, 0, 1]);
});
