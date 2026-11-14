import { expect, test } from "vitest";
import { pageTitle } from "./title";

test("a subpage title gets the site name appended", () => {
  expect(pageTitle("cv", "Mark B.H. Sørensen")).toBe("cv | Mark B.H. Sørensen");
});

test("the home page title is the site name alone", () => {
  expect(pageTitle("Mark B.H. Sørensen", "Mark B.H. Sørensen")).toBe("Mark B.H. Sørensen");
});
