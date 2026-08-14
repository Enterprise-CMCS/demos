# Deliverable type — budget-neutrality routing (investigation spec)

Investigation requested during SME review of the crosswalk proposals: the
current `deliverable_type` mapping sends every operational/annual legacy type
to `Monitoring Report`, but DEMOS seeds two dedicated budget-neutrality (BN)
types — `Annual Budget Neutrality Report` and `Quarterly Budget Neutrality
Report` — that may be the correct target for some rows. This document is the
deliverable: it establishes which source signal is authoritative for BN
routing, the proposed routing rule, the open questions, and what must be
verified against loaded source data **before** any crosswalk/SQL is written.

No CSV or SQL changes are made by this investigation. Implementation is gated
on the sign-off at the bottom.

---

## Correction (post-live-verification) — supersedes the analysis below

Everything below this banner was written before `mysql_raw.mdcd_dlvrbl` was
loaded and is **retained for history only**. Direct verification against the
loaded source overturned the two premises this document is built on:

1. **`mdcd_dlvrbl.mdcd_dlvrbl_type_cd` is NOT the coarse 1-8 cadence code.** It
   carries the **rich report-occurrence vocabulary** (`mdcd_dlvrbl_rpt_ocrnc_rfrnc`,
   the 43-row set in the appendix). Live: **40/40** distinct type codes present
   on `mdcd_dlvrbl` resolve against `mdcd_dlvrbl_rpt_ocrnc_rfrnc`; **0/40**
   resolve against the coarse `mdcd_dlvrbl_type_rfrnc`. The BN codes `57`
   (Quarterly BN) and `70` (Annual BN) are already carried per-deliverable.
2. **The "rpt_ocrnc is not joinable" finding was a false negative.** The search
   looked for a column *named* `*_rpt_ocrnc_cd` on `mdcd_dlvrbl` and found none;
   but the report-occurrence code **values live directly in
   `mdcd_dlvrbl_type_cd`**. No separate FK column is needed. The CMA W1/C1 claim
   (route on the `57`/`70` report-occurrence codes) was therefore **correct**;
   only its assumed join mechanism was wrong.

**What was implemented instead of the two-input matrix below:**

- `deliverable_type` is a **single-input direct map** from the report-occurrence
  code to `demos_text_id` — `reports/crosswalks/deliverable_type.csv`,
  `sql/04_crosswalks/52_deliverable_type.sql`, fail-closed check
  `53_deliverable_type_check.sql`. There is **no `bn_ind` column and no BN
  matrix**; codes `57`/`70` route straight to Quarterly/Annual Budget Neutrality
  Report. Report-occurrence codes with no dedicated DEMOS type use the best-fit
  targets recorded in the CSV `notes` (e.g. `0/59/86` → Demonstration-Specific
  Deliverable; monitoring cadences → Monitoring Report; `69` → Transition Plan;
  `51` → Evaluation Design).
- `bdgt_ntrlty_ind` and the free-text name are **retired as routing inputs**.
  They survive only as a **non-gating QA check**
  (`sql/99_parity/43_deliverable_bn_qa.sql`, parity "deliverable BN QA") that
  logs type-vs-flag/name disagreements to
  `reports/orphans/deliverable_bn_qa.csv` for SME review. Open questions 1
  (semi-annual BN), 3 (file-vs-deliverable precedence), and 4 (name fallback)
  are **moot** under the single-input map.
- **Override-comment notes** migrate in full: every valid override note (41 in
  the current live scope) becomes a `private_comment` on its deliverable
  (`sql/10_stg/35_override_note_resolved.sql`,
  `sql/20_app/51_override_note.sql`), author resolved as `updtd_user_id` then
  `creatd_user_id`; non-CMS / unresolved authors are held back and logged
  (`sql/99_parity/48_override_note.sql`). The source has **no per-row A-F
  category column**, so the A-F grouping below is descriptive only and is NOT
  applied per row — all notes migrate with their original text.

The sign-off table further down reflects the pre-verification premises; its
decisions (semi-annual BN, file precedence, name fallback) no longer apply.

---

## Scope of the problem

`reports/crosswalks/proposed/archive/deliverable_type.proposed.csv` maps the 8-value
legacy coarse type (`mdcd_dlvrbl_type_rfrnc`) to DEMOS `deliverable_type`:

| legacy `mdcd_dlvrbl_type_cd` | legacy name | current proposal |
|---|---|---|
| 1-4 | Q1-Q4 Operational Report | Monitoring Report |
| 5-6 | Semi-Annual Report 1/2 | Monitoring Report |
| 7 | Annual Report | Monitoring Report (low confidence) |
| 8 | Demonstration Specific | Demonstration-Specific Deliverable |

The coarse type only encodes **cadence** (quarter / semi-annual / annual) and
"demonstration specific". It does **not** distinguish an operational
monitoring report from a budget-neutrality report. So the type code alone
cannot drive BN routing; a second signal is required.

## Candidate BN signals (what exists in the source)

Three columns in the snapshot carry a BN indicator
(`reports/schema_snapshot/columns.csv`):

| Table | Column | Grain | Notes |
|---|---|---|---|
| `mdcd_dlvrbl` | `bdgt_ntrlty_ind` (smallint, NOT NULL, default 0) | **per deliverable** | direct flag on the deliverable row being migrated |
| `mdcd_dlvrbl` | `bdgt_ntrlty_ovrrdn_ind`, `bdgt_ntrlty_ovrrd_cmt_txt` | per deliverable | BN override / waiver of the BN requirement |
| `mdcd_dlvrbl_fil_doc` | `bdgt_ntrlty_fil_ind` | per attached file | marks a *file* as a BN workbook (see `reports/narrative/bn_source_enumeration.md`) |
| `mdcd_demo` | `bdgt_ntrlty_ind` | per demonstration | demonstration carries BN at all |

There is also a richer reference table, `mdcd_dlvrbl_rpt_ocrnc_rfrnc`
(43 rows), which names report occurrences explicitly, including:

- `57 Quarterly Budget Neutrality Report`
- `70 Annual Budget Neutrality Report`
- `53/54/55 Quarterly/Semi-Annual/Annual Monitoring Report`, etc.

**Key finding:** `mdcd_dlvrbl_rpt_ocrnc_cd` appears **only** on the reference
table itself — no instance table (notably `mdcd_dlvrbl`) has a foreign-key
column referencing it (`columns.csv` shows no `*_rpt_ocrnc_cd` on
`mdcd_dlvrbl`). It therefore cannot be used as a join key to classify a
deliverable. It is useful only as documentation of the vocabulary DEMOS
inherited, not as a routing input.

### Authoritative signal

`mdcd_dlvrbl.bdgt_ntrlty_ind` is the only BN signal carried at the grain we
migrate (one row per deliverable, 10,326 rows in `table_stats.csv`). The
proposed routing rule is built on it, with `mdcd_dlvrbl_name` as a secondary
validation signal only.

### CMA source-system audit re-test (W1 / C1)

The `reports/audits/cma_code_audit.md` audit proposed (W1, conflict C1) routing the
deliverable type on the report-occurrence codes `57`/`70` from
`mdcd_dlvrbl_rpt_ocrnc_rfrnc`, e.g. `is_bn = (bdgt_ntrlty_ind = 1 AND
rpt_ocrnc_cd IN (57, 70))`. That claim was **re-tested and disproven** against
both `reports/schema_snapshot/columns.csv` and the 2024 source dump
(`../cma/db/CMA-Local-20241014.sql`):

- The `mdcd_dlvrbl_rpt_ocrnc_*` columns (`_cd`, `_name`, `_num`) appear **only**
  on the reference table `mdcd_dlvrbl_rpt_ocrnc_rfrnc`. No instance table -- in
  particular `mdcd_dlvrbl` -- carries an `*_rpt_ocrnc_cd` foreign key, so there
  is no join key to attach a report-occurrence code to a migrated deliverable.
- Therefore `rpt_ocrnc` cannot drive per-deliverable BN routing. Codes `57`
  (`Quarterly Budget Neutrality Report`) and `70` (`Annual Budget Neutrality
  Report`) confirm the *vocabulary* DEMOS inherited, but they are not a routing
  input.

This **reaffirms** `mdcd_dlvrbl.bdgt_ntrlty_ind` as the authoritative signal and
resolves C1 in favor of the `(bdgt_ntrlty_ind, cadence)` matrix below. The full
inherited vocabulary is captured in the appendix for documentation only.

**Fidelity ceiling:** the migratable `mdcd_dlvrbl` grain carries no content-type
discriminator (only cadence `mdcd_dlvrbl_type_cd` 1-8 + `bdgt_ntrlty_ind` +
free-text name), so `deliverable_type` can resolve to at most ~4 of DEMOS's 17
content types (Monitoring Report, Quarterly/Annual Budget Neutrality Report,
Demonstration-Specific Deliverable); the other 13 (Evaluation Design, HCBS*,
Monitoring Protocol, Mid-point, Close Out, Transition Plan, Interim/Summative
Evaluation, Implementation Plan) are unreachable from structured source data.

## Proposed routing rule (to validate, not yet implement)

Route on the pair (`bdgt_ntrlty_ind`, cadence from `mdcd_dlvrbl_type_cd`):

```
CASE
  WHEN mdcd_dlvrbl_type_cd = 8                    THEN 'Demonstration-Specific Deliverable'
  WHEN bdgt_ntrlty_ind = 1 AND type_cd = 7        THEN 'Annual Budget Neutrality Report'
  WHEN bdgt_ntrlty_ind = 1 AND type_cd IN (1,2,3,4) THEN 'Quarterly Budget Neutrality Report'
  WHEN bdgt_ntrlty_ind = 1 AND type_cd IN (5,6)   THEN ??? (no semi-annual BN type in DEMOS — OPEN)
  ELSE 'Monitoring Report'   -- all non-BN operational/annual reports
END
```

Cadence (Q1-Q4 / Semi-Annual / Annual) is no longer encoded in the DEMOS
`deliverable_type`; it survives as the reporting period / `due_date` on the
`deliverable` row (consistent with the existing "deliverable_type loses
cadence granularity" decision in `_review.md`).

## Open questions (must be resolved with SME + loaded source)

1. **Semi-annual BN.** If any rows have `bdgt_ntrlty_ind = 1` and a
   semi-annual cadence (type 5/6), DEMOS has no `Semi-Annual Budget
   Neutrality Report` type. Options: collapse to `Quarterly`/`Annual` BN,
   route to `Monitoring Report`, or request a new DEMOS type. Needs counts.
2. **`bdgt_ntrlty_ind` vs `bdgt_ntrlty_ovrrdn_ind`.** RESOLVED by the live
   override-comment analysis below: the override is NOT a re-classification of
   the deliverable type. It is a BN-*submission* exception (skip the standard
   BN workbook validation/format and still accept the deliverable), with the
   reason captured in `bdgt_ntrlty_ovrrd_cmt_txt`. An overridden row still
   migrates as a BN type. The one caveat is category C below ("no BN
   requirement applicable"): a few BN-flagged rows are not really BN reports.
3. **File-level vs deliverable-level BN.** Confirm `mdcd_dlvrbl.bdgt_ntrlty_ind`
   is consistent with whether the deliverable has a `bdgt_ntrlty_fil_ind = 1`
   workbook attached. If they disagree, decide precedence.
4. **Name corroboration.** Spot-check `mdcd_dlvrbl_name` against the routing
   result to catch BN reports flagged `bdgt_ntrlty_ind = 0` (or vice versa);
   decide whether a name regex is a fallback signal or only a QA check.
5. **`mdcd_demo_type_cd` on the deliverable** (col 44) — confirm it is not a
   needed routing input (it scopes the demonstration type, not BN-ness).

## Override-comment analysis (live source, read-only probe)

Queried directly against the source MySQL (`mdcd_dlvrbl`) via DuckDB's MySQL
extension, using `MYSQL_URL` from `.env`. Snapshot counts (point-in-time):

- 11,590 deliverable rows total (4,844 soft-deleted).
- 2,970 flagged BN (`bdgt_ntrlty_ind = 1`).
- 34 rows have `bdgt_ntrlty_ovrrdn_ind = 1`; **all 34 are BN** -- the override
  is used exclusively on BN deliverables, confirming it is BN-specific.
- 43 rows carry a non-empty `bdgt_ntrlty_ovrrd_cmt_txt`. Every comment begins
  with the literal prefix `Comment regarding Budget Neutrality submission:`,
  so the override is a **BN-submission exception**, not a type/classification
  change.

Two structural notes: the override flag (34) is rarer than the `Overridden*`
statuses, and 9 of the 43 comments have the flag OFF (`ovrrdn = 0`) while
sitting in `Overridden / Request Resubmission` -- the comment field is reused
on the resubmission path, so a migration must read the comment from both the
flagged rows and the `Overridden*` statuses.

The 43 free-text reasons group into six categories:

| # | Category | ~n | What it means |
|---|---|---|---|
| A | Format/template exception (CMS-approved alternative) | 11 | State used an old/own template or PDF (often due to CMS-64 reconciliation); CMS approved the alternative |
| B | System / technical workaround | 13 | Override to bypass a MACFin/MACPro upload validation, error/glitch, or due-date dispute |
| C | No BN requirement applicable | 6 | BN-flagged but state asserts no real BN obligation (converted to SPA, no enrollees, no BN initiatives) |
| D | Submission pointer / status note | 8 | Comment only says where the file is / that it is pending or attached |
| E | CMS-directed action | 3 | Override taken per explicit CMS approval/request |
| F | Test / junk | 2 | Non-production rows (one soft-deleted) -- filter out |

Implications for the migration:

- **Routing:** an overridden BN deliverable still routes to a BN type
  (`Annual`/`Quarterly Budget Neutrality Report`). Category C is the exception
  -- those rows are mislabeled BN; SME decides whether they should route to
  `Monitoring Report` or be left as BN with a note.
- **The justification must not be silently dropped.** DEMOS has no override
  action in its `deliverable_action` state machine, so categories A/C/E
  (substantive: approved alternative format, no-BN-requirement, CMS direction)
  should land as a `private_comment`/note on the migrated deliverable.
  Categories B/D/F are low-value (transient workarounds, pointers, test data)
  and can be dropped or collapsed into a generic note.
- **Test/junk (F)** and soft-deleted rows are excluded by the existing
  `dltd_ind = 0` filter plus the `stg._valid_demo_ids` scope.

## Verification queries to run once `mysql_raw` is loaded

These produce the counts the routing rule and open questions depend on. They
are read-only and require the pgloader-populated `mysql_raw`.

```sql
-- Distribution of BN flag by coarse type (drives the routing matrix)
SELECT mdcd_dlvrbl_type_cd, bdgt_ntrlty_ind, count(*)
FROM mysql_raw.mdcd_dlvrbl
WHERE dltd_ind = 0
GROUP BY 1, 2 ORDER BY 1, 2;

-- Semi-annual BN rows (open question 1): expect 0; non-zero forces a decision
SELECT count(*) FROM mysql_raw.mdcd_dlvrbl
WHERE dltd_ind = 0 AND bdgt_ntrlty_ind = 1 AND mdcd_dlvrbl_type_cd IN (5,6);

-- BN override interaction (open question 2)
SELECT bdgt_ntrlty_ind, bdgt_ntrlty_ovrrdn_ind, count(*)
FROM mysql_raw.mdcd_dlvrbl WHERE dltd_ind = 0 GROUP BY 1, 2;

-- Name corroboration (open question 4): BN-named rows not flagged BN
SELECT count(*) FROM mysql_raw.mdcd_dlvrbl
WHERE dltd_ind = 0 AND bdgt_ntrlty_ind = 0
  AND mdcd_dlvrbl_name ILIKE '%budget neutrality%';
```

## Deliverable of the implementation phase (after sign-off)

Once the queries above are run and open questions 1-2 answered, the
`deliverable_type` crosswalk becomes a **two-input** mapping
(`mdcd_dlvrbl_type_cd` + `bdgt_ntrlty_ind`) rather than a one-column lookup,
implemented as:

- `reports/crosswalks/proposed/archive/deliverable_type.proposed.csv` extended with a
  `bn_ind` column and one row per (type_cd, bn_ind) combination.
- `sql/04_crosswalks/60_deliverable_type.sql` carrying the matrix and the
  documented `CASE` predicate the stage transform applies.
- `sql/04_crosswalks/61_deliverable_type_check.sql` asserting every resolved
  target exists in the `deliverable_type` seed and that no row resolves to the
  unresolved semi-annual-BN case (fail closed until question 1 is decided).

## Sign-off

| Item | Owner | Date | Decision |
|---|---|---|---|
| Authoritative signal = `mdcd_dlvrbl.bdgt_ntrlty_ind` | Zoe Elkins | 07/08/2026 | Authoritative signal = `mdcd_dlvrbl.bdgt_ntrlty_ind` |
| Semi-annual BN handling (Q1) | Zoe Elkins | 07/08/2026 | Maps to `Quarterly` BN |
| Override semantics (Q2) | Zoe Elkins | 07/08/2026 | For Category C, leave as BN with note |
| File vs deliverable BN precedence (Q3) | Zoe Elkins | 07/08/2026 | File level takes precedence |
| Name signal: fallback or QA-only (Q4) | Zoe Elkins | 07/08/2026 | Fallback|
| `rpt_ocrnc` routing claim (CMA W1/C1) -- disproven, not joinable | | | |

## Appendix: `mdcd_dlvrbl_rpt_ocrnc_rfrnc` vocabulary (documentation only)

The full 43-row report-occurrence reference set from the 2024 dump
(`../cma/db/CMA-Local-20241014.sql`). This is the inherited vocabulary DEMOS
descends from; **none of these codes is joinable to a migrated deliverable**
(see the re-test above), so the table is reference documentation, not a routing
input. The two BN codes are `57` and `70`.

| cd | name | cd | name |
|---|---|---|---|
| 0 | Single/Other | 60 | Mid-point Assessment |
| 1 | Monthly | 61 | Implementation Plan |
| 3 | Quarterly | 62 | Monitoring Protocol |
| 6 | Semi-Annually | 63 | Draft Evaluation Design |
| 12 | Annually | 64 | Final Evaluation Design |
| 50 | Interim Evaluation | 65 | Draft Summative Evaluation Report |
| 51 | Final Evaluation Design | 66 | Final Summative Evaluation Report |
| 52 | Monthly Report | 67 | Draft Interim Evaluation Report |
| 53 | Quarterly Monitoring Report | 68 | Final Interim Evaluation Report |
| 54 | Semi-Annual Monitoring Report | 69 | Phase Down Plan |
| 55 | Annual Monitoring Report | 70 | **Annual Budget Neutrality Report** |
| 57 | **Quarterly Budget Neutrality Report** | 71 | Close Out Report |
| 58 | Site Visit Report | 72 | Transition Plan |
| 59 | Non-standard Report | 73 | Retrospective Report |
| 74 | Quarterly Monitoring Report (QMR) | 82 | Summative Evaluation Report |
| 75 | Annual Monitoring Report (AMR) | 83 | Demonstration Specific Deliverable |
| 76 | HCBS Evidentiary Report | 84 | Evaluation Design |
| 77 | HCBS Quality Improvement Strategy Report | 85 | Approved Payment Rate Increases |
| 78 | HCBS Performance Measures Report | 86 | Attestation for Maintenance of Provider Rate Increases |
| 79 | Analysis of Medicaid/Medicare Payment Ratio | 87 | HCBS Deficiency, Remediation and A/N/E Incident Report (1915(c)-like) |
| 80 | Retrospective Monitoring Report | 88 | HCBS Actual and Estimated Enrollment Number Report (1915(i)-like) |
| 81 | Interim Evaluation Report | | |
