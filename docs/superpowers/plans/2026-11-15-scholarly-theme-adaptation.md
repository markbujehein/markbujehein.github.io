# Adapt the Scholarly Theme to the Hero Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the whole Astro site with the layout, components and design-token system of the Scholarly theme, recoloured and re-toned to match the hero.

**Architecture:** Scholarly's ~300 lines of UnoCSS shortcuts become Tailwind 4 `@theme` tokens plus `@utility` classes in `src/styles/global.css`. Its palette (`paper`/`ink`/`accent`) is replaced by the hero palette. Its filter bar becomes the first Preact island. Content stays on our collections and importer; none of Scholarly's YAML/BibTeX content model is adopted.

**Tech Stack:** Astro 7.4, Tailwind CSS 4, Preact 11 (`@astrojs/preact`), Vitest 5, Oxlint, Oxfmt, Prettier (`.astro`).

**Spec:** `docs/superpowers/specs/2026-11-14-astro-7-migration-design.md` (phase 5, "Site-wide design aligned to the hero, then the interactive elements").

**Reference (read-only, not vendored):** `https://github.com/jxpeng98/astro-theme-scholars` v0.9.0, MIT, © 2025 Jiaxin Peng. A local clone for reading lives outside the repo.

## Global Constraints

- Hero palette is fixed: `#14092e` (ink), `#f4f1fa` (paper), `#fe9f6d` (accent); heading font Source Serif 4 (`--font-serif`). The hero component itself is not restyled.
- Tailwind CSS 4 only. No UnoCSS, no Scholarly runtime code or icon CDN (`esm.sh`) copied in.
- MIT notice: ported styling/markup keeps Scholarly's copyright and licence text in `THIRD_PARTY_NOTICES.md`.
- Text contrast at least 4.5:1 (WCAG AA) in both light and dark themes.
- The contact line stays plain obfuscated text: no `mailto:`, no real address.
- Islands are Preact `.tsx` components: `tsc` (TS 7) checks their internals and their props at every call site; no shims or sidecar files (verified in a scratch copy).
- `pnpm run check`, `lint`, `format:check`, `test`, `build`, `check:output` all pass at the end of every task.
- Dev toolbar stays dev-only (`devToolbar.enabled: true`; never in `dist/`).

## Review Focus

- Dark and light themes: no text pair below 4.5:1; no flash of the wrong theme on first load or after a view transition.
- Filter island with JavaScript disabled: every project is still listed (filter is progressive enhancement).
- Tailwind Preflight: bullets, heading sizes and link underlines in Markdown bodies (project pages, news items, bio) still look right.
- Keyboard: skip link, focus ring on every filter button, nav and jump-nav links; filter status announced (`aria-live`).
- `prefers-reduced-motion`: no card lift, no scroll animation, view transitions fall back to instant.

---

### Task 1: Design tokens from the hero palette

**Files:**
- Create: `src/utils/contrast.ts`, `src/utils/contrast.test.ts`
- Modify: `src/styles/global.css`, `src/layouts/Base.astro`

**Interfaces:**
- Produces: `contrastRatio(a: string, b: string): number` (hex in, WCAG ratio out); CSS tokens `--color-ink-{50..950}`, `--color-paper-{50..950}`, `--color-accent-{50..950}`, `--font-heading`, `--font-body`; a `dark` custom variant keyed on `[data-theme="dark"]` and `prefers-color-scheme`.

- [ ] **Step 1: Failing test.** In `contrast.test.ts`: `contrastRatio("#000000","#ffffff")` equals 21; `contrastRatio("#14092e","#f4f1fa")` is at least 12; ink-on-paper and paper-on-ink body text pairs from the token table are each at least 4.5.
- [ ] **Step 2:** Run `pnpm test`. Expected: FAIL, `contrastRatio` not defined.
- [ ] **Step 3:** Implement `contrastRatio` (relative luminance per WCAG 2.x).
- [ ] **Step 4:** Define the three 50–950 scales in `global.css` under `@theme`, anchored on the hero hexes (ink-950 `#14092e`, paper-50 `#f4f1fa`, accent-400 `#fe9f6d`); derive the rest by lightness steps and check every text/background pair in the test.
- [ ] **Step 5:** Register body font Atkinson Hyperlegible through the `fonts` config (Fontsource, same as Source Serif 4); map `--font-heading`/`--font-body` with `@theme inline`.
- [ ] **Step 6:** Add the `dark` variant and an inline, blocking theme script in `Base.astro` (`data-theme` from `localStorage` else system) that also re-applies on `astro:after-swap`.
- [ ] **Step 7:** Run all checks. Expected: pass. Commit "Add hero-based design tokens and dark mode".

### Task 2: Component classes ported from Scholarly's shortcuts

**Files:**
- Modify: `src/styles/global.css`
- Create: `THIRD_PARTY_NOTICES.md`

**Interfaces:**
- Produces: utilities `page-stack`, `page-header`, `page-title`, `page-description`, `body-copy`, `section-heading`, `entry-title`, `entry-supporting`, `entry-summary`, `entry-meta`, `entry-index`, `surface-card`, `surface-card-hover`, `prose-site` (for rendered Markdown).

- [ ] **Step 1:** Translate each Scholarly shortcut (`uno.config.ts` lines ~105–300) to a Tailwind 4 `@utility`, swapping palette names and dropping `glass-*` blur except for the header.
- [ ] **Step 2:** Define `prose-site` to restore list bullets, heading scale, link underline and spacing for Markdown bodies (Preflight removes them).
- [ ] **Step 3:** Write `THIRD_PARTY_NOTICES.md` with the Scholarly MIT text and copyright line.
- [ ] **Step 4:** Add each class once to a temporary page, run `pnpm run build`, assert each class name appears in the built CSS, then remove the temporary page. Run all checks. Commit "Port the Scholarly component classes to Tailwind 4".

### Task 3: Site shell

**Files:**
- Modify: `src/layouts/Base.astro`, `src/components/Nav.astro`, `src/components/Footer.astro`
- Create: `src/components/ThemeToggle.tsx`, `src/components/PageJumpNav.astro`, `src/components/SkipLink.astro`

**Interfaces:**
- Consumes: `navState` from `src/utils/nav.ts`; `site` from `src/config/site.ts`.
- Produces: `PageJumpNav` props `{ items: { id: string; label: string }[] }`.

- [ ] **Step 1:** Header with blurred chrome, nav (keeps `aria-current` logic), theme toggle island with `transition:persist`; skip link as first focusable element; footer restyled.
- [ ] **Step 2:** `ThemeToggle.tsx` is a Preact island with `client:load`.
- [ ] **Step 3:** `PageJumpNav` ported from Scholarly (28 lines), scroll-spy via `IntersectionObserver`, re-initialised on `astro:page-load`.
- [ ] **Step 4:** Verify in a browser: toggle persists across a view transition, skip link reaches `main`. Run all checks. Commit "Add the site shell".

### Task 4: Home page sections

**Files:**
- Modify: `src/pages/index.astro`, `src/components/ProjectList.astro`, `src/components/NewsList.astro`, `src/components/CVNested.astro`

- [ ] **Step 1:** Restyle the four sections ("who I am", "what I have done", "what I can do", "news") with `page-stack`, `section-heading`, `surface-card-hover` project cards and `entry-*` news rows. Keep the hero untouched.
- [ ] **Step 2:** Wrap the bio and news bodies in `prose-site`.
- [ ] **Step 3:** Browser check at 375 px and 1280 px, light and dark; all checks; commit "Restyle the home sections".

### Task 5: Projects page and the filter island

**Files:**
- Create: `src/utils/filter.ts`, `src/utils/filter.test.ts`, `src/components/ProjectFilter.tsx`
- Modify: `src/pages/projects/index.astro`

**Interfaces:**
- Produces: `filterProjects<T extends { data: { category: string } }>(items: T[], category: string): T[]` (`"all"` returns everything, in input order, without mutating); `ProjectFilter` props `{ categories: { id: string; label: string; count: number }[] }`.

- [ ] **Step 1: Failing tests.** `filterProjects(items,"all")` returns all items in order; `"research"` returns only research items; an unknown category returns an empty array; the input array is not mutated.
- [ ] **Step 2:** Run `pnpm test`. Expected: FAIL.
- [ ] **Step 3:** Implement `filterProjects`.
- [ ] **Step 4:** Build `ProjectFilter.tsx` (Preact hooks) from Scholarly's `FilterBar`: buttons with `aria-pressed`, counts, `aria-live` status. The list is server-rendered with `data-category`; the island toggles `hidden`. With JavaScript off, all projects show.
- [ ] **Step 5:** Render each project as a `surface-card-hover` with its category. Browser check including a JS-disabled load; all checks; commit "Add the projects filter island".

### Task 6: CV page

**Files:**
- Modify: `src/pages/cv/index.astro`, `src/components/cv/CVSection.astro`, `src/components/CVNested.astro`

- [ ] **Step 1:** Replace the plain contents list with `PageJumpNav` (sticky left on wide screens, horizontal chips on narrow); sections as `surface-card` blocks with `entry-*` rows for time-table entries; PDF button styled as the accent action.
- [ ] **Step 2:** Verify the 13 headings still appear in file order with a single `&` in titles; all checks; commit "Restyle the CV page".

### Task 7: News, project detail and 404

**Files:**
- Create: `src/components/DetailShell.astro`
- Modify: `src/pages/news/index.astro`, `src/pages/projects/[slug].astro`, `src/pages/404.astro`

**Interfaces:**
- Produces: `DetailShell` props `{ title: string; backHref: string; backLabel: string }` with a default slot.

- [ ] **Step 1:** Port `DetailShell` (159 lines in Scholarly) cut down to header, back link and `prose-site` body; use it for project pages; restyle news archive and 404.
- [ ] **Step 2:** Add `<meta name="description">` per page and the site name to every `<title>`; all checks; commit "Restyle detail pages".

### Task 8: Polish and audit

**Files:**
- Modify: as findings require.

- [ ] **Step 1:** Remove leftover hard-coded colours from scoped `<style>` blocks.
- [ ] **Step 2:** Run a Lighthouse audit (accessibility and best practices at least 95) on `/`, `/projects/`, `/cv/` in both themes; fix findings.
- [ ] **Step 3:** Verify `prefers-reduced-motion` (no lift, no scroll animation) in the browser.
- [ ] **Step 4:** All checks; commit "Polish and accessibility pass".

### Task 9: KaTeX math in Markdown (from Academic Pages Astro)

**Reference:** `https://github.com/arghyadipchak/academicpages-astro` v0.6.1, MIT (© Stuart Geiger, Michael Rose). Its `astro.config.ts` uses `markdown.processor: unified({ remarkPlugins: [remarkMath], rehypePlugins: [rehypeKatex] })` and imports `katex/dist/katex.min.css`.

**Files:**
- Create: `src/utils/markdown.test.ts`
- Modify: `astro.config.mjs`, `src/styles/global.css`, `package.json`, `THIRD_PARTY_NOTICES.md`

**Interfaces:**
- Consumes: Markdown bodies of `home`, `projects`, `news` (all rendered through the configured processor).
- Produces: inline `$...$` and display `$$...$$` math rendered at build time (no client JavaScript).

- [ ] **Step 1: Failing test.** `markdown.test.ts` renders `"Energy $E=mc^2$ and\n\n$$\\int_0^1 x\\,dx$$"` with `createMarkdownProcessor` from `@astrojs/markdown-remark` using the same remark/rehype plugins as the config; asserts the HTML contains `class="katex"` and `class="katex-display"`, and that plain text without `$` is unchanged.
- [ ] **Step 2:** Run `pnpm test`. Expected: FAIL (plugins not installed or not configured).
- [ ] **Step 3:** `pnpm add @astrojs/markdown-remark remark-math rehype-katex katex`; set `markdown.processor` to `unified({ remarkPlugins: [remarkMath], rehypePlugins: [rehypeKatex] })`; import `katex/dist/katex.min.css` in `global.css`; add dark-mode contrast and horizontal scroll for `.katex-display` (as the reference does).
- [ ] **Step 4:** Confirm the existing Markdown (7 projects, 4 news, bio) still builds with identical text (the processor switches from Sätteri to unified, so diff `dist/` text before and after). Add a sample formula to one scratch page, check it renders, remove it.
- [ ] **Step 5:** Run all checks; add the Academic Pages Astro MIT notice to `THIRD_PARTY_NOTICES.md` if any code or CSS was copied; commit "Add KaTeX math support".

## Other ideas seen in Academic Pages Astro (not scheduled; pick any)

Cmd/Ctrl+K search (Pagefind), RSS feed, per-page Open Graph images, Google Scholar citation meta tags (needs publications), sitemap, viewport prefetch (`prefetch: { prefetchAll: true, defaultStrategy: 'viewport' }`), external-link and table-wrapper rehype plugins.
