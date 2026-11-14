import { afterEach, expect, test } from "vitest";
import { formatNewsDate, isoDate } from "./date";

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

test("isoDate gives YYYY-MM for month-only items and YYYY-MM-DD otherwise", () => {
  const d = new Date("2026-10-01T00:00:00Z");
  expect(isoDate(d, true)).toBe("2026-10");
  expect(isoDate(d, false)).toBe("2026-10-01");
});
