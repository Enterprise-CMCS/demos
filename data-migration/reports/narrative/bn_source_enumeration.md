# Budget-neutrality source enumeration (`bdgt_ntrlty_*` + `mdcd_dlvrbl_fil_doc`)

Branch 8. Enumerates the legacy PMDA MySQL budget-neutrality source tables
and maps them onto `reports/jsonb_schemas/budget_neutrality.schema.json`, the
aggregate validated by `migration.bn_workbook_detail`
(`sql/01_ddl_supplements/10_bn_workbook_detail.sql`). Counts are from
`reports/schema_snapshot/table_stats.csv`; columns from `columns.csv`.

## Workbook identity

A **BN workbook** is one row of `mdcd_dlvrbl_fil_doc` with
`bdgt_ntrlty_fil_ind = 1` (and `dltd_ind = 0`). That file is the unit that
becomes one `demos_app.budget_neutrality_workbook` row, so its uuid (minted in
`migration._id_map_mdcd_dlvrbl_fil_doc`) is reused as both the workbook id and
`migration.bn_workbook_detail.workbook_id`.

Key columns on `mdcd_dlvrbl_fil_doc` (14,763 rows total):

| column | role |
|---|---|
| `mdcd_dlvrbl_fil_doc_id` (PK) | workbook identity / id-map key |
| `mdcd_demo_id` | owning demonstration (filter via `stg._valid_demo_ids`) |
| `bdgt_ntrlty_fil_ind` | **1 = this file is a BN workbook** |
| `dlvrbl_fil_name` / `doc_name` | `workbook_origin` (filename) |
| `dltd_ind` | soft delete |
| `rptg_demo_yr_num`, `rptg_qtr_num`, `demo_yr_txt` | reporting period metadata |
| `tmplt_fil_doc_id` | BN template the file was created from |

## How the detail tables hang together

The fact tables carry **both** `bdgt_ntrlty_demo_yr_id` and
`mdcd_dlvrbl_fil_doc_id`, so a workbook's content is every fact row whose
`mdcd_dlvrbl_fil_doc_id` is that file. Grouping a workbook's facts by
`bdgt_ntrlty_demo_yr_id`, then by `bdgt_ntrlty_mdcd_elgblty_grp_id`, yields the
`demo_years[] -> eligibility_groups[]` nesting in the schema. `demo_yr` and
`mdcd_elgblty_grp` are keyed by `mdcd_demo_id` (not by file) and supply the
year dates / group names.

## Table -> schema-section map

| Source table (rows) | Role | Schema target |
|---|---|---|
| `mdcd_dlvrbl_fil_doc` (14,763) | BN workbook file | top-level row + `workbook_origin` |
| `bdgt_ntrlty_demo_yr` (8,228) | demo years (`sqnc_num`, start/end dt) | `demo_years[]` (`demo_yr_id`, `demo_yr_num`=`sqnc_num`, `begin_dt`, `end_dt`) |
| `bdgt_ntrlty_mdcd_elgblty_grp` (5,765) | eligibility groups (name) | `eligibility_groups[]` (`mdcd_elgblty_grp_id`, `elgblty_grp_name`) |
| `bdgt_ntrlty_mdcd_elgblty_grp_pop` (5,841) | per-group population flags (with/without waiver, hypothetical) | (qualifies groups; not yet emitted) |
| `bdgt_ntrlty_mmbr_mo_actl` (163,071) | actual member-months `mmbr_mo_actl_val_num` | `actuals.member_months` |
| `bdgt_ntrlty_mmbr_mo_prjtd` (162,866) | projected member-months `mmbr_mo_prjtd_val_num` | `projected.member_months` |
| `bdgt_ntrlty_wth_wvr_spnd_prjtd_cst` (532,563) | with-waiver projected spend `wth_wvr_spnd_prjtd_val_num` | `projected.expenditures` |
| `bdgt_ntrlty_wthot_wvr_pmpm_cst` (185,907) | without-waiver PMPM cost | *(deferred — see below)* |
| `bdgt_ntrlty_tot_adjstmt` (273,338) | per-(grp,year) total adjustments | *(deferred)* |
| `bdgt_ntrlty_wvr` (21,181) | waiver definitions (`wvr_name`, map/adm/fed-share flags) | `demo_years[].waivers[]` *(deferred — see below)* |
| `bdgt_ntrlty_wvr_demo_yr_link` (894,164) | waiver <-> demo-year link | join for `waivers[]` *(deferred)* |
| `bdgt_ntrlty_mdcd_elgblty_grp_wvr_link` (652,818) | group <-> waiver link | *(deferred)* |
| `bdgt_ntrlty_pgm_spnd_lmt` (337) | program spend-limit names | `demo_years[].spending_limits[].limit_typ_cd` *(deferred)* |
| `bdgt_ntrlty_pgm_spnd_lmt_cst` (5,620) | spend-limit amount per demo-year | `spending_limits[].limit_amt` *(deferred)* |
| `bdgt_ntrlty_pgm_spnd_lmt_mdcd_elgblty_grp_cst` (6,433) | spend-limit amount per group/year | *(deferred)* |
| `bdgt_ntrlty_smry_tot_cmptbl_vrnc_and_cmltv_pct` (26,955) | per-(file,year) variance + cumulative-target pcts, hypotheticals, dual-demo amounts | `summary` *(deferred — shape mismatch)* |
| `bdgt_ntrlty_smry_tot_cmptbl_phase_down_pct` (41,588) | phase-down pcts | `summary` *(deferred)* |
| `bdgt_ntrlty_demo_fscl_yr` (15,776), `bdgt_ntrlty_demo_yr_fscl_yr_link` (16,482) | demo-year <-> federal-fiscal-year mapping | *(not in schema; provenance only)* |
| `bdgt_ntrlty_fil_doc_smry/stus/cmt/msg`, `bdgt_ntrlty_tmplt_fil_doc` | workbook status / comments / messages / template | *(workbook-row + document metadata, not the JSON aggregate)* |
| `bdgt_ntrlty_mdcd_elgblty_grp_pop_rfrnc` (65) | population reference codes | crosswalk lookup |

## What `sql/10_stg/60_budget_neutrality.sql` materializes now (v1)

Schema-valid aggregate built from the high-confidence joins only:

- `version` = `"1.0"`, `workbook_origin` = filename.
- `demo_years[]` from `bdgt_ntrlty_demo_yr` (inner join; rows missing year
  metadata are dropped, surfacing as a data-quality signal).
- `eligibility_groups[]` per (file, year), with:
  - `actuals.member_months` = sum of `mmbr_mo_actl`,
  - `projected.member_months` = sum of `mmbr_mo_prjtd`,
  - `projected.expenditures` = sum of `wth_wvr_spnd_prjtd_cst`.

All other schema properties are optional, so omitting them keeps the
aggregate valid against the registered `budget_neutrality` schema (the
`bn_workbook_detail` constraint trigger).

## Deferred enrichments (need loaded source + SME confirmation)

1. **`actuals.expenditures`** — no obvious *actual* expenditure table; the
   cost tables are projection-oriented (`wth_wvr_spnd_prjtd`, `wthot_wvr_pmpm`).
   Confirm whether actual expenditures exist or are out of scope.
2. **`by_month` arrays** — `mmbr_mo_*` rows appear to be one value per
   (group, year, file) with no month column; confirm whether monthly
   granularity exists before populating `by_month`.
3. **`waivers[]`** — `bdgt_ntrlty_wvr` exposes `wvr_name` and boolean flags
   (`map_ind`, `adm_ind`, `fed_shr_ind`, `tot_cmptbl_ind`) but no
   `wvr_typ_cd` / `wvr_amt` / `wvr_basis`. The schema's waiver fields need an
   SME mapping rule, not a 1:1 column copy.
4. **`spending_limits[]`** — `pgm_spnd_lmt` is keyed by
   `bdgt_ntrlty_tmplt_fil_doc_id` (template), not `mdcd_dlvrbl_fil_doc_id`;
   tying a limit to a specific workbook file is indirect.
5. **`summary`** — the schema wants `total_with_waiver` /
   `total_without_waiver` / `savings`, but the legacy summary table carries
   variance/cumulative-target percentages and 30 hypothetical columns. These
   are different quantities; decide whether `summary` is computed (sums of the
   cost tables) or sourced.

## Open assumptions (SME)

- `demo_yr_num` = `bdgt_ntrlty_demo_yr.sqnc_num` (assumed 1-based; the schema
  requires `>= 1`). If `sqnc_num` can be 0/NULL, the parity trigger will
  fail closed for that workbook — by design — flagging the bad row.
- Soft deletes (`dltd_ind = 1`) are excluded throughout.
- BN files are scoped to PMDA-valid demonstrations (`stg._valid_demo_ids`).
