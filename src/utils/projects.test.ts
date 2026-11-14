import { expect, test } from "vitest";
import { groupByCategory, sortByImportance } from "./projects";

const entry = (id: string, importance: number, category = "research") => ({
  id,
  data: { importance, category },
});

test("sortByImportance orders ascending and leaves the input untouched", () => {
  const input = [entry("c", 3), entry("a", 1), entry("b", 2)];
  expect(sortByImportance(input).map((e) => e.id)).toEqual(["a", "b", "c"]);
  expect(input.map((e) => e.id)).toEqual(["c", "a", "b"]);
});

test("groupByCategory groups entries in the given category order", () => {
  const groups = groupByCategory(
    [entry("a", 1, "software"), entry("b", 2, "research"), entry("c", 3, "software")],
    ["research", "software"],
  );
  expect([...groups.keys()]).toEqual(["research", "software"]);
  expect(groups.get("software")?.map((e) => e.id)).toEqual(["a", "c"]);
});

test("groupByCategory throws and names the entry and category for an unlisted category", () => {
  expect(() => groupByCategory([entry("x", 1, "talks")], ["research", "software"])).toThrow(
    /x.*talks/,
  );
});
