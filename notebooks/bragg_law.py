import marimo

__generated_with = "0.25.2"
app = marimo.App(width="medium")


@app.cell
def _():
    import marimo as mo

    return (mo,)


@app.cell
def _(mo):
    mo.md(r"""
    # Bragg's law

    A crystal with lattice-plane spacing $d$ diffracts radiation of wavelength $\lambda$ at angles $2\theta$ where

    $$n\lambda = 2d\sin\theta, \qquad n = 1, 2, 3, \dots$$

    Move the sliders to see which orders $n$ are reachable.
    """)
    return


@app.cell
def _(mo):
    d = mo.ui.slider(1.0, 10.0, step=0.1, value=3.0, label="d-spacing d (Å)", show_value=True)
    wavelength = mo.ui.slider(0.5, 6.0, step=0.1, value=1.8, label="wavelength λ (Å)", show_value=True)
    mo.hstack([d, wavelength], justify="start")
    return d, wavelength


@app.cell
def _(d, mo, wavelength):
    import math

    rows = []
    n = 1
    while n * wavelength.value / (2 * d.value) <= 1:
        theta = math.degrees(math.asin(n * wavelength.value / (2 * d.value)))
        rows.append(f"| {n} | {theta:.2f}° | {2 * theta:.2f}° |")
        n += 1

    table = "\n".join(rows) if rows else "| – | no reflection: λ > 2d | – |"
    mo.md(f"| order n | θ | 2θ |\n|---|---|---|\n{table}")
    return


if __name__ == "__main__":
    app.run()
