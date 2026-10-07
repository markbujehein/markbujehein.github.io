from py_code.render_main_scss import render_main_scss


def test_renders_site_values_into_scss(tmp_path, monkeypatch):
    (tmp_path / "al_folio_theme" / "templated_assets").mkdir(parents=True)
    (tmp_path / "al_folio_theme" / "static" / "css").mkdir(parents=True)
    (tmp_path / "al_folio_theme" / "templated_assets" / "main.scss").write_text(
        "$w: {{ SITE.max_width }};\n"
    )
    monkeypatch.chdir(tmp_path)
    render_main_scss({"max_width": "850px"})
    out = (tmp_path / "al_folio_theme" / "static" / "css" / "main.scss").read_text()
    assert out.strip() == "$w: 850px;"
