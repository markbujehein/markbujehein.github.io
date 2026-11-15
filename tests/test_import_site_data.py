"""Importer tests: golden output, idempotency, safety gates and a strict build of the generated tree."""
import copy
import shutil
import subprocess
import sys
from pathlib import Path

import pytest
import yaml

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "tools"))
import import_site_data as imp  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
FIXTURE = ROOT / "tests/fixtures/site-export.yml"
IGNORE = shutil.ignore_patterns(".git", "output", "cache", "_dev", ".pixi", "__pycache__", ".pytest_cache", "*.egg-info",
                                "node_modules", "dist", ".astro", ".superpowers", ".playwright-mcp", ".remember", ".ruff_cache")


@pytest.fixture
def tree(tmp_path):
    dest = tmp_path / "site"
    shutil.copytree(ROOT, dest, ignore=IGNORE)
    return dest


def export(tmp_path, mutate=None):
    data = yaml.safe_load(FIXTURE.read_text(encoding="utf-8"))
    if mutate:
        mutate(data)
    path = tmp_path / "export.yml"
    path.write_text(yaml.safe_dump(data, allow_unicode=True, sort_keys=False), encoding="utf-8")
    return path


def findings(tmp_path, mutate, deny=()):
    with pytest.raises(imp.ExportError) as e:
        imp.validate(export(tmp_path, mutate), deny)
    return e.value.findings


def test_fixture_is_valid():
    assert imp.validate(FIXTURE)


def test_generation_is_idempotent_lf_and_sorted(tree):
    data = imp.validate(FIXTURE)
    imp.apply(data, tree)
    snapshot = {p: p.read_bytes() for p in (tree / "src").rglob("*") if p.is_file()}
    imp.apply(data, tree)
    assert snapshot == {p: p.read_bytes() for p in (tree / "src").rglob("*") if p.is_file()}
    assert all(b"\r" not in (tree / rel).read_bytes() for rel in imp.generated_files(data))
    assert (tree / "src/content/news/2026-05-01.md").exists() and (tree / "src/content/news/2026-03-15.md").exists()


def test_manifest_deletes_only_generated_files(tree):
    hand = tree / "src/content/projects/hand_written.md"
    stale = tree / "src/content/projects/stale_generated.md"
    hand.write_text("---\ntitle: mine\n---\n", encoding="utf-8")
    stale.write_text("---\ntitle: old\n---\n", encoding="utf-8")
    (tree / imp.MANIFEST).write_text('["src/content/projects/stale_generated.md"]', encoding="utf-8")
    imp.apply(imp.validate(FIXTURE), tree)
    assert hand.exists()  # not in the manifest
    assert not stale.exists()  # listed in the manifest, absent from the export
    assert (tree / "src/content/projects/crystal_growth.md").exists()


def test_escaping_and_hero(tree):
    imp.apply(imp.validate(FIXTURE), tree)
    home = (tree / "src/content/home/index.md").read_text(encoding="utf-8")
    assert "fitting &amp; Bayesian" in home and "headline: \"Hire a physicist.\"" in home
    assert 'linkedin: "https://www.linkedin.com/in/example"' in home


def test_month_only_news_dates(tree):
    imp.apply(imp.validate(export(tree, put(["news", 0, "date"], "2026-05"))), tree)
    month = (tree / "src/content/news/2026-05.md").read_text(encoding="utf-8")
    assert month.startswith("---\ndate: 2026-05-01\nmonthOnly: true\n---\n")
    day = (tree / "src/content/news/2026-03-15.md").read_text(encoding="utf-8")
    assert "monthOnly" not in day  # a day-level date stays day-level


def test_cv_sections_get_unique_ids_and_order(tree):
    imp.apply(imp.validate(FIXTURE), tree)
    cv = yaml.safe_load((tree / "src/data/cv.yml").read_text(encoding="utf-8"))
    ids = [s["id"] for s in cv]
    assert ids[0] == "general-information" and len(set(ids)) == len(ids)
    assert [s["order"] for s in cv] == list(range(len(cv)))


def put(path, value):
    def mutate(d):
        node = d
        for step in path[:-1]:
            node = node[step]
        node[path[-1]] = value
    return mutate


NEGATIVE = {
    "unknown-key": (lambda d: d.update(extra=1), "$: schema-additionalProperties"),
    "wrong-type": (put(["projects", 0, "importance"], "high"), "projects.0.importance: schema-type"),
    "missing-importance": (lambda d: d["projects"][0].pop("importance"), "projects.0: schema-required"),
    "list_groups": (put(["cv", "sections", 0, "type"], "list_groups"), "cv.sections.0: schema-oneOf"),
    "over-length": (put(["profile", "subtitle"], "x" * 401), "profile.subtitle: schema-maxLength"),
    "illegal-slug": (put(["projects", 0, "slug"], "../evil"), "projects.0.slug: schema-pattern"),
    "bad-month": (put(["news", 0, "date"], "2026-13"), "news[0].date: invalid-date"),
    "bad-date-shape": (put(["news", 0, "date"], "May 2026"), "news.0.date: schema-pattern"),
    "duplicate-slug": (put(["projects", 1, "slug"], "crystal_growth"), "projects[1].slug: duplicate"),
    "bad-category": (put(["projects", 0, "category"], "teaching"), "projects[0].category: unknown-category"),
    "html": (put(["profile", "bio_markdown"], "hi <script>x</script>"), "profile.bio_markdown: html"),
    "template": (put(["projects", 0, "body_markdown"], "{{ SITE }}"), "projects[0].body_markdown: template"),
    "email": (put(["profile", "contact_line"], "me@example.org"), "profile.contact_line: email"),
    "other-obfuscated-email": (put(["profile", "contact_line"], "me [at] example.org"), "profile.contact_line: email"),
    "phone": (put(["profile", "location"], "Call +45 12 34 56 78"), "profile.location: phone"),
    "national-id": (put(["profile", "location"], "010203-1234"), "profile.location: national-id"),
    "http-url": (put(["profile", "bio_markdown"], "[x](http://github.com/a)"), "profile.bio_markdown: url-scheme"),
    "off-allowlist-url": (put(["profile", "bio_markdown"], "[x](https://example.com/a)"), "profile.bio_markdown: url-host"),
    "secret": (put(["profile", "location"], "ghp_" + "a" * 30), "profile.location: secret"),
}


@pytest.mark.parametrize("name", NEGATIVE)
def test_rejects(tmp_path, name):
    mutate, expected = NEGATIVE[name]
    assert expected in findings(tmp_path, mutate)


def test_denylist_reports_path_not_value(tmp_path):
    found = findings(tmp_path, put(["profile", "location"], "Near Secretville"), deny=["secretville"])
    assert "profile.location: denylist" in found
    assert not any("ecretville" in f for f in found)


def test_year_ranges_are_not_phone_numbers():
    assert imp.gate({"cv": "2025-2026 and 2025 - 2026"}) == []


def test_tex_escapes_specials_and_keeps_all_sections():
    data = yaml.safe_load(FIXTURE.read_text(encoding="utf-8"))
    assert imp.render_tex(data).count(r"\sect{") >= len(data["cv"]["sections"])
    assert imp.tex("A & B_50% \u03c7\u00b2 {x}") == "A \\& B\\_50\\% χ² \\{x\\}"
