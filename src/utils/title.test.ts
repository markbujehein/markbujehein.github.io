import { expect, test } from "vitest";
import { pageTitle } from "./title";

test("a subpage title gets the site name appended", () => {
  expect(pageTitle("cv", "Mark Buje Hein")).toBe("cv | Mark Buje Hein");
});

test("the home page title is the site name alone", () => {
  expect(pageTitle("Mark Buje Hein", "Mark Buje Hein")).toBe("Mark Buje Hein");
});
