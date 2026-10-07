"""Sanity-check a built Pelican site: internal links, HTML parse, placeholder leaks.

Usage: python tools/check_output.py output https://markbujehein.github.io
"""
import re
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urldefrag, urlparse

OUT = Path(sys.argv[1]).resolve()
SITE = (sys.argv[2] if len(sys.argv) > 2 else "").rstrip("/")
# Strings that must never appear in rendered HTML (template leftovers).
FORBIDDEN = [r"einstein", r"dracoargenteus", r"Write your biography", r"\bNone\b(?=[\"'<&/])", r"\{\{|\{%"]
REQUIRED_PAGES = ["index.html"]


class P(HTMLParser):
    def __init__(self):
        super().__init__()
        self.refs, self.ids, self.stack, self.errors = [], set(), [], []

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if a.get("id"):
            self.ids.add(a["id"])
        for k in ("href", "src"):
            if a.get(k):
                self.refs.append((tag, a[k]))
        if tag not in {"meta", "link", "img", "br", "hr", "input", "source", "col", "area", "base", "wbr", "path"}:
            self.stack.append(tag)

    def handle_endtag(self, tag):
        if tag in self.stack:
            while self.stack and self.stack[-1] != tag:
                self.stack.pop()  # tolerate optional end tags
            self.stack.pop()
        else:
            if tag not in {"meta", "link", "img", "br", "hr", "input"}:
                self.errors.append(f"stray </{tag}>")


problems, warnings = [], []
for req in REQUIRED_PAGES:
    if not (OUT / req).exists():
        problems.append(f"missing {req}")

for f in sorted(OUT.rglob("*.html")):
    text = f.read_text(encoding="utf-8", errors="replace")
    rel = f.relative_to(OUT)
    for pat in FORBIDDEN:
        m = re.search(pat, text, re.I if pat.islower() else 0)
        if m:
            line = text.count("\n", 0, m.start()) + 1
            problems.append(f"{rel}:{line}: forbidden string /{pat}/")
    p = P()
    p.feed(text)
    warnings += [f"{rel}: {e}" for e in p.errors]  # unbalanced HTML: warn only
    for tag, ref in p.refs:
        ref, _ = urldefrag(ref.strip())
        if not ref or ref.startswith(("mailto:", "tel:", "data:", "javascript:", "//")):
            continue
        u = urlparse(ref)
        if u.scheme in ("http", "https"):
            if not (SITE and ref.startswith(SITE)) or tag == "link":
                continue  # external: not checked (flaky, slow)
            path = u.path
        elif u.scheme:
            continue
        else:
            path = u.path
        path = unquote(path)
        base = OUT if path.startswith("/") or ref.startswith(SITE) else f.parent
        t = (base / path.lstrip("/")).resolve()
        if t.is_dir():
            t = t / "index.html"
        if not t.exists():
            problems.append(f"{rel}: broken internal <{tag}> -> {ref}")

for w in sorted(set(warnings)):
    print("::warning::" + w)
print(f"checked {len(list(OUT.rglob('*.html')))} html files")
if problems:
    print("\n".join(sorted(set(problems))[:100]))
    print(f"{len(set(problems))} problem(s)")
    sys.exit(1)
print("OK")
