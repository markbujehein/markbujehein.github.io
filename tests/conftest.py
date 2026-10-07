from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parent.parent


@pytest.fixture
def repo_root(monkeypatch):
    """Run from the repository root, as the build does (py_code uses relative paths)."""
    monkeypatch.chdir(ROOT)
    return ROOT
