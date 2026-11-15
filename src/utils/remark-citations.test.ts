import { createMarkdownProcessor } from "@astrojs/markdown-remark";
import { expect, test } from "vitest";
import type { Reference } from "./references";
import { remarkCitations } from "./remark-citations";

const entry = (title: string): Reference => ({
  type: "encyclopedia",
  author: "Elsevier",
  title,
  site: "ScienceDirect Topics",
  url: `https://www.sciencedirect.com/topics/${title.toLowerCase()}`,
  accessed: "2026-11-15",
});
const references = { a: entry("Alpha"), b: entry("Beta") };

const render = async (md: string) => {
  const processor = await createMarkdownProcessor({ remarkPlugins: [[remarkCitations, { references }]] });
  return (await processor.render(md)).code;
};

test("[@key] becomes a numbered [1] link that is not superscript", async () => {
  const html = await render("Neutrons scatter.[@a]");
  expect(html).toContain('<a class="cite" href="#ref-1">[1]</a>');
  expect(html).not.toContain("<sup");
});

test("the references list follows the text under a References heading", async () => {
  const html = await render("Text.[@a]");
  expect(html).toContain('<section class="references">');
  expect(html).toMatch(/<h2[^>]*>References<\/h2>/);
  expect(html).toContain('<li id="ref-1">');
  expect(html).toContain("Elsevier, “Alpha,” <em>ScienceDirect Topics</em>.");
});

test("numbers follow first appearance and a repeated key reuses its number", async () => {
  const html = await render("One.[@b] Two.[@a] Again.[@b]");
  expect(html.match(/href="#ref-1">\[1\]/g)).toHaveLength(2);
  expect(html).toContain('href="#ref-2">[2]');
  expect(html.match(/<li id=/g)).toHaveLength(2);
  expect(html.indexOf("Beta")).toBeLessThan(html.indexOf("Alpha"));
});

test("an unknown key fails the build and names the key", async () => {
  await expect(render("Text.[@missing]")).rejects.toThrow(/missing/);
});

test("a page without citations gets no references section", async () => {
  const html = await render("Plain text, and `[@a]` in code.");
  expect(html).not.toContain("references");
  expect(html).toContain("<code>[@a]</code>");
});
