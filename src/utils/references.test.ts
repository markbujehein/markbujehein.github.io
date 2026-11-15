import { expect, test } from "vitest";
import { type Part, assertReference, formatIeee, ieeeDate } from "./references";

const sciencedirect = {
  type: "encyclopedia",
  author: "Elsevier",
  title: "Inelastic Neutron Scattering",
  site: "ScienceDirect Topics",
  url: "https://www.sciencedirect.com/topics/physics-and-astronomy/inelastic-neutron-scattering",
  accessed: "2026-11-15",
} as const;

const plain = (parts: Part[]) =>
  parts.map((p) => ("text" in p ? p.text : "italic" in p ? p.italic : p.link)).join("");

test("IEEE dates abbreviate Jan., Feb., Aug., Sept., Oct., Nov., Dec. and spell out March to July", () => {
  expect(ieeeDate("2026-11-15")).toBe("Nov. 15, 2026");
  expect(ieeeDate("2026-09-01")).toBe("Sept. 1, 2026");
  expect(ieeeDate("2026-03-05")).toBe("March 5, 2026");
  expect(ieeeDate("2026-05-20")).toBe("May 20, 2026");
  expect(ieeeDate("2026-01-31")).toBe("Jan. 31, 2026");
});

test("an encyclopedia entry follows the IEEE online format", () => {
  expect(plain(formatIeee(sciencedirect))).toBe(
    "Elsevier, “Inelastic Neutron Scattering,” ScienceDirect Topics. [Online]. Available: " +
      "sciencedirect.com/topics/physics-and-astronomy/inelastic-neutron-scattering. [Accessed: Nov. 15, 2026].",
  );
});

test("the site name is italic and the URL is a link to the full address", () => {
  const parts = formatIeee(sciencedirect);
  expect(parts).toContainEqual({ italic: "ScienceDirect Topics" });
  expect(parts).toContainEqual({
    link: "sciencedirect.com/topics/physics-and-astronomy/inelastic-neutron-scattering",
    href: sciencedirect.url,
  });
});

test("a malformed reference is rejected with its key and the missing field", () => {
  expect(() => assertReference("bad", { type: "encyclopedia", author: "X" })).toThrow(/bad.*title/);
  expect(() => assertReference("odd", { type: "pamphlet" })).toThrow(/odd.*pamphlet/);
  expect(() => assertReference("date", { ...sciencedirect, accessed: "yesterday" })).toThrow(/date.*accessed/);
});
