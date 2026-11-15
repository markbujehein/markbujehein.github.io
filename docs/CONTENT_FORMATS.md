# Content formats and the generated files

How the site reads its content and what the importer writes. Format documentation only; nothing private belongs here.

## Hand-maintained vs generated

| File | Owner |
|---|---|
| `src/content/home/index.md`, `src/data/cv.yml`, `src/content/news/*.md` and `src/content/projects/*.md` listed in `src/content/.generated-manifest.json` | **Generated** by `tools/import_site_data.py` from the source export. Do not edit by hand. |
| Everything else in `src/`, `public/`, `notebooks/`, workflows | Hand-maintained. A project file that is not in the manifest (for example an `.mdx` page) is never touched or deleted. |

The CV PDF is not part of the default run. `--pdf` builds it with lualatex into `public/pdf/cv.pdf`.

## What the export becomes

- `profile` becomes `src/content/home/index.md`: `subtitle` and `hero` in the front matter, `bio_markdown` as the body.
- `news[]` becomes one file per item, `src/content/news/<date>.md`. A month-only date (`2026-05`) is written as
  `date: 2026-05-01` with `monthOnly: true`, so the site shows "May 2026" and no invented day.
- `cv` becomes `src/data/cv.yml`. Each section gets an `id` (the slugified title) and an `order`.
- `projects[]`: `slug` (`[a-z0-9_-]`), `title`, `summary`, `category` (`research` or `software`),
  integer `importance`, `body_markdown`.
- `publications[]`: validated, but not rendered: the site has no publications page.

Gates (rule ids are reported with the JSON path, never the value): `schema-*`, `html`, `template`, `email`, `phone`,
`national-id`, `url-scheme`, `url-host`, `secret`, `control-char`, `multiline-plain-field`, `denylist`, `duplicate`,
`not-in-display_categories`, `invalid-date`. The only address allowed in public output is the obfuscated
work address; the host allowlist is `ALLOWED_HOSTS` in the importer.

Plain-text fields are HTML-escaped (`&` only) because Jinja autoescape is off; markdown fields reject `<`, `{{`, `{%`
and `!TEMPLATE!`.

## Front page

`src/content/home/index.md` feeds the hero: `headline`, `detail`, optional `start`, `contact`, `linkedin`. The contact
line stays plain text in its obfuscated form on purpose: no `mailto:` link. "What I can do" is the first `nested_list`
CV section; technical abbreviations in it link to the glossary pages in `src/content/skills/`.

## Build checks

The `home`, `news`, `projects` and `cv` collections in `src/content.config.ts` validate every generated file when
Astro builds; a file that breaks the schema fails the build. Earlier checks of the retired Pelican build are in
`_archive/pelican/`.

## Math in Markdown

Inline math is `$$E=mc^2$$`; a block is `$$` on its own lines. A single `$` is plain text, so prices like "$5 and $10" are safe. Invalid TeX fails the build.
