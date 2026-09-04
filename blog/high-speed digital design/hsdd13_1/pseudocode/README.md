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
| [`shortlin.py`](shortlin.py) | SHORTLIN | yes (needs numpy) |
| [`gndpins.py`](gndpins.py) | GNDPINS | yes (needs numpy) |

The first eight modules are plain Python with only `math` imported. The last
two are frequency-domain / linear-algebra simulations written against numpy.
All ten run cleanly (no exceptions, no NaNs, no numpy `RuntimeWarning`s).

## Verifying the transcription

Every closed-form worksheet has worked examples with results that Mathcad
stored in the file. `test_examples.py` replays all of them:

```bash
python test_examples.py
```

All 60 stored results reproduce to within 1e-9 relative error, which covers
the branch selection in `microstrip.py` and `stripline.py` and the tolerance
and reflection-coefficient vectors.

`shortlin.py` and `gndpins.py` have no worked results stored in their
worksheets to check against (they drive plots, not printed numbers), so they
are checked differently:

- `shortlin.py`: `S1`, the driving waveform, should IFFT to a rectangular
  pulse `N/2` samples long. It does — constant at `1/FSAMPLE` for the first
  512 samples, then at the numerical noise floor (~1e-18) for the rest.
- `gndpins.py`: the last row of the linear system solved for the ground
  currents encodes a hard physical constraint — every signal amp leaving
  must return along the ground wires, so each column of the solved current
  matrix `G` must sum to exactly -1 regardless of geometry. Running the
  module asserts this and it holds.

Both were also run under `python -W error::RuntimeWarning` to catch the
silent-NaN failure mode `np.where` is prone to (both branches of a `where`
are evaluated eagerly, so a `0/0` in the discarded branch still warns); both
modules were adjusted to avoid it and now run with zero warnings.

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
