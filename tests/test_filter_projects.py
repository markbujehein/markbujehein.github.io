from types import SimpleNamespace

from py_code.filter_projects import filter_projects


def page(path, **meta):
    return SimpleNamespace(relative_source_path=path, metadata=meta)


def test_only_pages_under_projects_are_returned():
    pages = [
        page("projects/a.md", importance=1, category="research"),
        page("pages/home.md"),
    ]
    assert [p.relative_source_path for p in filter_projects(pages)] == ["projects/a.md"]


def test_projects_index_page_without_category_does_not_crash():
    """Regression: pages/projects.md matched a substring check and raised KeyError."""
    pages = [
        page("pages/projects.md"),
        page("projects/a.md", importance=1, category="research"),
    ]
    assert len(filter_projects(pages, "research")) == 1
    assert len(filter_projects(pages)) == 1


def test_filters_by_category():
    pages = [
        page("projects/a.md", importance=1, category="research"),
        page("projects/b.md", importance=2, category="software"),
    ]
    assert [p.relative_source_path for p in filter_projects(pages, "software")] == ["projects/b.md"]


def test_sorted_by_importance():
    pages = [
        page("projects/c.md", importance=3, category="x"),
        page("projects/a.md", importance=1, category="x"),
        page("projects/b.md", importance=2, category="x"),
    ]
    assert [p.relative_source_path for p in filter_projects(pages)] == [
        "projects/a.md",
        "projects/b.md",
        "projects/c.md",
    ]


def test_windows_path_separators():
    pages = [page("projects\\a.md", importance=1, category="x")]
    assert len(filter_projects(pages)) == 1


def test_project_without_category_is_skipped_when_filtering():
    pages = [page("projects/a.md", importance=1)]
    assert filter_projects(pages, "research") == []
