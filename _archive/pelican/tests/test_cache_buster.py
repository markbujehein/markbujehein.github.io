import hashlib

from py_code.cache_buster import CacheDigester, bust_file_cache


def test_external_urls_are_untouched():
    assert bust_file_cache("https://example.org/x.css") == "https://example.org/x.css"


def test_local_file_gets_md5_query(tmp_path, monkeypatch):
    (tmp_path / "content").mkdir()
    data = b"hello" * 50000  # larger than the read buffer
    (tmp_path / "content" / "a.css").write_bytes(data)
    monkeypatch.chdir(tmp_path)
    assert bust_file_cache("a.css") == f"a.css?{hashlib.md5(data).hexdigest()}"


def test_digest_changes_with_content(tmp_path, monkeypatch):
    (tmp_path / "content").mkdir()
    f = tmp_path / "content" / "a.txt"
    monkeypatch.chdir(tmp_path)
    f.write_bytes(b"one")
    first = CacheDigester("a.txt").digest()
    f.write_bytes(b"two")
    assert CacheDigester("a.txt").digest() != first
