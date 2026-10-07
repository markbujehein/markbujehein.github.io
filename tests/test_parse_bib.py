from py_code.parse_bib import parse_bibliography

SITE = {"first_name": "Mark", "last_name": "Sørensen"}

BIB = r"""
@article{key1,
  title={A Title},
  author={Sørensen, Mark and Doe, Jane},
  journal={J. Test},
  year={2026},
  doi={10.1/x},
  pdf={https://example.org/p.pdf},
  code={local/code.zip},
  preview={images/p.png},
  abbr={JT},
  selected={true},
  bibtex_show={true}
}

@book{key2,
  title={Other},
  author={Doe, Jane},
  year={2020}
}
"""


def parse(tmp_path, text):
    path = tmp_path / "p.bib"
    path.write_text(text, encoding="utf-8")
    site = dict(SITE)
    parse_bibliography(str(path), "publications", site)
    return site["publications"]


def test_empty_bibliography_yields_empty_list(tmp_path):
    assert parse(tmp_path, "@comment{nothing here}\n") == []


def test_entries_are_stored_in_order(tmp_path):
    entries = parse(tmp_path, BIB)
    assert [e["key"] for e in entries] == ["key1", "key2"]
    assert entries[0]["type"] == "article"


def test_authors_and_self_detection(tmp_path):
    first = parse(tmp_path, BIB)[0]
    assert [a["last"] for a in first["author_array"]] == ["Sørensen", "Doe"]
    assert first["author_array"][0].get("is_self") is True
    assert "is_self" not in first["author_array"][1]


def test_selected_flag(tmp_path):
    entries = parse(tmp_path, BIB)
    assert entries[0]["selected"] is True
    assert entries[1]["selected"] is False


def test_button_fields_mark_relative_links(tmp_path):
    buttons = parse(tmp_path, BIB)[0]["button_fields"]
    assert buttons["pdf"] == {"link": "https://example.org/p.pdf", "relative": False}
    assert buttons["code"] == {"link": "local/code.zip", "relative": True}


def test_preview_is_relative_when_local(tmp_path):
    assert parse(tmp_path, BIB)[0]["preview"] == {"link": "images/p.png", "relative": True}


def test_internal_fields_are_removed_from_bibtex(tmp_path):
    bibtex = parse(tmp_path, BIB)[0]["bibtex"]
    assert "A Title" in bibtex
    for hidden in ("abbr", "bibtex_show", "preview", "example.org/p.pdf"):
        assert hidden not in bibtex
