import { createMarkdownProcessor } from "@astrojs/markdown-remark";
import { expect, test } from "vitest";
import { rehypePlugins, remarkPlugins } from "./markdown-plugins";

const render = async (md: string) => {
  const processor = await createMarkdownProcessor({ remarkPlugins, rehypePlugins });
  return (await processor.render(md)).code;
};

test("inline math renders to KaTeX markup", async () => {
  expect(await render("Energy $$E=mc^2$$ here.")).toContain('class="katex"');
});

test("display math renders to a KaTeX display block", async () => {
  expect(await render("$$\n\\int_0^1 x\\,dx\n$$")).toContain('class="katex-display"');
});

test("text without math and a lone currency sign are left alone", async () => {
  const html = await render("It costs 5 dollars, or $5 today.");
  expect(html).not.toContain("katex");
  expect(html).toContain("$5 today");
});

test("two dollar amounts in one paragraph are not turned into math", async () => {
  const html = await render("Tickets cost $5 and $10 at the door.");
  expect(html).not.toContain("katex");
  expect(html).toContain("$5 and $10");
});

test("invalid TeX fails the build instead of shipping a red error", async () => {
  await expect(render("Broken $$\\frac{1$$ formula.")).rejects.toThrow();
});

test("tables are wrapped so a wide table scrolls instead of widening the page", async () => {
  const html = await render("| a | b |\n|---|---|\n| 1 | 2 |\n");
  expect(html).toContain('<div class="table-wrap"><table>');
});
