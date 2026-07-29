/*
 * Purpose:    Durable per-row log of demonstrations the loader held back for a duplicate medicaid_id (RED-4), tagged so parity check 21 can gate the region-incorrect groups.
 * Inputs:     stg.demonstration_resolved; mysql_raw.crosswalk_demo_status; mysql_raw.crosswalk_sdg_division; migration.state_region
 * Outputs:    migration._parity_demonstration_held_dup_medicaid_id (adds disposition + gating columns, plus the name/status_id/effective_date/expiration_date/kept_name adjudication fields an SME needs to tell two colliding demonstrations apart)
 * Invariants: MIXED gating -- rows with gating=false (a region-correct winner exists; the non-winners are held) do not RED the gate; rows with gating=true (no member's region suffix matches its state region; the whole group is held) RED parity check 21 for SME source-correction. Conditional-DDL guard (created only when stg.demonstration_resolved + the crosswalks + state_region are present, so the app-layers idempotency harness applies it as a no-op); idempotent via CREATE OR REPLACE.
 * Refs:       migration/phases/parity.py (non-gating check 21); sql/20_app/30_demonstration.sql (the hold-back); complements 11_demonstration_completeness.sql (which excludes these rows)
 *
 * Parity check 21: demonstrations held back for a duplicate medicaid_id
 * (durable per-row log for SME review).
 *
 * DEMOS enforces demonstration_medicaid_id_key UNIQUE, but the source can carry
 * the same mdcd_demo_num on two live demonstrations (the RED-4 defect: LA #2506
 * and TX #2513 both numbered 11-W-00232/6). The loader
 * (sql/20_app/30_demonstration.sql) resolves each duplicate group by region.
 * Winner rule (SME-ratified): among the duplicates the row whose medicaid_id
 * CMS-region suffix (the /N; region 10 is written as a trailing 0) matches its
 * state's region wins; if two or more match, the lowest legacy mdcd_demo_id
 * breaks the tie. If NO member matches its state's region the project number's
 * region is wrong: the WHOLE group is held (none loaded) and this view tags
 * those rows gating=true so parity check 21 REDs -- there is no lowest-id
 * fallback. This view is the per-row record of exactly which demonstrations were
 * held back and (for a resolvable group) which winner kept the number.
 *
 * Adjudication fields (name, status_id, effective_date, expiration_date,
 * kept_name) exist because the 2026-07-28 SDG review of this very collision
 * could not be acted on: the export carried only ids, medicaid_id, state and
 * status_cd, so SDG answered about "Healthy Texas Women" (legacy 2477, Approved
 * 2020-2030, already correct on 11-W-00326/6) when the row actually colliding
 * with LA #2506 is legacy 2513 "Texas Women's Health Waiver" (Expired
 * 2007-2012). Two demonstrations sharing a number can only be told apart by
 * what they are. Never drop these columns from the SME export.
 *
 * Rows carry disposition + gating: disposition='held_nonwinner' (gating=false)
 * are the ordinary non-winners of a resolvable group -- reviewable, SME-
 * correctable, non-gating; disposition='region_incorrect' (gating=true) are the
 * whole-group members of a region-incorrect duplicate that MUST be fixed at
 * source before cutover. See migration/phases/parity.py check 21. The
 * completeness check (11_demonstration_completeness.sql) deliberately EXCLUDES
 * every non-loaded duplicate row (both kinds) so a deliberate hold-back does not
 * also trip check 8 RED.
 *
 * Conditional DDL: like 12_approved_demo_held_for_division.sql, the view reads
 * stg.demonstration_resolved plus the crosswalk tables and migration.state_region,
 * which exist only in the full pipeline (crosswalks + build_stg onward) and
 * never in the app-layers idempotency harness. Each relation is guarded with its
 * own IF so the view is created only when every input is present; the harness
 * applies this file as a clean no-op (the view is simply absent), and re-apply
 * is idempotent via CREATE OR REPLACE.
 */
SET search_path TO migration, stg, mysql_raw, demos_app, public;

DO $$
BEGIN
  IF to_regclass('stg.demonstration_resolved') IS NULL THEN
    RAISE NOTICE 'parity demonstration_held_dup_medicaid: stg.demonstration_resolved absent; view not created';
    RETURN;
  END IF;
  IF to_regclass('mysql_raw.crosswalk_demo_status') IS NULL THEN
    RAISE NOTICE 'parity demonstration_held_dup_medicaid: mysql_raw.crosswalk_demo_status absent; view not created';
    RETURN;
  END IF;
  IF to_regclass('mysql_raw.crosswalk_sdg_division') IS NULL THEN
    RAISE NOTICE 'parity demonstration_held_dup_medicaid: mysql_raw.crosswalk_sdg_division absent; view not created';
    RETURN;
  END IF;
  IF to_regclass('migration.state_region') IS NULL THEN
    RAISE NOTICE 'parity demonstration_held_dup_medicaid: migration.state_region absent; view not created';
    RETURN;
  END IF;
  EXECUTE $v$
    CREATE OR REPLACE VIEW migration._parity_demonstration_held_dup_medicaid_id AS
    WITH insertable AS (
      SELECT
        r.new_uuid       AS demonstration_id,
        r.legacy_demo_id AS legacy_demo_id,
        r.medicaid_id    AS medicaid_id,
        r.state_id       AS state_id,
        r.status_cd      AS status_cd,
        r.name           AS name,
        cw.demos_text_id AS status_id,
        r.effective_date AS effective_date,
        r.expiration_date AS expiration_date,
        CASE WHEN substring(r.medicaid_id FROM '/([0-9]+)$') IS NOT NULL
          AND (substring(r.medicaid_id FROM '/([0-9]+)$')::int = sr.region
            OR (substring(r.medicaid_id FROM '/([0-9]+)$') = '0' AND sr.region = 10))
          THEN 0 ELSE 1 END AS region_rank
      FROM stg.demonstration_resolved r
      JOIN mysql_raw.crosswalk_demo_status cw        ON cw.legacy_int_cd = r.status_cd
      JOIN migration.state_region sr                 ON sr.state_id = r.state_id
      LEFT JOIN mysql_raw.crosswalk_sdg_division xdiv ON xdiv.legacy_int_cd = r.sdg_division_cd
      WHERE r.medicaid_id IS NOT NULL
        AND NOT (cw.demos_text_id = 'Approved'
          AND (xdiv.demos_text_id IS NULL OR r.effective_date IS NULL OR r.expiration_date IS NULL))
    ),
    grp AS (
      SELECT
        i.*,
        count(*) OVER (PARTITION BY i.medicaid_id) AS grp_size,
        bool_or(i.region_rank = 0) OVER (PARTITION BY i.medicaid_id) AS has_region_match,
        min(i.legacy_demo_id) FILTER (WHERE i.region_rank = 0)
          OVER (PARTITION BY i.medicaid_id) AS winner_legacy_id
      FROM insertable i
    ),
    grp2 AS (
      SELECT
        g.*,
        first_value(g.demonstration_id) OVER (
          PARTITION BY g.medicaid_id ORDER BY g.region_rank, g.legacy_demo_id) AS winner_demonstration_id,
        -- The winner's NAME is what makes a collision adjudicable: two rows
        -- sharing a number are told apart by what they are, not by their ids.
        first_value(g.name) OVER (
          PARTITION BY g.medicaid_id ORDER BY g.region_rank, g.legacy_demo_id) AS winner_name
      FROM grp g
    )
    SELECT
      grp2.demonstration_id,
      grp2.legacy_demo_id,
      grp2.medicaid_id,
      grp2.state_id,
      grp2.status_cd,
      CASE WHEN grp2.has_region_match THEN grp2.winner_legacy_id END AS kept_legacy_demo_id,
      CASE WHEN grp2.has_region_match THEN grp2.winner_demonstration_id END AS kept_demonstration_id,
      CASE WHEN grp2.has_region_match THEN 'held_nonwinner' ELSE 'region_incorrect' END AS disposition,
      (NOT grp2.has_region_match) AS gating,
      CASE WHEN NOT grp2.has_region_match THEN
        'duplicate medicaid_id whose region suffix matches no member state region; whole group held, gate RED'
      ELSE
        'duplicate medicaid_id; kept legacy demo ' || grp2.winner_legacy_id
          || CASE WHEN grp2.region_rank = 1 THEN ' (region-suffix mismatch)' ELSE ' (lower legacy id)' END
      END AS reason,
      -- Appended last: CREATE OR REPLACE VIEW cannot reorder or rename existing
      -- columns (42P16), so adjudication fields go after the original set.
      grp2.name           AS name,
      grp2.status_id      AS status_id,
      grp2.effective_date AS effective_date,
      grp2.expiration_date AS expiration_date,
      CASE WHEN grp2.has_region_match THEN grp2.winner_name END AS kept_name
    FROM grp2
    WHERE grp2.grp_size > 1
      AND (NOT grp2.has_region_match
        OR NOT (grp2.region_rank = 0 AND grp2.legacy_demo_id = grp2.winner_legacy_id));
  $v$;
END
$$;
