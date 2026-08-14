# Spec: Re-source `private_comment` / `public_comment` from deliverable comments

## Problem & root cause

DEMOS `private_comment.deliverable_id` and `public_comment.deliverable_id` are
`UUID NOT NULL` (FK -> `deliverable(id)`), so DEMOS comments are
**deliverable-scoped**. The column map (`reports/source_target_columns.csv`)
sourced both tables from `mdcd_demo_cmt` (demonstration-scoped: keyed on
`mdcd_demo_id`, no deliverable, no `cmt_orgn_cd`). That made `deliverable_id`
unmappable (the derivability audit's "NOT derivable" verdict) and is
structurally impossible (cannot satisfy NOT NULL).

The fix: re-source the two comment tables from the deliverable-scoped sources
`mdcd_dlvrbl_cmt` (primary; carries `mdcd_dlvrbl_id` + the `cmt_orgn_cd` routing
key) and `mdcd_dlvrbl_paper_cmt` (2-hop via `mdcd_dlvrbl_paper.mdcd_dlvrbl_id`).
`mdcd_dlvrbl_id` resolves to `deliverable.id` through the existing
`migration._id_map_mdcd_dlvrbl`.

## Empirical validation (PROD `cma_pro_11_1_000`; IMPL counts will differ)

- Volume is on deliverables: `mdcd_dlvrbl_cmt` = 8,624, `mdcd_dlvrbl_paper_cmt`
  = 98, vs `mdcd_demo_cmt` = 43.
- `deliverable_id` is 100% derivable: 0 orphan `mdcd_dlvrbl_cmt` rows; 98/98
  paper rows resolve through the 2-hop.
- `cmt_orgn_cd` domain is exactly `{A, B, C, I, R, S}` (S largest); none are the
  `char(1) DEFAULT '0'`, no NULLs.
- Author resolvability: 39/8,624 `dlvrbl_cmt` rows have an unresolved `user_id`;
  paper 0/98.
- Content length 1-1,488 (fits TEXT); 1 whitespace-only row.
- `cmt_aftr_acptd_ind` (0=8,027 / 1=597) has no DEMOS target column -> dropped,
  flagged for SME.

## Decisions (from review)

1. Full loader implementation.
2. The ~7 non-deliverable comment sources (`mdcd_demo_cmt`, `_amndmt_cmt`,
   `_rnwl_cmt`, `_pgm_cmt`, `_finl_dcsn_dtl_cmt`, `_pgm_mntrg_doc_cmt`,
   `bdgt_ntrlty_fil_doc_cmt`): SME follow-up; do NOT rewrite the routing
   prose, leave a deferred note only.
3. Include `mdcd_dlvrbl_paper_cmt` now.
4. Default-to-private until the `cmt_orgn_cd` crosswalk is authored, floored by
   author person-type.

## Routing rule

`private_comment.author_person_type_id` is NOT NULL FK ->
`cms_user_person_type_limit` (CMS-only); `public_comment` has no person-type
column. A state-authored comment cannot be private by construction. Therefore:

```
route = COALESCE( crosswalk_comment_origin.demos_route ,
                  CASE WHEN author is CMS user THEN 'private' ELSE 'public' END )
```

- Crosswalk empty (gated) -> CMS authors default `private`, state authors
  default `public`.
- When SME authors the crosswalk for `{A,B,C,I,R,S}`, routing follows it; a row
  routing a state-authored comment to `private` is held back + parity-flagged.

## Data flow

```
mdcd_dlvrbl_cmt ------\
mdcd_dlvrbl_paper_cmt -+--> stg.comment_resolved --(route=private)--> private_comment
_id_map_mdcd_dlvrbl --/                          \-(route=public)---> public_comment
_id_map_*_cmt, users_resolved                     \-(held back)-----> parity: comment held
```

## Held-back semantics (non-gating, per-row log; mirrors deliverable)

- Parent deliverable not loaded (today: ALL, since deliverable is 100% held
  back pending the `deliverable_type` crosswalk).
- Author `user_id` unresolved.
- Empty/whitespace content.
- `route=private` but author not a CMS user (caught as integrity).

## Files to add

Crosswalk (gated, DDL only; empty until SME authors values):
- `sql/04_crosswalks/68_comment_origin.sql` -- `mysql_raw.crosswalk_comment_origin(legacy_cd text PK, demos_route text, notes text)`, `demos_route IN ('private','public')`. No registry entry / CSV yet. No fail-closed `_check.sql` yet (coverage is a non-gating parity check).

Id maps:
- `sql/05_id_maps/17_mdcd_dlvrbl_cmt.sql`, `sql/05_id_maps/18_mdcd_dlvrbl_paper_cmt.sql`.

Staging:
- `sql/10_stg/31_populate_id_map_mdcd_dlvrbl_cmt.sql`, `…/32_populate_id_map_mdcd_dlvrbl_paper_cmt.sql`.
- `sql/10_stg/33_comment_resolved.sql` -- source-only projection unioning both
  sources; carries `new_uuid`, `deliverable_id`, `author_user_id`,
  `author_person_type_id`, `content`, `origin_cd`, `created_at`/`updated_at`,
  `legacy_id`, `source`. Routing computed in the loader.

Loader:
- `sql/20_app/50_comment.sql` -- guarded inert until `stg.comment_resolved`
  exists; two `INSERT … SELECT` (private/public) with `NOT EXISTS` + `ON
  CONFLICT (id) DO NOTHING`; inner-join `demos_app.deliverable`; held-back
  `RAISE NOTICE`.

Parity:
- `sql/99_parity/44_comment_held.sql` (non-gating), `45_comment_completeness.sql`
  (gating), `46_comment_integrity.sql` (gating), `47_comment_routing_coverage.sql`
  (non-gating). Held sorts first so the completeness view's dependency on the
  held view is satisfied under lexical apply order.
- `migration/phases/parity.py` -- register the 4 new checks.

## Files to change

- `reports/source_target_columns.csv` -- re-point comment rows to
  `mdcd_dlvrbl_cmt`; add `deliverable_id` derive rows (both tables); add
  `mdcd_dlvrbl_paper_cmt` source rows; add `cmt_orgn_cd` routing-key row and a
  `drop` row for `cmt_aftr_acptd_ind`.
- `reports/inputs/derivability_verdicts.yaml` -- remove the two now-resolved entries.

## Not touched (deferred to SME)

- `docs/sme/explanation-comments-routing.adoc` / `canonical-spec.adoc` routing
  prose. A one-line deferred-SME note in the loader header points at the orphan
  non-deliverable comment sources and the unauthored `cmt_orgn_cd` crosswalk.

## Verification

1. `cd docs && make column-map derivability` -- `GAP_in_scope` -> 0; both
   `deliverable_id` columns show `mapped`.
2. `cd docs && make verify` green.
3. `uv run python -m pytest tests/ -q`.
4. Regenerate + `git diff` generated fragments for intentional drift only.
5. End-to-end comment load stays 0 rows today (inherits the deliverable
   hold-back); activates when the `deliverable_type` crosswalk is signed off.

## Open follow-ups (not blocking)

- SME: author `cmt_orgn_cd` crosswalk for `{A,B,C,I,R,S}`; rule the fate of the
  7 non-deliverable comment sources; confirm `cmt_aftr_acptd_ind` has no DEMOS
  home.
