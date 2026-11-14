import { afterEach, expect, test } from "vitest";
import { formatNewsDate } from "./date";

const originalTZ = process.env.TZ;
afterEach(() => {
  process.env.TZ = originalTZ;
});

test("month-only news date shows month and year", () => {
  expect(formatNewsDate(new Date("2026-10-01"), true)).toBe("Oct 2026");
});

test("full news date shows day, month and year", () => {
  expect(formatNewsDate(new Date("2026-10-01"), false)).toBe("1 Oct 2026");
});

test("the month does not shift in a timezone behind UTC", () => {
  process.env.TZ = "America/Los_Angeles";
  expect(formatNewsDate(new Date("2026-10-01"), true)).toBe("Oct 2026");
  expect(formatNewsDate(new Date("2026-10-01"), false)).toBe("1 Oct 2026");
});
