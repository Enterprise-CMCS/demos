# Document + document_type migration (Scope C: crosswalk + metadata-only loader)

**Status**: Proposed. David input received 2026-07-17 (D2-D4); `cmt_orgn_cd`
and `fil_doc_cd` reverse-engineered from the source DB (D5-D6). Still open: the
orphan/soft-deleted drops, application code `10`, family scope, and the
David-owned `s3_path` / `6`,`7`,`99` rubber-stamp / seed-legality items.
**Date**: 2026-07-16
**Scope decision (owner-confirmed)**: crosswalk reconciliation + metadata-only
loader; all source families addressed; metadata now, real blob/S3 migration
deferred to the DEMOS team.
**Canonical copy**: `~/.factory/specs/2026-07-16-document-document_type-migration-scope-c-crosswalk-metadata-only-loader.md`

---

## Goal

Take documents from "application-subset crosswalk only, unconsumed" to: all
in-scope source families mapped to a valid DEMOS type, fail-closed validated,
SME/David-signed, and consumed by a metadata-only `demos_app.document` loader.
Real file blobs / S3, `deliverable_action` (state-2 submission linkage), and the
full `reference` loader are explicitly deferred.

## Grounded target contract (pinned DDL `30c6ee7c...`)

- `document` NOT NULL columns: `id`, `name`, `s3_path`, `owner_user_id`,
  `document_type_id`, `application_id`; nullable `phase_id`, the deliverable
  linkage columns, and `description`.
- Composite FKs force legal combinations:
  `document(phase_id, document_type_id)` references `phase_document_type`, and
  `document(deliverable_type_id, document_type_id)` references
  `deliverable_type_document_type`. `document_type` and both junction tables are
  Prisma-seeded (see `state/prisma_seeded_tables.json`), so a mapping must target
  a seeded value that is also legal in its phase / deliverable-type context.
- Three-state deliverable routing enforced by `check_deliverable_null_states`
  and `no_submitted_deliverable_cms_files` (see the derivation spec's Table 5).
- `check_non_empty_s3_path` applies to `document` and `reference`;
  `document_pending_upload` is the only document variant without an `s3_path`
  column.

## Family dispositions (all families addressed)

| Family | Source (rows) | Target | Type crosswalk |
|---|---|---|---|
| Application docs | `mdcd_demo_aplctn_doc` | `document` (app-scoped, phase-linked, non-deliverable) | extend existing `document_type.csv` |
| Deliverable files | `mdcd_dlvrbl_fil_doc` (16,201 total / 12,735 live; BN-flagged out of scope, D3) | `document` (deliverable-linked; origin `cmt_orgn_cd` S=state / C=CMS, D5) | General File default (D2) + monitoring types (D6); see source profile |
| Site-visit files | `mdcd_demo_sv_fil_doc` (6) | `document` if app-resolvable, else drop | new small map |
| Authority files | `mdcd_demo_authrty_fil_doc` (77) | scope call (authorities out-of-scope) | disposition only |
| Final-decision files | `mdcd_demo_finl_dcsn_dtl_fil_doc` (15) | `document` or drop | new small map |
| Templates | `tmplt_fil_doc` (335) | `reference` (library; loader deferred) | new reference-type map |
| Reference materials | `rfrnc_matl` (281) | `reference` (+ tags; loader deferred) | new reference-type map |
| Help/support | `mdcd_help_and_sprt_matl_type_rfrnc` | `reference` / drop | disposition only |
| BN files | `bdgt_ntrlty_*` | out-of-scope (retired / DEMOS-owned) | none |

## Source profile: `mdcd_dlvrbl_fil_doc` (live, `dltd_ind=0`, 2026-07-16)

Read-only DuckDB-over-MySQL profile of the live source. The schema snapshot's
14,483 is stale; the table is 16,201 rows total, 12,735 live, 3,466
soft-deleted. `mdcd_dlvrbl_fil_doc_id` is an auto-increment row number and is
not mapped; files group on `mdcd_dlvrbl_id`.

Files per deliverable: 5,410 live deliverables hold 12,735 live files; average
2.35, median 1, max 64 (p90 5, p95 7, p99 11).

| Files per deliverable | Deliverables | Files |
|---|---|---|
| 1 | 2,752 (50.9%) | 2,752 |
| 2 | 1,094 (20.2%) | 2,188 |
| 3 | 560 (10.4%) | 1,680 |
| 4-5 | 582 (10.8%) | 2,558 |
| 6-10 | 355 (6.6%) | 2,561 |
| 11-20 | 62 (1.1%) | 821 |
| 21+ | 5 | 175 |

Type signal is weak and mostly absent:

- `fil_doc_cd` is NULL for 10,857 of 12,735 live files (85%). The only populated
  values are `1` (1,537), `3` (189), `2` (90), `9` (34), `7` (28) -- ~1,878
  files total.
- Boolean type flags cover only ~15%: `bdgt_ntrlty_fil_ind` 1,613,
  `mntrg_rpt_fil_ind` 279, `mntrg_prtcl_fil_ind` 62; 10,781 files (85%) carry no
  type flag at all. `upld_aftr_acptd_ind` is set on 499.

Origin signal (`cmt_orgn_cd`, char(1) default `S`): `S`=12,387 (97.3%),
`C`=348 (2.7%) -- the likely state-submitted vs CMS-attached distinction.

Integrity: 166 live files reference a `mdcd_dlvrbl_id` that is missing or
soft-deleted in `mdcd_dlvrbl` (orphans to drop).

Implication: typing reduces to General File plus the two monitoring types; see
D5 (`cmt_orgn_cd` origin) and D6 (`fil_doc_cd` typing), both resolved from the
source DB.

## Work items

Test-driven, fail-closed, stacked branches off `main`; re-invoke the
`migration-tdd` and `live-pg-tester` skills.

1. **Seed-input snapshot.** Capture the seeded `document_type` domain plus the
   legal `phase_document_type` and `deliverable_type_document_type` pairs (read
   from `demos_app` after `ddl`) as crosswalk inputs, so mappings can be checked
   against composite-FK legality rather than only the type domain.
2. **Application family.** Add the missing code `10` (Final Budget Neutrality
   Formulation Workbook) to `document_type.csv`; record David's rubber-stamp for
   codes `6`/`7`/`99`.
3. **Deliverable-file typing.** Per D6, `fil_doc_cd` mirrors the type flags:
   `1`=BN (excluded, D3), `2`/`3`=Monitoring Report, `7`/`9`=Monitoring Protocol,
   NULL/no-flag=General File (D2 default, with the crosswalk CSV as the
   correction point). The `2`/`3` and `7`/`9` pairs each collapse to one DEMOS
   type. A crosswalk (CSV under `reports/crosswalks/`, DDL under
   `sql/04_crosswalks/`, a `registry.yaml` entry, and a fail-closed check)
   encodes this, respecting `deliverable_type_document_type`. Remaining
   dependency: confirm the Monitoring Report and Monitoring Protocol DEMOS types
   are legal for the relevant deliverable types (David seed-legality item).
4. **Small families.** Site-visit and final-decision crosswalks; authority-file
   disposition.
5. **Library families.** Reference-type crosswalk(s) for templates, reference
   materials, and help/support into the DEMOS `reference` type domain; the
   `reference` loader itself is deferred (crosswalk + disposition + accounting
   only for now).
6. **Validation.** Per-family fail-closed checks plus a `sql/99_parity` coverage
   check confirming every migrated document's `(context, document_type_id)` is a
   seeded legal pair; unmapped in-scope codes fail closed; held or dropped rows
   are logged non-gating.
7. **Staging.** Author `stg.document_resolved` (metadata-only projection) and
   thereby activate the currently inert
   `sql/10_stg/27_document_deliverable_link_resolved.sql`.
8. **Metadata-only loader.** A new loader under `sql/20_app/` routes by
   `cmt_orgn_cd` (D5): `C` -> state 3 (CMS-attached), `S` -> state 2
   (state-submitted); state 1 for non-deliverable docs. Caution (David): this
   file-origin concept is distinct from comment visibility (Private vs Public);
   the `cmt_` prefix on the file column is a naming trap, and the comment
   table's same-named column carries a different 6-value domain. `owner_user_id`
   falls back to the demonstration's Primary Project Officer, or the DDME for
   monitoring and evaluation deliverables (D4). `s3_path` is handled per the
   David decision below (sentinel path vs `document_pending_upload`).
9. **Parity + docs.** Completeness / integrity / held checks; update
   `reports/source_target_columns.csv`, the wiki, and the CHANGELOG; run
   `make verify`, `verify_doc_facts.py`, and the live idempotency / parity
   suites; add a decision record.

## Decisions requiring SME / David sign-off

### SME (still open)
- **Application code `10`.** Target type: BN Workbook, General File, or a new
  type. (This is a document label, unrelated to the retired BN corpus.)
- **Family scope.** Confirm authority, site-visit, and final-decision files
  migrate to `document` vs drop; confirm templates, reference materials, and
  help/support route to `reference` vs drop.
- **Drops -> Stephanie Hauf / Liz Hill.** David defers the 166 orphaned live
  files and 3,466 soft-deleted rows to SH/LH. Proposed disposition: exclude from
  DEMOS but preserve out-of-band (export the table to a spreadsheet and copy the
  files to a shared folder), since these are already unreachable in PMDA today.

### David (still open)
- **Rubber-stamp** the codes `6`/`7`/`99` folds (General File / BN Workbook),
  currently "pending, non-blocking."
- **`s3_path` strategy** for metadata-only documents: a sentinel path (downloads
  404 until blobs move), `document_pending_upload` (no `s3_path`, but
  semantically "upload in progress"), or block. This owner also holds the
  deferred real blob-to-S3 migration.
- **Seed legality.** Confirm the seeded `phase_document_type` and
  `deliverable_type_document_type` combinations cover the migrated codes, or
  point to the source of truth so mappings can be checked before load.

## Resolved decisions

### D1 (2026-07-16): deliverable status source = `mdcd_dlvrbl.mdcd_dlvrbl_crnt_stus_cd`

Deliverable status is sourced directly from `mdcd_dlvrbl.mdcd_dlvrbl_crnt_stus_cd`
(ref `mdcd_dlvrbl_stus_rfrnc`). The BN-file "acceptance status" is not used, and
`mdcd_dlvrbl_fil_doc.upld_aftr_acptd_ind` is not a tie-breaker between the two.

Evidence (read-only source profile, live rows):

- Acceptance status (`mdcd_dlvrbl_acptnc_stus_cd`) is BN-only. It is referenced
  by a single table, `bdgt_ntrlty_fil_doc_stus`; all 1,771 acceptance rows
  (1,302 distinct files) resolve to `bdgt_ntrlty_fil_ind=1` files (0 monitoring,
  0 non-BN). BN is retired / DEMOS-owned, so acceptance status is out of scope.
- `upld_aftr_acptd_ind` does not align with acceptance status: of 499 live files
  with the flag set, 466 (93%) are non-BN (no acceptance status) and only 33 are
  BN. Just 3 files have the flag set and both a deliverable status and an
  acceptance status -- no meaningful tie to break.
- The two enums are disjoint vocabularies (deliverable status 17 values,
  acceptance status 7 values) and never agree by name (0 matches; the dominant
  pair is "Accepted" / "Past Due"). They also reuse integer codes with different
  meanings (code `6` = "Accepted" for deliverable status but "Past Due" for
  acceptance status), so they must never be compared by raw code.

Relating acceptance status to a deliverable must bridge through the file
(`bdgt_ntrlty_fil_doc_stus.mdcd_dlvrbl_fil_doc_id` ->
`mdcd_dlvrbl_fil_doc.mdcd_dlvrbl_id` -> `mdcd_dlvrbl.mdcd_dlvrbl_id`), not by
equating a file id to a deliverable id. Bridged correctly, the 1,302 BN files
with acceptance status span 1,078 deliverables.

### D2 (2026-07-17, David): untyped deliverable files default to "General File"

DEMOS deliverables only carry general files, so the ~85% of live files with no
`fil_doc_cd` and no type flag default to the DEMOS **General File** type. David
notes it is unlikely that all of them are truly general files, so the migration
must allow for later corrections; the crosswalk CSV is the correction point and
post-migration reclassification is expected. See D7: the parent deliverable
(type + name), not the sparse file-level tag, is the richer classifier and the
recommended basis for that reclassification.

### D3 (2026-07-17, David): BN-flagged deliverable files are out of scope

The 1,613 live files with `bdgt_ntrlty_fil_ind=1` are out of scope, consistent
with the retired / DEMOS-owned budget-neutrality machinery. They are excluded
from the deliverable-file loader.

### D4 (2026-07-17, David): owner fallback = Primary Project Officer (DDME for M&E)

When the source uploader (`user_id`) is not in the migrated users, `owner_user_id`
falls back to the demonstration's Primary Project Officer. For monitoring and
evaluation deliverables, prefer the demonstration's DDME when available.

### D5 (2026-07-17, source-derived): `cmt_orgn_cd` on the file table = file origin (S=state, C=CMS)

`mdcd_dlvrbl_fil_doc.cmt_orgn_cd` is the file-origin signal David described:
`S` = state-attached, `C` = CMS-attached. PMDA application source is not
available in this environment, so this was reverse-engineered from the source DB
(authoritative). Cross-tabbing origin against the uploader's PMDA role
(`user_role_asgnmt` -> `role_rfrnc`) on live rows: `S` files are uploaded by the
`State User` role in 12,368 / 12,388 cases (99.8%); `C` files are uploaded by
CMS / federal-side roles (CMS Project Officer, CMS Technical Director, DDME
Analyst, Monitoring/Financial Lead, Internal Administrator) in 347 / 348 cases
(99.7%). Only S/C occur (no other values).

Caution (David, confirmed): this is a different concept from the same-named
`cmt_orgn_cd` on the comment table (`mdcd_dlvrbl_cmt`), which has a 6-value
domain `{A,B,C,I,R,S}` routing to Private/Public visibility. Same column name,
two tables, two meanings; the `cmt_` prefix on the file column is a naming trap.
The loader routes `C` -> state 3 (CMS-attached) and `S` -> state 2
(state-submitted).

### D6 (2026-07-17, source-derived): `fil_doc_cd` mirrors the type flags 1:1

The populated `fil_doc_cd` values align exactly with the boolean type flags on
live rows, so they carry no information beyond the flags and collapse to three
DEMOS meanings:

- `1` <-> `bdgt_ntrlty_fil_ind=1` (Budget Neutrality), 1,537 files -> excluded (D3).
- `2`, `3` <-> `mntrg_rpt_fil_ind=1` (Monitoring Report), 90 + 189 = 279 files ->
  one DEMOS "Monitoring Report" type (code `2` additionally carries
  `proc_mntrg_rpt_ind` on 37 rows; both variants collapse).
- `7`, `9` <-> `mntrg_prtcl_fil_ind=1` (Monitoring Protocol), 28 + 34 = 62 files
  -> one DEMOS "Monitoring Protocol" type (protocol report vs workbook collapse,
  exactly David's example).
- NULL / no flag -> General File (D2 default).

Every typed file is `cmt_orgn='S'` (state-submitted); all 348 CMS-attached files
are untyped. The only remaining dependency is confirming the Monitoring Report
and Monitoring Protocol DEMOS types are legal per `deliverable_type_document_type`
(David seed-legality item).

### D7 (2026-07-17, source-derived): the ~10,782 "General File" files are typed by their deliverable, not the file tag

The file-level type (`fil_doc_cd` / boolean flags) is applied to only ~15% of
live files. The ~10,782 untyped files are not genuinely uncategorized; they are
substantive deliverable documents that were simply never tagged. Three
independent signals agree (read-only source profile, live rows):

- **Parent deliverable name** (strongest): monitoring 4,597 (43%), other reports
  1,614, evaluation/design 1,351, quarterly reports 1,305, annual reports 780,
  plans 233, protocols 174, interim/summative eval 73, STC/terms 46,
  budget-neutrality reports 30, extension/amendment/waiver 47; only ~527 (5%)
  are uncategorizable by deliverable context.
- **File format** (real extension is in `doc_name`; `dlvrbl_fil_name` is
  `doc_name` + a version suffix like `.0`, which garbles naive extension
  parsing): pdf 4,811 (45%), docx 2,877 (27%), xlsx 2,498 (23%), xlsm 300,
  zip 161, xls 79, doc 40 -- ~72% narrative documents, ~26% spreadsheets.
- **File name**: names are explicit (e.g. `1115 Waiver Monitoring Report Q2
  Final.pdf`, `OK_SMI-DY3Q2_Report_Part-A_20230829.xlsx`, `... Summative
  Evaluation Report_Final...pdf`), often clearly monitoring/evaluation despite
  no file-level tag.

Implication: "General File" (D2) is a defensible day-one default but a lower
bound that masks real categories. Context is preserved through the deliverable
link, so nothing is lost; the recommended reclassification path (D2 correction
point) is to derive `document_type` from the parent deliverable's type/name plus
filename heuristics (e.g. `Report_Part-A` -> monitoring report workbook), which
is far richer than the sparse `fil_doc_cd`. Two edges: the parent deliverable
type-code space (`mdcd_dlvrbl_type_cd` values `0` and `50`-`88`) does not resolve
against `mdcd_dlvrbl_type_rfrnc` (codes `1`-`8`; code `8` = "Demonstration
Specific"), so a fuller deliverable-type reference must be located or the
deliverable *name* is the authoritative label (see Deferred); and ~30 general
files hang off budget-neutrality-*named* deliverables but are not BN-*flagged*
(`bn=0`), so D3 does not exclude them and they migrate as General File.

## Deferred / out-of-scope (recorded, not built)

Real file-blob / S3 migration; `deliverable_action` derivation (the deliverable's
own submission lifecycle; state-2 file routing is driven by `cmt_orgn_cd`, D5);
locating the fuller deliverable-type reference behind `mdcd_dlvrbl_type_cd`
values `0` / `50`-`88` (only codes `1`-`8` resolve today; needed for the D7
deliverable-context reclassification); post-migration document reclassification
from deliverable type/name + filename heuristics (D2 / D7); the full `reference`
/ `reference_tag_assignment` loader; `document_history` / `document_infected` /
pending-upload lifecycle; BN documents and BN-flagged deliverable files (D3).

## Deliverables

Completed and extended crosswalks plus `registry.yaml` entries and fail-closed
checks; the seed-input snapshot; `stg.document_resolved`; the metadata-only
`sql/20_app` document loader (states 1/3); parity checks; column-map, wiki, and
CHANGELOG updates; and a decision record capturing the SME/David items above.
