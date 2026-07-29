/*
 * Purpose:    Classify every PMDA-valid pending demonstration (orphan-loadable / folded / held) and resolve its fold-aware final demonstration UUID for the pending demonstration, amendment and tag loaders.
 * Inputs:     stg._valid_pendg_demo_ids, stg._valid_demo_ids, mysql_raw.mdcd_pendg_demo, mysql_raw.mdcd_demo, migration._id_map_mdcd_pendg_demo, migration._id_map_mdcd_demo, migration.normalize_medicaid_id
 * Outputs:    CREATE OR REPLACE VIEW stg._pendg_demo_fold
 * Invariants: source-only (mysql_raw + id maps + stg filters only; never crosswalks 04 / seeds 02) so it builds in the stg-only idempotency harness; idempotent (CREATE OR REPLACE VIEW); soft-delete exclusion (dltd_ind = 1); approved wins (a pending demo whose NORMALIZED project number matches a PMDA-valid approved demo's NORMALIZED project number folds into it -- both sides go through migration.normalize_medicaid_id, so the fold key, the emitted medicaid_id and the row-level filters are the same predicate); project number REQUIRED to load an orphan (a pending demo with no normalizable project number is held back, per the 2026-07-10 SME answer).
 * Refs:       reports/narrative/pending_approved_decisions.md, docs/specs/pmda-cross-cutting-derivation-spec.md, sql/99_parity/04_pending_approved.sql
 *
 * Pending/approved unification fold.
 *
 * The MySQL mdcd_demo / mdcd_pendg_demo pair collapses into the single DEMOS
 * application + demonstration flow under the rule "approved wins":
 *
 *   - a pending demo whose normalized project number (mdcd_demo_num) matches a
 *     PMDA-valid approved demo's normalized project number FOLDS into that
 *     approved demonstration -- it is not loaded as its own row, and its children
 *     (amendments, program-detail tags) attach to the approved demonstration's
 *     UUID; and
 *   - a pending demo with NO approved counterpart is an ORPHAN, loaded as its
 *     own 'Under Review' demonstration (sql/20_app/31_pending_demonstration.sql)
 *     -- but only when it carries a normalizable project number. A pending demo
 *     with none is HELD BACK (non-gating, logged for SME by
 *     sql/99_parity/04) per the 2026-07-10 SME answer, because DEMOS
 *     demonstration.medicaid_id would have no value to load.
 *
 * This view is the single source of that classification. For every PMDA-valid
 * pending id it exposes:
 *   disposition   'folded' | 'orphan_loadable' | 'held_no_project'
 *   medicaid_id   the canonical project number (NULL for held_no_project)
 *   approved_uuid the folded-into approved demonstration UUID (NULL unless folded)
 *   pending_uuid  the orphan pending UUID minted in _id_map_mdcd_pendg_demo
 *   demo_uuid     COALESCE(approved_uuid, pending_uuid) -- the fold-aware final
 *                 demonstration UUID a child row resolves to. Whether that
 *                 demonstration actually loaded is enforced downstream by each
 *                 child loader's JOIN to demos_app.demonstration (held-back,
 *                 dup-medicaid-loser and no-project rows cascade out there).
 *   region_digit_repaired  TRUE when the fold matched on the project number with
 *                 a DIFFERING region digit (tier 1 below) rather than on the
 *                 whole normalized number. Every such row is reported per-row by
 *                 sql/99_parity/04 so no repair is silent.
 *   folded_into_medicaid_id  the approved counterpart's normalized medicaid_id
 *                 (NULL unless folded), so a repair report can show both the
 *                 mis-keyed and the authoritative number side by side.
 *
 * Source-only by design (mysql_raw + the two id maps + the stg filters, never
 * crosswalks/seeds) so it builds in the stg-only idempotency harness, matching
 * stg.amendment_resolved. Soft-deleted pending rows (dltd_ind = 1) are excluded:
 * demonstration has no target "Deleted" lifecycle state.
 *
 * The counterpart is matched against PMDA-valid approved demos (stg._valid_demo_ids)
 * only, so a pending row whose only namesake is a junk/soft-deleted approved row
 * is still treated as a loadable orphan rather than folded into a row that never
 * migrates. approved_uuid picks the lowest-legacy-id counterpart when a project
 * number is shared by more than one valid approved demo (a duplicate-medicaid_id
 * anomaly the approved loader resolves in sql/20_app/30_demonstration.sql); in
 * that rare case the child cascades out downstream if that particular approved
 * UUID was the held-back duplicate -- the conservative outcome.
 */
SET search_path TO stg, mysql_raw, migration, public;

CREATE OR REPLACE VIEW stg._pendg_demo_fold AS
SELECT
  p.mdcd_pendg_demo_id AS legacy_pendg_demo_id,
  migration.normalize_medicaid_id(p.mdcd_demo_num) AS medicaid_id,
  CASE WHEN migration.normalize_medicaid_id(p.mdcd_demo_num) IS NULL THEN
    'held_no_project'
  WHEN ac.approved_uuid IS NOT NULL THEN
    'folded'
  ELSE
    'orphan_loadable'
  END AS disposition,
  ac.approved_uuid AS approved_uuid,
  pm.new_uuid AS pending_uuid,
  COALESCE(ac.approved_uuid, pm.new_uuid) AS demo_uuid,
  COALESCE(ac.match_tier, 0) = 1 AS region_digit_repaired,
  ac.approved_medicaid_id AS folded_into_medicaid_id
FROM
  mysql_raw.mdcd_pendg_demo p
  JOIN stg._valid_pendg_demo_ids v ON v.demo_id = p.mdcd_pendg_demo_id
  LEFT JOIN migration._id_map_mdcd_pendg_demo pm ON pm.legacy_int_id = p.mdcd_pendg_demo_id
  LEFT JOIN LATERAL (
    SELECT
      im.new_uuid AS approved_uuid,
      migration.normalize_medicaid_id(ad.mdcd_demo_num) AS approved_medicaid_id,
      CASE WHEN migration.normalize_medicaid_id(ad.mdcd_demo_num) = migration.normalize_medicaid_id(p.mdcd_demo_num) THEN
        0
      ELSE
        1
      END AS match_tier
    FROM
      mysql_raw.mdcd_demo ad
      JOIN stg._valid_demo_ids vad ON vad.demo_id = ad.mdcd_demo_id
      JOIN migration._id_map_mdcd_demo im ON im.legacy_int_id = ad.mdcd_demo_id
    WHERE
      migration.normalize_medicaid_id(p.mdcd_demo_num) IS NOT NULL
      -- Tier 0 -- exact match on the NORMALIZED number on both sides. Raw-string
      -- equality silently misses a counterpart whenever the two rows spell the
      -- same project number differently (whitespace, a '-' for the '/', an
      -- unseparated run of digits, or the region-10 bare-0 vs '/10' spelling),
      -- which makes the pending row an orphan and mints a SECOND demonstration
      -- carrying the medicaid_id the approved row already emits -- a
      -- demonstration_medicaid_id_key collision rather than a fold.
      --
      -- Tier 1 -- region-digit repair. The region suffix is a function of the
      -- state, so a pending row and an approved row in the SAME state carrying
      -- the SAME 5-digit project number are the same demonstration even when
      -- their region digits disagree: one of the two was mis-keyed, and the
      -- approved row is the authoritative record. Without this the mis-keyed
      -- pending rows become orphans, collide with each other on the mis-keyed
      -- id, and the whole group is held -- gating parity check 4 RED on data
      -- that is already correctly loaded from the approved anchor. State
      -- equality is required, so this never merges two different states'
      -- demonstrations; the region digit is never consulted here (that would
      -- need the seeded migration.state_region and this view is source-only),
      -- it is verified and reported per-row by sql/99_parity/04.
      AND (migration.normalize_medicaid_id(ad.mdcd_demo_num) = migration.normalize_medicaid_id(p.mdcd_demo_num)
        OR (ad.geo_ansi_state_cd = p.geo_ansi_state_cd
          AND migration.medicaid_project_number(ad.mdcd_demo_num) = migration.medicaid_project_number(p.mdcd_demo_num)))
    ORDER BY
      -- Exact match always wins over a repair, then lowest legacy id.
      match_tier,
      ad.mdcd_demo_id
    LIMIT 1) ac ON TRUE
WHERE (p.dltd_ind)::int IS DISTINCT FROM 1;

