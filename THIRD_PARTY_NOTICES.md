# Third-party notices

## Scholarly (astro-theme-scholars)

Component class names, spacing and layout patterns in `src/styles/global.css` and some components are
adapted from <https://github.com/jxpeng98/astro-theme-scholars>, recoloured to this site's palette.

MIT License

Copyright (c) 2025 Jiaxin Peng

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## Lucide icons

The site's icons are from Lucide ([lucide-icons/lucide](https://github.com/lucide-icons/lucide)), by Lucide Contributors, ISC licence ([LICENSE](https://github.com/lucide-icons/lucide/blob/main/LICENSE)). They are read at build time from `@iconify-json/lucide` through `@iconify/tailwind4` (MIT), and only the icons used are written into the site's CSS.

## kinu (design reference)

The shared `btn` and `chip` styles, the dialog fade and the CSS-only approach are shaped after [kinu](https://github.com/developit/kinu) by Jason Miller, which declares MIT in its `package.json`. No kinu code is copied; the components in `src/styles/global.css` are written for this site.

## Profile icons

The ORCID, ResearchGate, GitHub, Kaggle and LinkedIn icons in `src/config/profileIcons.ts` are glyph outlines taken from the Font Awesome brand icons as shipped in the Nerd Fonts symbol set ([ryanoasis/nerd-fonts](https://github.com/ryanoasis/nerd-fonts), MIT; Font Awesome Free icons, [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), by Fonticons, Inc.). They are inline SVG paths; no font is loaded.
