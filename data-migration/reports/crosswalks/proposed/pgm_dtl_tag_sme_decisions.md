# pgm_dtl_tag: SME decisions pending

The `crosswalk_pgm_dtl_tag` structural crosswalk
(`reports/pgm_dtl_tag_mapping.csv`) pivots each legacy `mdcd_*_pgm_dtl`
program-detail table into a canonical DEMOS demonstration tag. Ten source
tables have a **blank `tag_name`**: their canonical tag is an SME decision, not
a data-backed identity, so they were deliberately left unmapped rather than
guessed.

The crosswalk audit (`scripts/crosswalk_audit.py`, source `cma_pro_11_1_000`,
2026-06-30) surfaces these as informational *SME-pending* rows. This file is the
escalation list: it pairs each blank with its candidate tag (verbatim from the
mapping CSV `notes`) and the live row volume, so an SME can ratify in one pass.
**Nothing here is auto-applied** -- fill the *SME decision* column, then update
`reports/pgm_dtl_tag_mapping.csv` and rerun `make crosswalk_audit`.

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
| `mdcd_hlthy_adlt_oprtnty_pgm_dtl` | 4 / 0 | Healthy Adult Opportunity | _approved_ | **Multiple candidate date periods**: pick from `hlthy_adlt_oprtnty_from_dt/to_dt`, `percapita_oprtnty_from_dt/to_dt`, or `agg_cap_oprtnty_from_dt/to_dt`. All rows soft-deleted. |
| `mdcd_intgrtd_care_pgm_dtl` | 3 / 1 | CMMI - Integrated Care for Kids (IncK) | _approved_ | Only candidate is kids-specific (IncK); confirm whether it fits or a new tag is needed. |
| `mdcd_othr_pgm_dtl` | 158 / 62 | (free-text, per-row) | _approved_ | **Free-text "Other" program**: tag derives from `mdcd_othr_pgm_dtl_name`, not a fixed vocabulary. Needs a derivation rule, not a single tag. Largest table of the ten. |
| `mdcd_prm_pgm_dtl` | 13 / 6 | Premiums/Cost-Sharing | _approved_ | Likely "Premiums/Cost-Sharing"; confirm vs `mdcd_prm_astnc_pgm_dtl` (already tagged "Premium Assistance/ESI/QHP") to avoid overlap. |

## Three rows need more than a tag name

- `mdcd_emer_wvr_authrty_pgm_dtl` -- non-standard date columns (resolved in the
  mapping CSV; the tag is the only open item).
- `mdcd_hlthy_adlt_oprtnty_pgm_dtl` -- the canonical from/to date period is
  itself undecided among three candidate column pairs.
- `mdcd_othr_pgm_dtl` -- not a single tag at all; requires a derivation rule
  over the free-text `mdcd_othr_pgm_dtl_name` column.

## How to apply a ratified decision

1. Set `tag_name` (and, for the special cases, the date columns) on the matching
   row in `reports/pgm_dtl_tag_mapping.csv`.
2. Rerun `make crosswalk_audit`; the table drops out of the SME-pending list.
3. Record the ratification in `_review.md`.
