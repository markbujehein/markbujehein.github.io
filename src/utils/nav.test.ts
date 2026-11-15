import { expect, test } from "vitest";
import { navState } from "./nav";

test("exact page gets 'page'", () => {
  expect(navState("/projects/", "/projects/")).toBe("page");
  expect(navState("/", "/")).toBe("page");
});

test("a page inside a section gets 'true', not 'page'", () => {
  expect(navState("/projects/hall_bar/", "/projects/")).toBe("true");
});

test("unrelated pages and the home link on other pages get undefined", () => {
  expect(navState("/cv/", "/projects/")).toBeUndefined();
  expect(navState("/cv/", "/")).toBeUndefined();
});
