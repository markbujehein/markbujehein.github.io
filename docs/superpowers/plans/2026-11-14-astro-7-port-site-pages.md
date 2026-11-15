# Port the Site Pages to Astro 7 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Learning project:** `~/Projects/CLAUDE.md` says the user learns by writing code by hand. The user decides per task whether they write it (Claude explains and reviews) or Claude does. Ask before each task.

**Goal:** Every page of the current Pelican site exists on Astro 7 with the same content, using the new hero and a plain shell (nav, footer) that the later design pass restyles.

**Architecture:** Content lives in Astro content collections (`projects` and `news` as Markdown via `glob()`, `home` as one Markdown entry, `cv` as one YAML file via `file()`), validated by Zod schemas. Pages are `.astro` files. Pure helpers (`date`, `projects`, `cv`) are unit-tested with Vitest. The page shell takes its values from `src/config/site.ts`.

**Tech Stack:** Astro 7.4, TypeScript 7.1 beta + `@astrojs/ts-content-mapper`, Vitest (added in Task 1), pnpm 12.18.0 via mise.

**Spec:** `docs/superpowers/specs/2026-11-14-astro-7-migration-design.md` (phase 3). Later plans: importer retarget (phase 4), site-wide design and interactivity (phase 5), cutover (phase 6).

**Reference only (not copied):** as-folio (`dadangnh/as-folio`) for ideas: `src/components/cv/CVSection.astro` and `CVEntry.astro` (CV rendering), `src/components/projects/ProjectCard.astro`, `src/pages/projects/[slug].astro`, `src/components/Navbar.astro`, `src/components/Footer.astro`, `src/utils/cv.ts`, `src/utils/date.ts`. Its v6 pins, Tailwind and persona strings are not taken over.

## Global Constraints

- Static output, `site: "https://markbujehein.github.io"`, no `base`; URLs end in `/` (`/cv/`, `/projects/`, `/projects/<slug>/`, `/news/`).
- Nav items, in order: about (`/`), projects (`/projects/`), cv (`/cv/`). Same labels as the live site, lowercase.
- Contact line stays plain text in its obfuscated form (`mark.sorensen [at] nbi.ku.dk`): no `mailto:` link, no real address anywhere in the output.
- Pages with `status: skip` today (talks, teaching, publications) are not built. Publications comes back with the BibTeX loader when there is something to list.
- Home sections, in order: hero, "who I am" (bio), "what I have done" (the three projects with the lowest `importance`), "what I can do" (the first `nested_list` CV section), news.
- Markdown renders through Astro's built-in processor (Sätteri); no remark/rehype plugins.
- `pnpm run check` and `pnpm run build` pass after every task.
- Source files to port are the generated ones in `content/` (pages, projects, `data/cv.yml`, `images/`, `pdf/cv.pdf`). They are copied mechanically; the importer is retargeted in the next plan, so do not hand-edit content beyond what a task states.

## Review Focus

- `cv.yml` titles contain `&amp;` (the Pelican importer escaped `&` for Jinja). Astro escapes again, so the page would show `&amp;`. Expect `Data Analysis & Modelling Group Intern`.
- News items are month-only (`2026-10-01` with `month_only: true`). Expect "Oct 2026", not a day.
- `img:` is empty on projects; the card and page must render without an image, with no broken `<img>`.
- A project whose `category` is not in `[research, software]` must fail the build, not vanish silently.
- A CV section with an unknown `type` must fail the build with the section title in the message.
- Dates are `YYYY-MM-DD` at UTC midnight; formatting must not shift to the previous month in negative-offset timezones.

---

### Task 1: Add Vitest

**Files:**
- Modify: `package.json` (devDependency `vitest`, script `test`)
- Create: `vitest.config.ts`, `src/utils/smoke.test.ts` (deleted again in Task 3)

- [ ] **Step 1: Install** with `mise exec -- pnpm add -D vitest`; expected: `vitest` in `devDependencies`.
- [ ] **Step 2: Add** `"test": "vitest run"` to `scripts`; `vitest.config.ts` uses `getViteConfig` from `astro/config` with `test.include: ["src/**/*.test.ts"]`.
- [ ] **Step 3: Write** `smoke.test.ts` asserting `1 + 1 === 2`; run `pnpm test`; expected: 1 passed.
- [ ] **Step 4: Run** `pnpm run check`; expected: no errors (Vitest types resolve under TS 7.1).
- [ ] **Step 5: Commit** `Add Vitest`.

### Task 2: Site config and page shell

**Files:**
- Create: `src/config/site.ts`, `src/components/Nav.astro`, `src/components/Footer.astro`
- Modify: `src/layouts/Base.astro` (render `Nav`, `<slot />`, `Footer`)

**Interfaces:**
- Produces: `site: { title: string; author: string; url: string; description: string; nav: { label: string; href: string }[]; footer: string }` exported from `src/config/site.ts`. `Base` keeps its props (`title`, `description?`) and now also renders the shell.

- [ ] **Step 1: Define `site`** with the values from `content/config.yml` (title "Mark Buje Hein", description, the three nav entries, footer text "Design based on al-folio adapted for Pelican." replaced by "Built with Astro.").
- [ ] **Step 2: Build `Nav.astro`** (a `<nav aria-label="Main">` with a link per `site.nav` entry; current page marked `aria-current="page"` using `Astro.url.pathname`) and `Footer.astro`.
- [ ] **Step 3: Verify** `pnpm run build`; open `dist/index.html`; expected: three nav links, the hero, and the footer.
- [ ] **Step 4: Commit** `Add site config, nav and footer`.

### Task 3: Content collections and helpers

**Files:**
- Create: `src/content.config.ts`, `src/utils/date.ts`, `src/utils/projects.ts`, `src/utils/cv.ts` and a `*.test.ts` beside each
- Create (copied): `src/content/projects/*.md` from `content/projects/*.md`; `src/content/news/YYYY-MM.md` (one file per entry of `content/pages/news.md`, body = the entry's `content`, frontmatter `date`, `monthOnly: true`); `src/content/home/index.md` (frontmatter `subtitle`, `hero` from `home.md`; body = the bio); `src/data/cv.yml` from `content/data/cv.yml`; `src/assets/profile.jpg` from `content/images/profile.jpg`; `public/pdf/cv.pdf` from `content/pdf/cv.pdf`
- Delete: `src/utils/smoke.test.ts`

**Interfaces:**
- Produces: `formatNewsDate(date: Date, monthOnly: boolean): string`; `sortByImportance<T extends { data: { importance: number } }>(entries: T[]): T[]` (ascending, does not mutate); `groupByCategory<T extends { data: { category: string } }>(entries: T[], categories: readonly string[]): Map<string, T[]>` (throws `Error` naming the entry id and category when a category is not listed); `decodeEntities(text: string): string` (turns `&amp;` into `&`; nothing else).
- Produces: collections `projects`, `news`, `home` (glob) and `cv` (file loader on `src/data/cv.yml`, each section `id` = slugified title). `cv` section schema: discriminated union on `type`: `map` `{ contents: { name, value }[] }`, `nested_list` `{ contents: { title, elements: string[] }[] }`, `time_table` `{ contents: { title, year, institution?, description: string[] }[] }`, `list` `{ contents: string[] }`; every string passes through `decodeEntities` (`z.string().transform(decodeEntities)`).
- Project schema: `title`, `summary`, `category: z.enum(["research", "software"])`, `importance: z.number().int()`, `img: z.string().nullish()`; `template` ignored.

- [ ] **Step 1: Write failing tests**: `formatNewsDate(new Date("2026-10-01"), true) === "Oct 2026"`; `formatNewsDate(new Date("2026-10-01"), false) === "1 Oct 2026"`; run with `TZ=America/Los_Angeles` and expect the same strings; `sortByImportance` orders `[3,1,2]` as `[1,2,3]` and leaves its input untouched; `groupByCategory` throws for category `"talks"` with the entry id in the message; `decodeEntities("A &amp; B") === "A & B"` and `decodeEntities("&lt;") === "&lt;"`.
- [ ] **Step 2: Run** `pnpm test`; expected: FAIL (modules missing).
- [ ] **Step 3: Implement** the four helpers (use `Intl.DateTimeFormat("en-GB", { timeZone: "UTC", ... })` so the month never shifts).
- [ ] **Step 4: Run** `pnpm test`; expected: all PASS.
- [ ] **Step 5: Copy the content files** listed above with `cp`; define `src/content.config.ts` with the schemas.
- [ ] **Step 6: Verify** `pnpm run check && pnpm run build`; expected: both succeed; a one-off edit of a project's `category` to `talks` makes the build fail (revert it).
- [ ] **Step 7: Commit** `Add content collections, helpers and copied content`.

### Task 4: Home page

**Files:**
- Modify: `src/pages/index.astro`
- Create: `src/components/ProjectList.astro`, `src/components/CVNested.astro`, `src/components/NewsList.astro`

**Interfaces:**
- Consumes: Task 3 collections and helpers.
- Produces: `ProjectList` (props `{ projects: CollectionEntry<"projects">[] }`), `CVNested` (props `{ section: Extract<CVSection, { type: "nested_list" }> }`), `NewsList` (props `{ items: CollectionEntry<"news">[] }`, newest first, dates via `formatNewsDate`).

- [ ] **Step 1: Replace the hardcoded hero props** in `index.astro` with values from the `home` entry (`hero.headline`, `hero.detail`, `hero.start`, `hero.contact`, `hero.linkedin`, `subtitle` as `role`).
- [ ] **Step 2: Render the sections** in the order given under Global Constraints, with the bio from the `home` body and the profile photo via `astro:assets` `<Image>`.
- [ ] **Step 3: Verify** `pnpm run build`; in `dist/index.html` expect: "Hire a physicist.", three project links, "Oct 2026", and no `mailto:`.
- [ ] **Step 4: Commit** `Build the home page from collections`.

### Task 5: Projects index and detail pages

**Files:**
- Create: `src/pages/projects/index.astro`, `src/pages/projects/[slug].astro`
- Modify: `src/components/ProjectList.astro` (reuse for the index, grouped)

**Interfaces:**
- Consumes: `groupByCategory`, `sortByImportance`; produces routes `/projects/` and `/projects/<id>/` for each of the seven projects.

- [ ] **Step 1: Build the index**: categories in the order `research`, `software`, each a heading plus entries sorted by importance, each linking to its page.
- [ ] **Step 2: Build the detail page** with `getStaticPaths()` over the collection, `render(entry)` for the body, and a back link to `/projects/`.
- [ ] **Step 3: Verify** `pnpm run build`; expected: `dist/projects/index.html` and seven `dist/projects/*/index.html`; no `<img` element for a project without `img`.
- [ ] **Step 4: Commit** `Add the projects pages`.

### Task 6: CV page

**Files:**
- Create: `src/pages/cv/index.astro`, `src/components/cv/CVSection.astro`

**Interfaces:**
- Consumes: `cv` collection; renders each section by `type` (`map` as a definition list, `nested_list` via `CVNested`, `time_table` as entries with year, title, institution, description bullets, `list` as a bullet list). A section title is its heading with a stable `id` for an on-page table of contents (a left-hand list of section links).

- [ ] **Step 1: Render** every section in file order with a table of contents at the top; link the PDF at `/pdf/cv.pdf` labelled "Download CV (PDF)".
- [ ] **Step 2: Verify** `pnpm run build`; in `dist/cv/index.html` expect "Data Analysis & Modelling Group Intern" (single `&`) and all 13 section headings.
- [ ] **Step 3: Commit** `Add the CV page`.

### Task 7: News archive and 404

**Files:**
- Create: `src/pages/news/index.astro`, `src/pages/404.astro`

- [ ] **Step 1: Build `/news/`** from `NewsList` (all items, newest first) and a plain 404 page with a link home.
- [ ] **Step 2: Verify** `pnpm run build`; expected: `dist/news/index.html` and `dist/404.html` exist.
- [ ] **Step 3: Commit** `Add the news archive and 404 page`.

### Task 8: Output check

**Files:**
- Modify: `package.json` (script `check:output`)

- [ ] **Step 1: Add** `"check:output": "python -I tools/check_output.py dist https://markbujehein.github.io"` (reuses the existing Python link checker).
- [ ] **Step 2: Run** `pnpm run build && pnpm run check:output`; expected: exit 0 with no broken internal links. If the checker's template-leftover patterns (`{{`, `{%`) fire on Astro output, narrow only those patterns and say so in the commit.
- [ ] **Step 3: Commit** `Check built links with the existing output checker`.

---

## Self-Review

- **Spec coverage:** content pages, home sections, PDF, news and 404 are covered; talks, teaching and publications are explicitly out (status `skip`). Importer, design and cutover are later plans.
- **Type consistency:** helper names and signatures are defined once (Task 3) and used unchanged in Tasks 4-6.
- **Proportion:** eight tasks for seven page types; code appears only as signatures and assertions.
- **Open for the user:** the news date format "1 Oct 2026" (day-month-year) is my call; the Pelican theme's day format was not checked.
