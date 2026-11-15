import datetime

import pytest
from pelican.settings import DEFAULT_CONFIG

from py_code import toc_md_reader as t


@pytest.fixture
def reader():
    settings = dict(DEFAULT_CONFIG)
    settings["MARKDOWN"] = {"extensions": ["extra", "toc"], "extension_configs": {}, "output_format": "html5"}
    return t.TOCMarkdownReader(settings)


def test_header_regex_splits_metadata_and_body():
    m = t.HEADER_RE.fullmatch("---\ntitle: A\n---\nBody text\n")
    assert m and "title: A" in m.group("metadata") and "Body text" in m.group("content")


def test_header_regex_rejects_missing_header():
    assert t.HEADER_RE.fullmatch("No header here\n") is None


def test_to_list_and_strip():
    assert t._to_list("a") == ["a"]
    assert t._to_list(["a", "b"]) == ["a", "b"]
    assert t._strip("  x ") == "x"


def test_parse_date_accepts_date_objects_and_strings():
    assert t._parse_date(datetime.date(2026, 6, 1)).year == 2026
    assert t._parse_date("2026-06-01 12:00").month == 6


def test_read_parses_yaml_metadata_and_toc(reader, tmp_path):
    f = tmp_path / "p.md"
    f.write_text("---\ntitle: Hello\nstatus: published\ntoc: true\n---\n# Heading\n\nText\n")
    content, meta = reader.read(str(f))
    assert meta["title"] == "Hello"
    assert meta["status"] == "published"
    assert "<h1" in content
    assert meta["parsed_toc"][0]["name"] == "Heading"


def test_null_metadata_values_are_dropped(reader, tmp_path):
    f = tmp_path / "p.md"
    f.write_text("---\ntitle: Hello\nimg:\n---\nBody\n")
    _, meta = reader.read(str(f))
    assert "img" not in meta


def test_invalid_yaml_yields_empty_metadata(reader, tmp_path):
    f = tmp_path / "p.md"
    f.write_text("---\ntitle: [unclosed\n---\nBody\n")
    _, meta = reader.read(str(f))
    assert meta == {}


def test_falls_back_to_markdown_metadata_without_header(reader, tmp_path):
    f = tmp_path / "p.md"
    f.write_text("Title: Plain\n\nBody\n")
    content, meta = reader.read(str(f))
    assert "Body" in content
