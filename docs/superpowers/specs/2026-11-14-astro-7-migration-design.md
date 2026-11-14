# Migrate markbujehein.github.io from Pelican to Astro 7

Status: **draft, awaiting approval.** Nothing is scaffolded yet. Branch: `feat/astro-7`.

## Intent

Move the personal academic site from Pelican (Python, Jinja port of al-folio) to Astro 7, so the site is fast, modern,
beautiful and can have interactive elements. The existing hero is the visual anchor: the rest of the site is
redesigned later to match it. The content and spirit of the current site carry over; the old visuals do not.

## Goals

- Same pages and content as today: home, news, CV (with PDF), projects, talks, teaching, publications (hidden until
  there is something to list).
- Hero rebuilt as an Astro component, keeping its look (fixed palette `#14092e` / `#f4f1fa` / `#fe9f6d`, Source Serif 4,
  diffraction-ring motif) and its fields (`headline`, `detail`, `start`, `location`, `contact`, buttons to CV and
  projects, optional LinkedIn).
- Static output on GitHub Pages at `https://markbujehein.github.io` (user site, so no `base`).
- The generated-content pipeline keeps working: `tools/import_site_data.py`, `schema/site-export.schema.json` and its
  safety gates stay as they are; only the files it writes change.

## Non-goals

- No visual carry-over from al-folio except the hero.
- No SSR adapter: nothing on the site needs a server (my call; revisit if server features are wanted).
- No Vite+ (dropped by the user). Oxlint, Oxfmt and Vitest are added later, one at a time, as plain dev dependencies.
- No blog, books shelf, people or comments in the first pass (not on the current site).

## Constraints

- Astro 7 (`astro@7.x`; 7.0.0 released 2026-06-22). Node >= 22.23.4; local Node is 26.13.0.
- Astro 7 specifics that bite: stricter Rust compiler (unclosed tags fail), Sätteri is the default Markdown pipeline
  (remark/rehype plugins need porting or `unified()` + `@astrojs/markdown-remark`), `compressHTML: 'jsx'` strips
  whitespace between inline elements, `src/fetch.ts` is reserved.
- Integrations must match Astro 7 (`@astrojs/mdx` 8.x has peer `astro ^7`). Do not copy as-folio's v6 pins.
- Project rule (`~/Projects/CLAUDE.md`): this is the user's learning project. Claude explains, reviews and runs checks;
  it asks before writing the code the user would want to write by hand.
- Python importer: its 78 tests keep passing, or are updated with the output change.

## Approaches considered

1. **Fork as-folio.** Fastest to features (search, BibTeX, CV, collections), but v6 pins, a generic persona template,
   and rules (no `dark:`, no hardcoded strings) that fight a hero-first design. Rejected.
2. **Fresh Astro 7 project, borrowing ideas from as-folio.** More to write, but one coherent design and nothing to
   strip out. Recommended and chosen by the user's direction ("migrate the spirit and content, keep only the hero").
3. **Keep Pelican, add a JS pipeline for interactivity.** Two toolchains for one site. Rejected.

## Stack (proposed calls, not yet approved)

- `mise.toml`: Node, pnpm and Python/uv (for the importer) pinned. pnpm via `corepack`/mise, not Vite+.
- `pnpm create astro` scaffold, Astro 7, TypeScript strict, static output.
- Content: Astro content collections. `glob()` loader for project/news Markdown, one YAML entry for the CV, a small
  custom loader for BibTeX (not built in). Zod schemas mirror `schema/site-export.schema.json`.
- Styling: scoped CSS with custom properties; the hero palette becomes the base tokens. No Tailwind unless it earns it.
- Interactivity: Astro islands, framework chosen per feature (plain TypeScript first). The hero's diffraction rings are
  the first candidate for a live canvas.
- Deploy: `withastro/action` on GitHub Pages, replacing the Pelican workflow at cutover.
- Tooling later: `astro check` first, then Oxlint, Oxfmt, Vitest, added one at a time.
- pnpr (pnpm registry server): optional; install needs the pnpm global bin dir on PATH. Small gain for one developer.

## Phases

1. Scaffold + toolchain (mise, Astro 7, `astro check`, CI build). Page shell only.
2. Hero component (palette, type, motif, fields, buttons).
3. Content pages from the existing files (home, news, CV + PDF, projects, talks, teaching, publications).
4. Importer retarget: write collection files instead of Pelican files; update its tests and `docs/CONTENT_FORMATS.md`.
5. Site-wide design aligned to the hero, then the interactive elements.
6. Cutover: swap the deploy workflow, retire Pelican code, update the README. The workflow must cache and restore
   `node_modules/.astro/` between builds, or incremental builds (enabled in `astro.config.mjs`) re-render every page.

## Left to the builder

Exact component split, the BibTeX loader details, the interactive element list (open question to the user), and how the
Python importer is invoked from the new toolchain.

## Phase 1 result (2026-11-14)

Scaffolded by hand (`mise.toml`, `package.json`, `astro.config.mjs`, `tsconfig.json`, `src/pages/index.astro`).
Installed: Node 24.22.3, pnpm 12.18.0, pnpr 0.1.0-alpha.20 (via mise), astro 7.4.12, @astrojs/check 0.9.12.
**TypeScript is pinned to 6.x**: `astro check` refuses TypeScript 7 ("does not currently support TypeScript 7.0") and
says it will be deprecated; the replacement is the experimental `@astrojs/ts-content-mapper` (needs TypeScript 7.1+).
Revisit when moving to TS 7. `pnpm run check` and `pnpm run build` both pass (0 errors, 1 page).

## Open items

- Astro docs MCP is added to Claude Code config but its tools only load after a session restart; until then Astro docs
  are read via `docs.astro.build`.
- pnpr: not installed (`pnpm add -g @pnpm/pnpr@next` failed: global bin dir not on PATH).
- Which interactive elements the user wants beyond the hero.
