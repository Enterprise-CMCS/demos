# Waiver & expenditure authorities: SME cover note (workflow 5)

Ships alongside the CSVs produced by
`scripts/sme_review_exports.py authorities-snapshot`
(`make sme_review_exports ARGS="authorities-snapshot"`; outputs land in the
gitignored `reports/runs/` and are shared out-of-band). Row counts here are from
`reports/schema_snapshot/table_stats.csv`; columns from `columns.csv`. For the
disposition record and the decisions behind this, see
`pending_approved_decisions.md` D5.

## TL;DR

PMDA tracks about 38 tables of Section 1115 waiver and expenditure authorities.
Strip out the lookups and the technical history/pending copies and the real
content is small: roughly 1,600 rows of actual authorities attached to
demonstrations, keyed by expiration dates, cap amounts, and the sections each
authority waives. DEMOS has no place to store any of it, so we're not loading
it. Instead we snapshot the whole corpus as-is (soft-deleted rows included, with
a `demonstration_id` resolved wherever the source allows) so it stays reviewable
and can be reloaded later if that changes.

Two things need your call, and both are flagged in the manifest rather than
decided in code: whether `mdcd_emer_wvr_authrty_pgm_dtl` migrates as a
workflow-4 tag, a workflow-5 authority, or both (it's claimed by both), and how
much of the deleted/history/pending material a future load should keep. One
heads-up: the "na" expenditure family is population-scoped and clearly its own
class, but I can't tell you what CMS formally calls the "na" prefix, so confirm
that.

If you only read one table, read `mdcd_demo_expndtr_authrty` (462 rows). It's
the largest, and the only one tied to dollars.

## What's actually in the PMDA authority tables

A Section 1115 demonstration carries two legally separate kinds of authority, and
PMDA keeps them in two parallel families:

- Waiver authorities, under §1115(a)(1). These let a state skip specific Medicaid
  state-plan rules: statewideness, comparability, freedom of choice, and so on.
  Each one is a citation with an effective and an expiration date.
- Expenditure authorities, under §1115(a)(2). These let the state claim federal
  match on costs that regular Medicaid wouldn't cover. Each carries a category, a
  performance period, and sometimes a dollar cap.

Almost everything else in the corpus is scaffolding around those two: lookups
that decode the codes, catalog tables the instances point at, a program-detail
table that collides with workflow 4, beneficiary-group links, and a pile of
history and pending copies you can mostly ignore.

## The per-demo instances (this is the part that matters)

These rows are the authorities actually granted to each demonstration.

`mdcd_demo_wvr_authrty` (354) holds the waiver authorities on each demo: title
code, description, effective and expiration dates. Its child
`mdcd_demo_wvr_authrty_sect` (413) breaks each authority into the specific
sections waived, each with a qualifier description and a sequence number for
ordering. One authority usually spans several sections.

`mdcd_demo_expndtr_authrty` (462) is the big one, and the only place tied to
money. Each row is one expenditure authority: title code, category code, a name,
a performance period (`prfmnc_prd_from_dt`/`to_dt`), a description, and the cap
pair `expndtr_cap_ind` (is it capped?) plus `expndtr_cap_amt` (the ceiling). It
also keeps a full soft-delete and audit trail (`dltd_ind`, `dltd_rsn_txt`,
`dltd_dt`, `dltd_user_id`, plus created/updated stamps).

`mdcd_demo_expndtr_authrty_cap` (3) and `..._cap_link` (8) handle the case where
one cap amount is shared across several expenditure authorities on the same demo.
The link table is the join. Tiny in volume, but it's the seam between this data
and Budget Neutrality, so worth knowing it exists.

`mdcd_demo_na_expndtr_authrty` (166) and its child `..._sect` (176) are a
separate, population-scoped class of expenditure authority. The parent has a
populations text field (`na_expndtr_authrty_pops_txt`) and its own expiration;
the section child follows the same qualifier-plus-sequence shape as the waiver
sections. I can tell you it's population-targeted and section-structured. I can't
tell you what CMS actually calls the "na" prefix, so that one needs your read.

## Reference lookups

Small decoder tables, nothing to review. They turn codes into words:
`expndtr_authrty_ctgry_rfrnc` (20) for category names,
`expndtr_authrty_title_rfrnc` (2) and `wvr_authrty_title_rfrnc` for titles,
`mdcd_emer_wvr_authrty_type_rfrnc` (3) for emergency-waiver types, and the
`wvr_authrty_sect` / `na_expndtr_authrty_*_rfrnc` / `*_qlfyr_prex_rfrnc` tables
for the section and qualifier vocabulary.

## Catalog masters

These are the FK targets behind the `*_authrty_id` columns: reusable definitions
the instances point at. `wvr_authrty` (82) is the waiver catalog (name, owning
`mdcd_demo_id`, approval flag). `na_expndtr_authrty` (44) and
`mltss_pgm_wvr_authrty` (49) are the "na" and MLTSS-program catalogs.
`expndtr_authrty` is empty (0 rows), which tells you the per-demo expenditure
rows stand on their own rather than pointing at a shared master. The `*_sect`,
`*_sect_asctn`, `*_cart`, and `*_qlfyr_prex_rfrnc` tables carry the section
associations and groupings.

## The one table that needs your ruling

`mdcd_emer_wvr_authrty_pgm_dtl` (36) records emergency-waiver authority as a
program-detail row (`mdcd_demo_id`, `mdcd_pgm_id`, `type_cd`, from/to dates,
delete flag). The catch: "Emergency Waiver Authority" also exists in DEMOS as a
flat demonstration-type tag under workflow 4. Both workflows claim it. The
snapshot flags it `pgm_dtl_overlap=1` and leaves the decision to you: workflow-4
tag, workflow-5 authority, or both? Its expenditure-cap sibling
`mdcd_expndtr_cap_pgm_dtl` follows the same pattern but is empty today.

## Bene-group links

How authorities attach to populations. `bene_grp_asctd_wvr` (35) links a
beneficiary group to a waiver (with the associated waiver and section codes);
`bene_grp_asctd_expndtr_authrty` (12) links a group to a specific
`mdcd_demo_expndtr_authrty` row. Small, but these rows are what tell you which
populations a given authority governs.

## History and pending copies (skip unless you want the audit trail)

Engineering artifacts, not new authorities. They're in the snapshot only so
nothing gets dropped silently, and the manifest flags them `is_history` /
`is_pending`: `mdcd_demo_expndtr_authrty_hstry` (156), `_load` (340),
`_cap_hstry` (4), `mdcd_emer_wvr_authrty_pgm_dtl_hstry` (30), plus the pending
emergency-waiver mirrors `mdcd_pendg_emer_wvr_authrty_pgm_dtl` (104) and `_hstry`
(106).

## What this means for you

DEMOS has nowhere to put any of this. There's no waiver, expenditure, or
authority entity in the target model, so we're not loading it anywhere. The
snapshot keeps the whole corpus as-is (every row, including soft-deleted, with a
resolved `demonstration_id` wherever the source has `mdcd_demo_id`) so it stays
reviewable and reloadable if that ever changes.

Two calls are yours, not ours: the emergency-waiver overlap above, and how much
of the deleted/history/pending material a future load should keep. We flagged
both in the manifest rather than guessing in code.

On Budget Neutrality: the only dollars here are `expndtr_cap_amt`. BN spend
reaches DEMOS through a separate workbook keyed by a free-text "Waiver Name", not
these structured records, so the two don't need reconciling in this migration.
The cap amounts are in the snapshot anyway so you can see them in context.
