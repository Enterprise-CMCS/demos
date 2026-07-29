# PMDA `mdcd_demo` Medicaid-Number Recovery Audit

Audit of the source `mdcd_demo` table's medicaid demonstration numbers
(`mdcd_demo_num`, `mdcd_scndry_demo_num`) to see how many malformed primary
numbers can be recovered by pattern normalization, and to establish what the
secondary column actually holds.

- **Date:** 2026-07-17
- **Method:** Read-only DuckDB MySQL attach against the live source DB via the
  `mysql-ducksplorer` skill (no MySQL driver added, password never printed).
  All figures are live counts, not stale-snapshot counts. Throwaway probe
  scripts were removed after the run.
- **Scope honored:** no source rows were modified; this is a read-only census.
- **Canonical pattern:** the CMS medicaid demonstration number is
  `11-W-NNNNN/R` (a `11-W-` prefix, a 5-digit serial, and a `/R` amendment
  suffix). CHIP demonstrations use the sibling `21-W-NNNNN/R` prefix.

---

## 0. Table shape

`mdcd_demo` has **288 rows**: 131 live (`dltd_ind = 0`) and 157 soft-deleted
(`dltd_ind = 1`). `mdcd_demo_num` is populated on **every** row (0 NULL, 0
blank, across all 288). `mdcd_scndry_demo_num` is essentially unused: 103 NULL,
177 blank, only **8 populated**.

---

## 1. NULL-based backfill is a no-op

The original question was whether a NULL `mdcd_demo_num` could be filled from a
`mdcd_scndry_demo_num` that matches the `11-W` pattern.

**Result: 0 rows.** There are no NULL (or blank) `mdcd_demo_num` values anywhere
in the table, so there is nothing to backfill. The secondary-number strategy
recovers nothing on this axis.

---

## 2. Pattern conformance of `mdcd_demo_num`

| Pattern | Definition | Live match | Deleted match |
|---|---|---|---|
| **Strict** | `^11-W-[0-9]{5}(/[0-9A-Za-z]+)?$` | 112 / 131 | 82 / 157 |
| **Relaxed** | strip every non-integer separator (`-`, `/`, space, or none), uppercase, then `^11W[0-9]{5}[0-9]*$` | 127 / 131 | 91 / 157 |

Relaxing the separators (treating `-`, `/`, and spaces as interchangeable or
absent) brings **15 additional live rows** and **9 additional deleted rows**
into conformance: **24 recovered** in total. The recovery comes entirely from
normalizing the primary value; the secondary column contributes nothing (see
§4).

---

## 3. Recoverable rows (relaxed match, strict miss)

For all 24 recoverable rows, `mdcd_scndry_demo_num` is empty. The defect is
purely cosmetic in the primary value and normalizes cleanly to canonical
`11-W-NNNNN/R`.

### Live (15)

| id | `mdcd_demo_num` | `mdcd_scndry_demo_num` | canonical |
|---|---|---|---|
| 2477 | `11 -W-00326/6` | (empty) | `11-W-00326/6` |
| 2509 | `11-W -00274/2` | (empty) | `11-W-00274/2` |
| 2505 | `11-W- 0000- 5/4` | (empty) | `11-W-00005/4` |
| 2508 | `11-W- 00158/1` | (empty) | `11-W-00158/1` |
| 2517 | `11-W- 00251/3` | (empty) | `11-W-00251/3` |
| 1667 | `11-W-002054` | (empty) | `11-W-00205/4` |
| 1573 | `11-W-00300-8` | (empty) | `11-W-00300/8` |
| 1971 | `11W001835` | (empty) | `11-W-00183/5` |
| 1977 | `11W001887` | (empty) | `11-W-00188/7` |
| 1973 | `11W002155` | (empty) | `11-W-00215/5` |
| 1974 | `11W002353` | (empty) | `11-W-00235/3` |
| 1982 | `11W002367` | (empty) | `11-W-00236/7` |
| 1542 | `11W002849` | (empty) | `11-W-00284/9` |
| 1484 | `11W002994` | (empty) | `11-W-00299/4` |
| 2421 | `11W02885` | (empty) | `11-W-02885` |

### Deleted (9)

| id | `mdcd_demo_num` | `mdcd_scndry_demo_num` | canonical |
|---|---|---|---|
| 2504 | `11-W-0000- 5/4` | (empty) | `11-W-00005/4` |
| 2503 | `11-W-0000-5/4` | (empty) | `11-W-00005/4` |
| 2585 | `11-W-00422/` | (empty) | `11-W-00422` |
| 2589 | `11-W-00429/` | (empty) | `11-W-00429` |
| 2591 | `11-W-00432/` | (empty) | `11-W-00432` |
| 2593 | `11-W-00433/` | (empty) | `11-W-00433` |
| 2594 | `11-W-00434/` | (empty) | `11-W-00434` |
| 2436 | `11W-23847` | (empty) | `11-W-23847` |
| 2577 | `11W000000` | (empty) | `11-W-00000/0` |

### Defect classes (live)

| Defect class | n | Example |
|---|---|---|
| Stray whitespace | 4 | `11 -W-00326/6` |
| Missing dashes (`11W######`) | 7 | `11W001835` -> `11-W-00183/5` |
| Dash instead of slash | 1 | `11-W-00300-8` -> `11-W-00300/8` |
| No slash before check digit (6 digits) | 1 | `11-W-002054` -> `11-W-00205/4` |
| Split 5-digit serial | 1 | `11-W- 0000- 5/4` -> `11-W-00005/4` |
| 5 digits, no check digit | 1 | `11W02885` -> `11-W-02885` |

### Still non-conforming after relaxation (live, 4)

| id | `mdcd_demo_num` | reason |
|---|---|---|
| 2481 | `21-W-00014/8` | valid CHIP `21-W` number, excluded only by the `11` prefix |
| 2470 | `21-W-00058/3` | valid CHIP `21-W` number |
| 2648 | `21-W-00076/4` | valid CHIP `21-W` number |
| 2516 | `N/A` | literal junk, unrecoverable |

The three `21-W` rows are structurally valid CHIP demonstration numbers; whether
to admit them depends on whether CHIP demos are in scope for the migration.

---

## 4. `mdcd_scndry_demo_num` triage

Only 8 of 288 rows have a populated secondary value. Categorized:

| id | status | `mdcd_demo_num` (primary) | `mdcd_scndry_demo_num` | category | primary valid 11-W? |
|---|---|---|---|---|---|
| 1620 | live | `11-W-00145/8` | `21-W-00054/8` | CHIP companion (21-W) | yes |
| 2441 | live | `11-W-00306/4` | `21-W-00067/4` | CHIP companion (21-W) | yes |
| 2564 | live | `11-W-00372/1` | `21-W-00069/1` | CHIP companion (21-W) | yes |
| 2422 | live | `11-W-00304/0` | `21-W-00071/0` | CHIP companion (21-W) | yes |
| 1457 | live | `11-W-00030/1` | `21-W-00071/1` | CHIP companion (21-W) | yes |
| 2265 | live | `11-W-00369/4` | `11-W-001514` | valid 11-W, **different demo** | yes |
| 2524 | deleted | `01222021` | `01222021a` | date-like junk | no |
| 2522 | live | `11-W-00338/1` | `None` (literal text) | free-text junk | yes |

Tally: 5 CHIP companion, 1 second valid 11-W, 2 junk.

**The one meaningful use of the secondary column is a CHIP (`21-W`) companion
ID paired to a Medicaid (`11-W`) primary.** In all 5 CHIP cases the primary is a
valid 11-W number and the `/R` amendment suffix matches across the pair
(`/8`, `/4`, `/1`, `/0`, `/1`). This is a genuine Medicaid+CHIP linkage, not a
duplicate or fallback for the primary.

### Two valid medicaid IDs for one demo

Exactly one row (id 2265, live) carries a structurally valid `11-W` number in
**both** columns, and they are **different demonstrations**: primary
`11-W-00369/4` vs secondary `11-W-00151/4` (raw `11-W-001514`, missing its `/`
separator). This is not a self-duplicate and needs SME review to determine the
relationship between `00369` and `00151`.

---

## 5. Conclusions and recommendations

1. **No NULL backfill exists.** `mdcd_demo_num` is always populated; the
   "fill NULL from secondary" idea recovers 0 rows.
2. **The win is primary-column normalization, not the secondary column.**
   Relaxing separators recovers 15 live rows (24 total) purely by cleaning the
   primary string into canonical `11-W-NNNNN/R`. Suggested normalization:
   uppercase, strip all non-alphanumerics, verify `11W` + 5-digit serial +
   optional integer amendment, then re-emit as `11-W-NNNNN/R`.
3. **Do not treat `mdcd_scndry_demo_num` as a backfill source.** It is populated
   on only 8/288 rows and never usefully mirrors the primary. Where meaningful
   (5 rows) it is a distinct CHIP `21-W` linkage; the rest are one anomaly and
   two junk values.
4. **Open SME questions:**
   - Are CHIP `21-W` demonstrations in scope? If so, 3 live primaries
     (2481, 2470, 2648) and the 5 CHIP companion secondaries become relevant.
   - Row 2265: what is the relationship between primary `11-W-00369` and
     secondary `11-W-00151`?
