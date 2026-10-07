# markbujehein.github.io

Source for the personal academic website of **Mark B.H. Sørensen**, published at
<https://markbujehein.github.io>. It is a static site built with [Pelican](https://getpelican.com/) (Python)
and a Jinja port of the [al-folio](https://github.com/alshedivat/al-folio) theme.

The site presents a profile and bio, news, a CV, and a list of research and software projects.
A publications page is included but hidden until there is something to list.

## Credits

- **[al-folio](https://github.com/alshedivat/al-folio)** by Maruan Al-Shedivat and contributors is the original
  Jekyll (Ruby) theme this site's design comes from.
- The Pelican/Jinja port of al-folio (`al_folio_theme/` and the helper code in `py_code/`) is the work of
  Vivek Bharadwaj, whose own site, <https://vivek-bharadwaj.com>, is built with it. This repository started from that port.
  Please follow the upstream projects' licences when reusing their code.

## Repository layout

| Path | Purpose |
|---|---|
| `content/` | Everything you edit: pages, projects, data and images (see below) |
| `al_folio_theme/` | The Pelican theme: Jinja templates, SCSS and JavaScript |
| `py_code/` | Pelican plugin and helpers (markdown reader, cache busting, BibTeX parsing, URL filters) |
| `pelicanconf.py` | Pelican settings for local development |
| `publishconf.py` | Production settings (absolute URLs, analytics), used for deployment |
| `tests/` | Unit tests and a build smoke test |
| `tools/check_output.py` | Post-build checks: internal links, HTML parsing, leaked placeholders |
| `pyproject.toml`, `pixi.toml` | Dependencies and task runner (see Development) |
| `tasks.py`, `Makefile` | Legacy Invoke and Make entry points from the original port; pixi tasks are preferred |
| `.github/` | CI, deploy workflow, Dependabot config and a branch-protection ruleset |

### Editing the content

| What | Where |
|---|---|
| Site title, URL, social handles, feature toggles | `content/config.yml` |
| Home page (bio, profile picture, contact line) | `content/pages/home.md` |
| News items | `entries:` in `content/pages/news.md` |
| CV sections | `content/data/cv.yml` |
| Projects | one Markdown file per project in `content/projects/` (set `category` and `importance`) |
| Publications | BibTeX entries in `content/pages/publications.bib`, then set `status: published` in `publications.md` |
| Images | `content/images/` |

Pages use YAML front matter. `status: published` shows a page, `hidden` builds it without listing it, and `skip` leaves it out.
The navigation bar is built from pages with `nav: true`, ordered by `nav_order`.

## Development

Dependencies are declared once, in `pyproject.toml` (hatchling backend). `pixi.toml` installs the project from it,
so pixi, uv and pip all use the same list.

```bash
pixi install          # create the environment (commit the resulting pixi.lock)
pixi run build        # development build into output/
pixi run serve        # serve at http://localhost:8000 and rebuild on change
pixi run publish      # production build (publishconf.py), as used by CI
pixi run test         # unit tests and a build smoke test
pixi run clean        # remove output/
```

Without pixi:

```bash
uv sync --extra dev
uv run pelican content -o output -s publishconf.py
uv run pytest
```

Python 3.10 or newer is required (Pelican 4.12 needs 3.11 or newer, so 3.10 installs 4.11).

## CI/CD

- **Pull requests** run `.github/workflows/ci.yml`: ruff and yamllint, the unit tests, a strict production build
  (warnings are fatal) and `tools/check_output.py`.
- **Pushes to `main`** run `.github/workflows/deploy.yml`, which builds the site and deploys it with the official GitHub Pages
  actions. In the repository settings, set **Pages > Source** to **GitHub Actions**.
- **Dependabot** proposes monthly updates for GitHub Actions and the Python dependencies.
- Once `pixi.lock` is committed, set `locked: true` and `cache: true` in both workflows.

### Branch protection

`.github/rulesets/default-branch.json` is a repository ruleset for `main`: no deletion or force-push, changes go through a
pull request, and the `lint` and `build` checks must pass. It is not applied automatically. Import it under
**Settings > Rules > Rulesets > New ruleset > Import a ruleset**. The two required checks only become selectable after CI has run once.

## Licence

No licence file is included yet. The upstream al-folio theme and the Pelican port each carry their own licence terms; check
those projects before redistributing the theme code. The personal content in `content/` (text, CV, photos) is not intended for reuse.
