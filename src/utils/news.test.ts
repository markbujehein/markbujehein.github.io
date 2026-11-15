import { expect, test } from "vitest";
import { latest } from "./news";

const item = (id: string, date: string) => ({ id, data: { date: new Date(date) } });

test("latest returns the newest items first, capped at the limit, without mutating the input", () => {
  const input = [item("a", "2026-06-01"), item("c", "2026-10-01"), item("b", "2026-08-01")];
  expect(latest(input, 2).map((e) => e.id)).toEqual(["c", "b"]);
  expect(input.map((e) => e.id)).toEqual(["a", "c", "b"]);
});

test("latest returns everything when there are fewer items than the limit", () => {
  expect(latest([item("a", "2026-06-01")], 5)).toHaveLength(1);
});
