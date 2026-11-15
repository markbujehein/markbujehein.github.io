import pytest
from markdown import Markdown

from py_code.template_block import TemplateBlockExtension


@pytest.fixture
def md(repo_root):
    filters = {"shout": lambda s: s.upper() + "!"}
    return Markdown(extensions=[TemplateBlockExtension(filters=filters)])


def test_template_block_is_rendered_with_filters(md):
    html = md.convert('before\n\n!TEMPLATE!\n{{ "hi" | shout }}\n!TEMPLATE!\n\nafter')
    assert "HI!" in html
    assert "before" in html and "after" in html


def test_plain_markdown_is_unaffected(md):
    assert md.convert("just *text*") == "<p>just <em>text</em></p>"


def test_template_errors_are_reported_inline(md):
    html = md.convert("!TEMPLATE!\n{{ unknown | nofilter }}\n!TEMPLATE!\n")
    assert "JINJA TEMPLATE ERROR" in html


def test_multiple_blocks(md):
    text = "!TEMPLATE!\n{{ 1 + 1 }}\n!TEMPLATE!\n\n!TEMPLATE!\n{{ 2 + 2 }}\n!TEMPLATE!\n"
    html = md.convert(text)
    assert "2" in html and "4" in html
