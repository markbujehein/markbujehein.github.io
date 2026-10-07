# al-folio-pelican

Build an academic website with the stylish look of the popular [al-folio](https://github.com/alshedivat/al-folio) 
template, but using Python, not Ruby. This is a port of the al-folio template for the Pelican static site generator and the
Jinja templating engine. All credit to the original authors of this fantastic template!

Want to see what the result looks like? It's almost identical to al-folio, and you can see an active version on
[my personal website](https://vivek-bharadwaj.com).

Building this template has been tested (at a cursory level) on Mac OSX, Windows, and Linux.


## Development

Dependencies are declared once, in `pyproject.toml` (hatchling backend); `pixi.toml` installs the project from it, so pixi, uv and pip all use the same list.

```bash
pixi install          # create the environment (commit the resulting pixi.lock)
pixi run build        # dev build into output/
pixi run serve        # serve at http://localhost:8000 and rebuild on change
pixi run publish      # production build (publishconf.py), as used by CI
```

Without pixi: `uv sync && uv run pelican content -o output -s publishconf.py`.
