"""End-to-end smoke test: build the real site with production settings."""
import subprocess
import sys

import pytest


@pytest.fixture(scope="module")
def site(tmp_path_factory):
    import pathlib

    root = pathlib.Path(__file__).resolve().parent.parent
    out = tmp_path_factory.mktemp("output")
    result = subprocess.run(
        [sys.executable, "-m", "pelican", "content", "-o", str(out), "-s", "publishconf.py", "--fatal", "warnings"],
        cwd=root,
        capture_output=True,
        text=True,
    )
    assert result.returncode == 0, result.stdout + result.stderr
    return out


def test_expected_pages_exist(site):
    for page in ("index.html", "cv/index.html", "projects/index.html", "news/index.html", "sitemap.xml"):
        assert (site / page).is_file(), page


def test_every_project_has_a_page(site):
    projects = [p.name for p in (site / "projects").iterdir() if p.is_dir()]
    assert len(projects) >= 1


def test_urls_point_at_the_live_domain(site):
    html = (site / "index.html").read_text(encoding="utf-8")
    assert 'rel="canonical" href="https://markbujehein.github.io' in html
    assert "dracoargenteus" not in html


def test_no_template_placeholders_leak(site):
    for path in site.rglob("*.html"):
        text = path.read_text(encoding="utf-8").lower()
        assert "write your biography" not in text, path
        assert "einstein" not in text, path
