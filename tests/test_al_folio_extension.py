import logging
from types import SimpleNamespace

import pytest
from pelican import signals
from pelican.settings import DEFAULT_CONFIG

from py_code import al_folio_extension as ext


def make_gen(generated=None, pages=(), site=None):
    context = {
        "generated_content": generated or {},
        "pages": list(pages),
        "SITE": site or {},
        "localsiteurl": "",
    }
    return SimpleNamespace(settings=dict(DEFAULT_CONFIG), context=context)


def page(**meta):
    return SimpleNamespace(metadata=meta)


def test_content_pass_renders_markdown():
    gen = make_gen()
    md = ext.Markdown(extensions=["extra"])
    assert "<strong>x</strong>" in ext.content_pass(gen, md, "**x**")


def test_content_pass_can_strip_paragraph_tags():
    gen = make_gen()
    md = ext.Markdown(extensions=["extra"])
    assert ext.content_pass(gen, md, "hello", strip_p_tags=True) == "hello"
    assert ext.content_pass(gen, md, "hello") == "<p>hello</p>"


def test_news_entries_are_rendered_into_context():
    news = page(entries=[{"date": "2026-01-01", "content": "**big** news"}])
    gen = make_gen({"pages/news.md": news})
    ext.process_content_fields(gen)
    assert "<strong>big</strong>" in gen.context["news"][0]["content"]
    assert gen.context["news"][0]["date"] == "2026-01-01"


def test_teaching_courses_are_rendered_into_context():
    course = {"title": "*Intro*", "content": "Some **text**"}
    gen = make_gen({"pages/teaching.md": page(courses=[course])})
    ext.process_content_fields(gen)
    title = gen.context["teaching"][0]["title"]
    assert "<em>Intro</em>" in title and "<p>" not in title
    assert "<strong>text</strong>" in gen.context["teaching"][0]["content"]


def test_malformed_news_is_logged_not_raised(caplog):
    gen = make_gen({"pages/news.md": page(entries=[{"date": "2026-01-01"}])})  # no content key
    with caplog.at_level(logging.ERROR):
        ext.process_content_fields(gen)
    assert "Error loading news" in caplog.text
    assert "news" not in gen.context


def test_missing_news_and_teaching_pages_are_fine():
    gen = make_gen()
    ext.process_content_fields(gen)
    assert "news" not in gen.context and "teaching" not in gen.context


def test_navigation_includes_only_nav_pages_sorted_by_nav_order():
    pages = [
        page(title="cv", nav=True, nav_order=4),
        page(title="hidden", nav=False, nav_order=1),
        page(title="projects", nav=True, nav_order=2),
        page(title="no-flag"),
    ]
    gen = make_gen(pages=pages)
    ext.process_content_fields(gen)
    titles = [p.metadata["title"] for _, kind, p in gen.context["nav_sorted_pages"] if kind == "page"]
    assert titles == ["projects", "cv"]


def test_dropdown_children_are_converted_and_dividers_kept():
    site = {"dropdowns": [{"title": "more", "nav_order": 3, "children": ["[talks](/talks/)", "divider"]}]}
    gen = make_gen(site=site)
    ext.process_content_fields(gen)
    children = site["dropdowns"][0]["children"]
    assert 'class="dropdown-item"' in children[0] and "<p>" not in children[0]
    assert children[1] == "divider"
    assert gen.context["nav_sorted_pages"][0][1] == "dropdown"


def test_register_connects_signals():
    ext.register()
    assert ext.process_content_fields in [r() for r in signals.page_generator_finalized.receivers.values()]
    assert ext.get_generators(None) is ext.ALFolioGenerator
