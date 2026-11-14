# Content formats and the generated files

How the site reads its content, what the importer writes, and which behaviours were checked by running a build
(Pelican 4.12, 2026-11-14). Format documentation only; nothing private belongs here.

## Hand-maintained vs generated

| File | Owner |
|---|---|
| `content/pages/home.md`, `news.md`, `content/data/cv.yml`, `content/projects/*.md` listed in `content/.generated-manifest.json`, `content/pages/publications.bib`, the `status:` line of `publications.md` | **Generated** by `tools/import_site_data.py` from the source export. Do not edit by hand. |
| `config.yml`, `projects.md`, `cv.md`, `404.md`, images, theme, `py_code/`, tests, workflows | Hand-maintained |

The importer writes nothing else and deletes only files listed in the manifest. A project file that is not in the
manifest is never touched.

## The export (`schema/site-export.schema.json`, `schema_version: 1`)

Public by definition. Unknown keys are rejected. Summary:

- `profile`: `subtitle`, `bio_markdown`, optional `contact_line`, `location`, and `seeking` (`headline`, `detail`,
  optional `start`, `location`). `seeking` feeds the front-page hero.
- `news[]`: `date` (an **unquoted** YAML date, day precision) and `content` (markdown). Sorted newest first by the importer.
- `cv.general[]` and `cv.sections[]` of type `time_table`, `nested_list` or `list`.
- `projects[]`: `slug` (`[a-z0-9_-]`), `title`, `summary`, `category` (must be in `projects.md` `display_categories`),
  integer `importance`, `body_markdown`.
- `publications[]`: BibTeX-like entries; an empty list keeps the publications page hidden.

Gates (rule ids are reported with the JSON path, never the value): `schema-*`, `html`, `template`, `email`, `phone`,
`national-id`, `url-scheme`, `url-host`, `secret`, `control-char`, `multiline-plain-field`, `denylist`, `duplicate`,
`not-in-display_categories`, `unquoted-yaml-date-required`. The only address allowed in public output is the obfuscated
work address; the host allowlist is `ALLOWED_HOSTS` in the importer.

Plain-text fields are HTML-escaped (`&` only) because Jinja autoescape is off; markdown fields reject `<`, `{{`, `{%`
and `!TEMPLATE!`.

## Verified build behaviour

Each item below was run against a scratch copy of the site with `pelican content -s publishconf.py --fatal warnings`.

| Case | Result |
|---|---|
| Quoted news date (`date: "2026-10-01"`) | Build fails: `'str' object has no attribute 'strftime'` |
| CV section `type: list_groups` | Build fails: `'len' is undefined` |
| Project without `importance` | Build fails: `KeyError: 'importance'` |
| Mixed int/str `importance` | Build fails: `TypeError` in the sort |
| `category` given as a list | Build fails (warning made fatal) |
| Empty `cv.yml` | Build fails: `'NoneType' object is not iterable` |
| Body starting with `Note: text` | **Not reproduced**: the text is kept (the earlier suspicion was wrong) |

Not yet run: `status: hidden/draft` behaviour, whether the publications intro body renders (the template prints
`{{ content }}`, not `page.content`), and PAT-created PRs triggering CI.

## Front page

`home.md` uses template `about`. When `hero:` is present the page shows the hero, then "who I am" (the bio), "what I
have done" (the three projects with the lowest `importance`), "what I can do" (the first `nested_list` CV section) and
news. Without `hero:` the original header is used. Hero fields: `headline`, `detail`, optional `start`, `location`,
`contact`; absent fields render nothing. The buttons link to `cv/` and `projects/` through `relative_url`, the same
pages the navigation bar uses. The contact line stays plain text in its obfuscated form on purpose: no `mailto:` link.

## Local preview

`publishconf.py` writes absolute `https://markbujehein.github.io/...` stylesheet URLs, so a production build previewed
locally shows the live site's CSS. Preview with the dev settings: `pixi run build` then serve `output/`.
