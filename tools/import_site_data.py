"""Generate site content from the curated export (site-data/site.yml in the private source repo).

    python tools/import_site_data.py --source site.yml [--out .] [--denylist denylist.txt] [--check]

The export is public by definition. This script validates it, runs the safety gates and renders
home.md, news.md, cv.yml, project pages and the BibTeX file. It never invents or rewrites values.
Findings are reported as `json.path: rule-id` only; values are never printed.
"""
import argparse
import datetime as dt
import html
import json
import re
import sys
from pathlib import Path
from urllib.parse import urlparse

import yaml
from jsonschema import Draft202012Validator

ROOT = Path(__file__).resolve().parent.parent
SCHEMA = ROOT / "schema" / "site-export.schema.json"
MANIFEST = Path("content/.generated-manifest.json")
HEADER = "# GENERATED from the source export by tools/import_site_data.py. Do not edit by hand.\n"

# The only address allowed in public output, in its obfuscated form.
ALLOWED_EMAILS = {"mark.sorensen [at] nbi.ku.dk"}
# shortcut: hosts are an allowlist in code, extend it through a reviewed change when a new host is needed.
ALLOWED_HOSTS = ("github.com", "linkedin.com", "orcid.org", "doi.org", "arxiv.org", "zenodo.org", "ku.dk", "ess.eu", "cern.ch")

MARKDOWN_PATH = re.compile(r"^(profile\.bio_markdown|news\[\d+\]\.content|projects\[\d+\]\.body_markdown)$")
RULES = {
    "html": re.compile(r"<"),
    "template": re.compile(r"\{\{|\{%|!TEMPLATE!"),
    "email": re.compile(r"[\w.+-]+@[\w-]+\.[\w.-]+"),
    "phone": re.compile(r"\+\d[\d ()-]{6,}\d|(?<!\d)\d{2}( \d{2}){3}(?!\d)"),
    "national-id": re.compile(r"(?<!\d)\d{6}-?\d{4}(?!\d)"),
    "secret": re.compile(r"ghp_[A-Za-z0-9]{20,}|github_pat_|sk-[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}|-----BEGIN"),
    "control-char": re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f]"),
}
OBFUSCATED_EMAIL = re.compile(r"[\w.+-]+ ?\[at\] ?[\w.-]+")
URL = re.compile(r"https?://[^\s)\]>\"']+")


class ExportError(Exception):
    def __init__(self, findings):
        super().__init__("\n".join(findings))
        self.findings = findings


def strings(node, path="$"):
    if isinstance(node, str):
        yield path, node
    elif isinstance(node, dict):
        for k, v in node.items():
            yield from strings(v, f"{path}.{k}" if path != "$" else k)
    elif isinstance(node, list):
        for i, v in enumerate(node):
            yield from strings(v, f"{path}[{i}]")


def load(source):
    data = yaml.safe_load(Path(source).read_text(encoding="utf-8"))
    # YAML turns an unquoted 2026-10-01 into a date object; keep one string form (YYYY-MM or YYYY-MM-DD) from here on.
    for item in data.get("news", []) if isinstance(data, dict) else []:
        if isinstance(item, dict) and isinstance(item.get("date"), dt.date):
            item["date"] = item["date"].isoformat()
    return data, []


def gate(data, denylist=()):
    findings = []
    for path, text in strings(data):
        for rule, rx in RULES.items():
            if rx.search(text):
                findings.append(f"{path}: {rule}")
        for m in OBFUSCATED_EMAIL.finditer(text):
            if m.group(0) not in ALLOWED_EMAILS:
                findings.append(f"{path}: email")
        for m in URL.finditer(text):
            u = urlparse(m.group(0))
            if u.scheme != "https":
                findings.append(f"{path}: url-scheme")
            elif not any(u.hostname == h or u.hostname.endswith("." + h) for h in ALLOWED_HOSTS):
                findings.append(f"{path}: url-host")
        if "\n" in text.strip() and not MARKDOWN_PATH.match(path):
            findings.append(f"{path}: multiline-plain-field")
        low = text.lower()
        if any(term in low for term in denylist):
            findings.append(f"{path}: denylist")
    return findings


def semantic(data, out):
    findings = []
    slugs = [p["slug"] for p in data["projects"]]
    findings += [f"projects[{i}].slug: duplicate" for i, s in enumerate(slugs) if slugs.index(s) != i]
    keys = [p["key"] for p in data["publications"]]
    findings += [f"publications[{i}].key: duplicate" for i, k in enumerate(keys) if keys.index(k) != i]
    for i, n in enumerate(data["news"]):
        try:
            dt.date.fromisoformat(n["date"] if len(n["date"]) == 10 else n["date"] + "-01")
        except ValueError:
            findings.append(f"news[{i}].date: invalid-date")
    cats = front_matter(out / "content/pages/projects.md").get("display_categories", [])
    findings += [f"projects[{i}].category: not-in-display_categories" for i, p in enumerate(data["projects"]) if p["category"] not in cats]
    return findings


def front_matter(path):
    text = path.read_text(encoding="utf-8").replace("\r\n", "\n")
    return yaml.safe_load(text.split("\n---\n", 1)[0].removeprefix("---\n")) or {}


def validate(source, out, denylist=()):
    data, findings = load(source)
    if not isinstance(data, dict):
        raise ExportError(["$: not-a-mapping"])
    schema_errors = sorted(Draft202012Validator(json.loads(SCHEMA.read_text())).iter_errors(data), key=lambda e: list(map(str, e.absolute_path)))
    findings += [f"{'.'.join(map(str, e.absolute_path)) or '$'}: schema-{e.validator}" for e in schema_errors]
    if not schema_errors:  # semantic checks assume a schema-valid document
        findings += gate(data, denylist) + semantic(data, out)
    if findings:
        raise ExportError(sorted(set(findings)))
    return data


# ---- rendering. Every scalar goes through json.dumps: always valid YAML, no quoting bugs. ----
q = json.dumps
esc = lambda s: html.escape(s, quote=False)  # noqa: E731  Jinja autoescape is off, so plain text is escaped here.


def q_plain(s):
    return q(esc(s), ensure_ascii=False)


def block(text, indent):
    pad = " " * indent
    return "\n".join(pad + line if line else "" for line in text.rstrip("\n").split("\n"))


def render_home(d):
    p = d["profile"]
    address = "".join(f"<p>{esc(x)}</p>" for x in (p.get("contact_line"), p.get("location")) if x)
    out = ["---", "Title: Home", "Template: about", "URL: ''", "save_as: index.html",
           f"subtitle: {q_plain(p['subtitle'])}", "status: published", "", "profile:", "  align: right",
           "  image: images/profile.jpg", "  image_circular: 1", f"  address: {q(address, ensure_ascii=False)}"]
    if "seeking" in p:
        out.append("hero:")
        out += [f"  {k}: {q_plain(v)}" for k, v in p["seeking"].items()]
        if p.get("contact_line"):
            out.append(f"  contact: {q_plain(p['contact_line'])}")
    selected = any(x.get("selected") for x in d["publications"])
    out += ["", "news: true", "latest_posts: false", f"selected_papers: {str(selected).lower()}", "talks: false", "---", ""]
    return "\n".join(out) + "\n" + p["bio_markdown"].strip() + "\n"


def render_news(d):
    items = sorted(d["news"], key=lambda n: n["date"], reverse=True)  # the site never sorts; YYYY-MM sorts before YYYY-MM-DD
    out = ["---", "title: news", "template: news_archive", "nav: false", "summary: An archive of announcements.",
           "status: published", ""]
    out.append("entries:" if items else "entries: []")
    for n in items:
        month_only = len(n["date"]) == 7  # the source states a month only; the site then shows "Oct 2026", not an invented day
        out += [f"  - date: {n['date'] + '-01' if month_only else n['date']}"]
        out += ["    month_only: true"] if month_only else []
        out += ["    content: |", block(n["content"], 6), ""]
    return "\n".join(out) + "---\n"


def render_cv(d):
    cv = d["cv"]
    out = [HEADER.rstrip(), "- title: General Information", "  type: map", "  contents:"]
    for g in cv["general"]:
        out += [f"    - name: {q_plain(g['name'])}", f"      value: {q_plain(g['value'])}"]
    for s in cv["sections"]:
        out += ["", f"- title: {q_plain(s['title'])}", f"  type: {s['type']}", "  contents:"]
        for e in s["entries"]:
            if s["type"] == "list":
                out.append(f"    - {q_plain(e)}")
            elif s["type"] == "nested_list":
                out += [f"    - title: {q_plain(e['title'])}", "      elements:"] + [f"        - {q_plain(x)}" for x in e["elements"]]
            else:
                first = True
                for k in ("title", "institution", "year"):
                    if k in e:
                        out.append(f"    {'-' if first else ' '} {k}: {q_plain(e[k])}")
                        first = False
                if e.get("description"):
                    out.append("      description:")
                    out += [f"        - {q_plain(x)}" for x in e["description"]]
    return "\n".join(out) + "\n"


def render_project(p):
    return "\n".join(["---", f"title: {q_plain(p['title'])}", "template: page", f"summary: {q_plain(p['summary'])}", "img:",
                      f"importance: {p['importance']}", f"category: {p['category']}", "---", "", p["body_markdown"].strip(), ""])


def render_bib(d):
    out = ["---", "---", ""]
    if not d["publications"]:
        return "\n".join(out) + "@comment{No publications yet.}\n"
    for p in d["publications"]:
        fields = {"title": p["title"], "author": " and ".join(p["authors"]), "year": p["year"]}
        fields.update({k: p[k] for k in ("journal", "booktitle", "school", "doi") if k in p})
        fields.update(p.get("links", {}))
        if p.get("selected"):
            fields["selected"] = "true"
        body = ",\n".join(f"  {k} = {{{esc(v)}}}" for k, v in fields.items())
        out.append(f"@{p['type']}{{{p['key']},\n{body}\n}}\n")
    return "\n".join(out)


def generated_files(d):
    files = {
        "content/pages/home.md": render_home(d),
        "content/pages/news.md": render_news(d),
        "content/data/cv.yml": render_cv(d),
        "content/pages/publications.bib": render_bib(d),
    }
    files.update({f"content/projects/{p['slug']}.md": render_project(p) for p in d["projects"]})
    return files


def write(path, text):
    if path.exists() and path.read_bytes() == text.encode("utf-8"):
        return False
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(text.encode("utf-8"))  # bytes: always LF, whatever the platform
    return True


def apply(d, out):
    files = generated_files(d)
    manifest_path = out / MANIFEST
    old = json.loads(manifest_path.read_text()) if manifest_path.exists() else []
    for rel, text in files.items():
        write(out / rel, text)
    # Delete only files this tool generated earlier (listed in the manifest), never hand-written ones.
    for rel in old:
        if rel not in files and re.fullmatch(r"content/projects/[a-z0-9][a-z0-9_-]*\.md", rel):
            (out / rel).unlink(missing_ok=True)
    pub = out / "content/pages/publications.md"
    status = "published" if d["publications"] else "skip"
    write(pub, re.sub(r"(?m)^status: .*$", f"status: {status}", pub.read_text(encoding="utf-8").replace("\r\n", "\n"), count=1))
    write(manifest_path, json.dumps(sorted(r for r in files if r.startswith("content/projects/")), indent=2) + "\n")


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--source", required=True)
    ap.add_argument("--out", default=str(ROOT))
    ap.add_argument("--denylist", help="file with one private term per line (# comments allowed)")
    ap.add_argument("--check", action="store_true", help="validate only, write nothing")
    a = ap.parse_args(argv)
    deny = []
    if a.denylist:
        deny = [t.strip().lower() for t in Path(a.denylist).read_text(encoding="utf-8").splitlines() if t.strip() and not t.startswith("#")]
    try:
        data = validate(a.source, Path(a.out), deny)
    except ExportError as e:
        print("Export rejected:", *e.findings, sep="\n  ", file=sys.stderr)
        return 1
    if not a.check:
        apply(data, Path(a.out))
    print("Export valid." if a.check else "Content generated.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
