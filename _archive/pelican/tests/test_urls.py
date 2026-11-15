import textwrap

import pytest

from py_code import urls_dev, urls_publish


def test_dev_urls_are_root_relative():
    assert urls_dev.relative_url("css/main.css") == "/css/main.css"
    assert urls_dev.absolute_url("x") == "/x"


@pytest.mark.parametrize(
    "baseurl, rel, absolute",
    [
        ("", "/", "https://example.org/"),
        ("blog", "/blog/", "https://example.org/blog/"),
    ],
)
def test_publish_urls(tmp_path, monkeypatch, baseurl, rel, absolute):
    (tmp_path / "content").mkdir()
    value = f'"{baseurl}"' if baseurl else ""
    (tmp_path / "content" / "config.yml").write_text(
        textwrap.dedent(f"url: https://example.org\nbaseurl: {value}\n")
    )
    monkeypatch.chdir(tmp_path)
    relative_url, absolute_url = urls_publish.make_functions()
    assert relative_url("a/") == rel + "a/"
    assert absolute_url("a/") == absolute + "a/"
