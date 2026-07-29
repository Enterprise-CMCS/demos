# pgm_dtl_tag: SME decisions (ratified 2026-07-09, applied)

> **Status: RATIFIED & APPLIED.** All ten decisions below are approved and
> transcribed into `reports/pgm_dtl_tag_mapping.csv`; `make crosswalk_audit` no
> longer lists any pgm_dtl SME-pending row. This file is retained as the
> decision record. `mdcd_othr_pgm_dtl` stays intentionally free-text (no fixed
> tag) and its held names are exported non-gating in `99_parity/54`
> (`migration._parity_pgm_dtl_tag_othr_held`) for SDG review.

The `crosswalk_pgm_dtl_tag` structural crosswalk
(`reports/pgm_dtl_tag_mapping.csv`) pivots each legacy `mdcd_*_pgm_dtl`
program-detail table into a canonical DEMOS demonstration tag. Ten source
tables originally had a **blank `tag_name`**: their canonical tag was an SME
decision, not a data-backed identity, so they were deliberately left unmapped
rather than guessed -- now ratified below and filled in the mapping CSV.

The crosswalk audit (`scripts/crosswalk_audit.py`, source `cma_pro_11_1_000`,
2026-06-30) originally surfaced these as informational *SME-pending* rows. This
file was the escalation list: it pairs each blank with its candidate tag
(verbatim from the mapping CSV `notes`) and the live row volume, so an SME could
ratify in one pass. The decisions are now applied: the *SME decision* column is
filled, `reports/pgm_dtl_tag_mapping.csv` carries every tag, and
`make crosswalk_audit` no longer flags them.

## Decisions needed

Row volumes are live PROD counts (all rows / `dltd_ind = 0` active).

| Source table | Rows (all/active) | Candidate tag (from notes) | SME decision | Notes |
|---|---|---|---|---|
| `mdcd_bnfts_pgm_dtl` | 20 / 11 | Benefits | _approved_ | No canonical tag; confirm scope or create a new tag. |
| `mdcd_dgns_and_dease_specf_pgm_dtl` | 4 / 0 | Diagnosis/Disease Specific | _approved_ | No canonical tag; confirm scope or new tag. All rows soft-deleted. |
| `mdcd_dsh_pgm_dtl` | 2 / 1 | Disproportionate Share Hospital (DSH) | _approved_ | No canonical tag; confirm scope or new tag. |
| `mdcd_elgblty_and_cvrg_pgm_dtl` | 64 / 26 | Eligibility and Coverage | _approved_ | No canonical tag; confirm scope or new tag. Highest active volume of the ten. |
| `mdcd_emer_wvr_authrty_pgm_dtl` | 36 / 20 | Emergency Waiver Authority | _approved_ | **Non-standard date columns**: use `mdcd_emer_wvr_authrty_from_dt` / `mdcd_emer_wvr_authrty_to_dt` (already recorded in the mapping CSV). |
| `mdcd_fincl_pool_pgm_dtl` | 0 / 0 | Financial Pool | _approved_ | No canonical tag; table currently empty in PROD. |
| `mdcd_hlthy_adlt_oprtnty_pgm_dtl` | 4 / 0 | Healthy Adult Opportunity | _approved_ | **Multiple candidate date periods**: pick from `hlthy_adlt_oprtnty_from_dt/to_dt`, `percapita_oprtnty_from_dt/to_dt`, or `agg_cap_oprtnty_from_dt/to_dt`. All rows soft-deleted. **Use `hlthy_adlt_oprtnty_from_dt/to_dt`** |
| `mdcd_intgrtd_care_pgm_dtl` | 3 / 1 | CMMI - Integrated Care for Kids (IncK) | _approved_ | Kids-specific candidate (IncK) is Confirmed. |
| `mdcd_othr_pgm_dtl` | 158 / 62 | (free-text, per-row) | _approved_ | **Free-text "Other" program**: tag derives from `mdcd_othr_pgm_dtl_name`, not a fixed vocabulary. Needs a derivation rule, not a single tag. Largest table of the ten. Export list of these “Other” names so we can send to SDG for review |
| `mdcd_prm_pgm_dtl` | 13 / 6 | Premiums/Cost-Sharing | _approved_ | Confirmed "Premiums/Cost-Sharing"; confirmed vs `mdcd_prm_astnc_pgm_dtl` (already tagged "Premium Assistance/ESI/QHP") to avoid overlap. |

## Three rows need more than a tag name

- `mdcd_emer_wvr_authrty_pgm_dtl` -- non-standard date columns (resolved in the
  mapping CSV; the tag is the only open item).
- `mdcd_hlthy_adlt_oprtnty_pgm_dtl` -- the canonical from/to date period is `hlthy_adlt_oprtnty_from_dt/to_dt`
- `mdcd_othr_pgm_dtl` -- not a single tag at all; requires a derivation rule
  over the free-text `mdcd_othr_pgm_dtl_name` column.
  - Use the derivation rule to extract list of these "Other" tags and add them to a report for SDG review. Don't gate on them.  

## How to apply a ratified decision

1. Set `tag_name` (and, for the special cases, the date columns) on the matching
   row in `reports/pgm_dtl_tag_mapping.csv`.
2. Rerun `make crosswalk_audit`; the table drops out of the SME-pending list.
3. Record the ratification in `_review.md`.
