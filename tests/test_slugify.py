from py_code.slugify import slugify


def test_lowercases_and_joins_with_dashes():
    assert slugify("Hello World") == "hello-world"


def test_collapses_repeated_separators():
    assert slugify("a  --  b") == "a-b"


def test_strips_leading_and_trailing_separators():
    assert slugify("  -_Title_-  ") == "title"


def test_drops_punctuation():
    assert slugify("Hi, there! (2026)") == "hi-there-2026"


def test_ascii_folding_drops_unmappable_characters():
    assert slugify("Sørensen café") == "srensen-cafe"


def test_allow_unicode_keeps_letters():
    assert slugify("Sørensen", allow_unicode=True) == "sørensen"


def test_non_string_is_converted():
    assert slugify(2026) == "2026"
