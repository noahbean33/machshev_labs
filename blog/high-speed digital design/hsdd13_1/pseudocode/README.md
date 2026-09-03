# Python transcription of the HSDD Mathcad worksheets

Python versions of the formulas in the Mathcad 13.1 companion files to
*High-Speed Digital Design: A Handbook of Black Magic* (Howard Johnson &
Martin Graham). The prose versions live in [`../markdown/`](../markdown).

Units are **inches, seconds, ohms, henries, farads** throughout, except
`gndpins.py`, which is in meters (as the original is).

| Module | Worksheets | Runs? |
| --- | --- | --- |
| [`constants.py`](constants.py) | CONSTANT | yes |
| [`general.py`](general.py) | GENERAL | yes |
| [`lumped.py`](lumped.py) | CAPAC, CIRCULAR, RECTANGL | yes |
| [`mutual.py`](mutual.py) | MLINE, MLOOP | yes |
| [`wires.py`](wires.py) | ROUND, COAX, TWIST | yes |
| [`microstrip.py`](microstrip.py) | MSTRIP | yes |
| [`stripline.py`](stripline.py) | SLINE2 | yes |
| [`resistance.py`](resistance.py) | RESIST | yes |
| [`shortlin.py`](shortlin.py) | SHORTLIN | pseudocode (needs numpy) |
| [`gndpins.py`](gndpins.py) | GNDPINS | pseudocode (needs numpy) |

The first eight modules are plain Python with only `math` imported, and they
run as-is. The last two are frequency-domain simulations written against
numpy; they are transcriptions, not verified code.

## Verifying the transcription

Every closed-form worksheet has worked examples with results that Mathcad
stored in the file. `test_examples.py` replays all of them:

```bash
python test_examples.py
```

All 60 stored results reproduce to within 1e-9 relative error, which covers
the branch selection in `microstrip.py` and `stripline.py` and the tolerance
and reflection-coefficient vectors.

## Reading notes

- The bare constants that show up everywhere come from `constants.py`:
  `5.08e-9` is `U0_inches/(2*pi)`, `10.16e-9` is twice that, and `84.72e-12`
  is the propagation delay of light in ps/in.
- `MLOOP()` returns **nH**, not H. It is the only function in the set that
  does not return base units.
- `CIRCULAR.mcd` lists `XLR()` in its index but defines the function as
  `XLT()`. Kept as `XLT()`, since that is the name that is actually defined.
- `ZSTR_K1()` in `stripline.py` carries Howard Johnson's correction, credited
  in the worksheet to Robert Canright of Richardson, TX.
- Mathcad's `log()` is base 10 and its `ln()` is natural. `resistance.AWG()`
  is the one place this matters; it uses `log10`.
