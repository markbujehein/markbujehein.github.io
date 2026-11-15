import { expect, test } from "vitest";
import { filterProjects } from "./filter";

const item = (id: string, category: string) => ({ id, data: { category } });
const items = [item("a", "research"), item("b", "software"), item("c", "research")];

test("'all' returns every item in the original order", () => {
  expect(filterProjects(items, "all").map((i) => i.id)).toEqual(["a", "b", "c"]);
});

test("a category returns only its items, in order", () => {
  expect(filterProjects(items, "research").map((i) => i.id)).toEqual(["a", "c"]);
});

test("an unknown category returns nothing", () => {
  expect(filterProjects(items, "talks")).toEqual([]);
});

test("the input array is not mutated", () => {
  const copy = [...items];
  filterProjects(items, "software");
  expect(items).toEqual(copy);
});
