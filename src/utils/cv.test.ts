import { expect, test } from "vitest";
import { decodeEntities } from "./cv";

test("decodeEntities turns &amp; into &", () => {
  expect(decodeEntities("Data Analysis &amp; Modelling")).toBe("Data Analysis & Modelling");
});

test("decodeEntities leaves other entities alone", () => {
  expect(decodeEntities("&lt;b&gt;")).toBe("&lt;b&gt;");
});
