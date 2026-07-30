/*
 * Purpose:    Floor every Approved demonstration that migrated with zero demonstration types by assigning a single "Migrated From PMDA" placeholder demonstration-type tag over the demonstration's own effective/expiration window.
 * Inputs:     demos_app.demonstration, demos_app.demonstration_type_tag_assignment, demos_app.tag, demos_app.tag_name, demos_app.demonstration_type_tag_type_limit.
 * Outputs:    demos_app.tag_name (+1), demos_app.tag (+1 Demonstration Type row), demos_app.demonstration_type_tag_assignment (one row per floored demo).
 * Invariants: runs inside the deferred-constraint build_app txn AFTER the demonstration-type tag loaders (10-13); the placeholder is source_id='User', status_id='Unapproved' (like 05_*, so it surfaces as "(Unapproved)" pending in-app ratification); scoped to status_id='Approved' demos with NO existing demonstration_type_tag_assignment; only demos whose own window is loadable (effective < expiration, both NOT NULL) are floored, so the DEMOS CHECK (effective_date < expiration_date) always holds; guarded inert unless the tag vocabulary + demonstration are present; idempotent via ON CONFLICT.
 * Refs:       sql/21_app_associative/05_demonstration_type_tags_user.sql, sql/21_app_associative/10_demonstration_type_tag_assignment.sql, sql/99_parity/59_demonstration_type_floor.sql
 *
 * App load (associative): a demonstration-type floor.
 *
 * DEMOS demonstrations carry zero or more demonstration types via
 * demonstration_type_tag_assignment. PMDA's mdcd_*_pgm_dtl fold (10-13) only
 * emits a type when the source carries a program-detail row with a valid
 * window, so a demonstration whose PMDA record had no such row migrates with no
 * demonstration type at all. For an Approved demonstration that is a poor state
 * (an Approved demo is a live, user-visible record), so per the SME decision
 * every Approved demonstration with zero types is floored with a single
 * "Migrated From PMDA" placeholder demonstration-type tag. It is created exactly
 * the way the DEMOS app creates a user-entered type (05_*.sql,
 * createNewTagIfNotExists.ts): a User-sourced, Unapproved tag under the
 * 'Demonstration Type' tag type, so it appears as "Migrated From PMDA
 * (Unapproved)" pending SME assigning the real type(s) in-app -- the honest
 * state for a placeholder.
 *
 * The assignment uses the demonstration's OWN effective_date / expiration_date
 * (the demonstration period), so the placeholder type spans exactly the
 * demonstration's life. Approved demonstrations always load with non-NULL
 * effective/expiration (30_demonstration.sql holds back Approved rows missing
 * them), but DEMOS enforces CHECK (effective_date < expiration_date) on the
 * assignment, so a demo whose own window is degenerate (effective >= expiration)
 * cannot be floored with its own dates and is left uncovered (reported in the
 * NOTICE, surfaced by parity check 24) rather than violating the CHECK.
 *
 * Under Review (and other non-Approved) zero-type demos are intentionally NOT
 * floored: only an Approved demonstration is a settled, user-visible record for
 * which a missing type is misleading.
 *
 * GUARDED / inert unless the tag vocabulary and demonstration are present.
 * Placed at 14_ so it runs AFTER the demonstration-type tag loaders (10-13):
 * the "zero types" test must see every real type already loaded. tag/tag_name
 * are Prisma-seeded and excluded from build_app truncation, so the placeholder
 * survives the bulk rebuild.
 *
 * Idempotent: ON CONFLICT DO NOTHING on the seed and the assignment.
 */
SET search_path TO demos_app, migration, public;

DO $$
DECLARE
  ins bigint;
  skipped bigint;
BEGIN
  IF to_regclass('demos_app.demonstration') IS NULL THEN
    RAISE NOTICE 'skip demonstration-type floor: demos_app.demonstration absent';
    RETURN;
  END IF;
  IF NOT EXISTS (
    SELECT
      1
    FROM
      demos_app.demonstration) THEN
  RAISE NOTICE 'skip demonstration-type floor: demos_app.demonstration not loaded yet';
  RETURN;
END IF;
  IF to_regclass('demos_app.tag') IS NULL THEN
    RAISE NOTICE 'skip demonstration-type floor: demos_app.tag absent';
    RETURN;
  END IF;
  IF to_regclass('demos_app.tag_name') IS NULL THEN
    RAISE NOTICE 'skip demonstration-type floor: demos_app.tag_name absent';
    RETURN;
  END IF;
  IF to_regclass('demos_app.demonstration_type_tag_assignment') IS NULL THEN
    RAISE NOTICE 'skip demonstration-type floor: demos_app.demonstration_type_tag_assignment absent';
    RETURN;
  END IF;
  IF to_regclass('demos_app.demonstration_type_tag_type_limit') IS NULL THEN
    RAISE NOTICE 'skip demonstration-type floor: demos_app.demonstration_type_tag_type_limit absent';
    RETURN;
  END IF;
  IF NOT EXISTS (
    SELECT
      1
    FROM
      demos_app.demonstration_type_tag_type_limit
    WHERE
      id = 'Demonstration Type') THEN
  RAISE NOTICE 'skip demonstration-type floor: Demonstration Type tag type not seeded';
  RETURN;
END IF;
  -- Seed the placeholder demonstration-type tag (User/Unapproved), like 05_*.
  INSERT INTO demos_app.tag_name(id, created_at, updated_at)
    VALUES ('Migrated From PMDA', now(), now())
  ON CONFLICT (id)
    DO NOTHING;
  INSERT INTO demos_app.tag(tag_name_id, tag_type_id, source_id, status_id, created_at, updated_at)
    VALUES ('Migrated From PMDA', 'Demonstration Type', 'User', 'Unapproved', now(), now())
  ON CONFLICT (tag_name_id, tag_type_id)
    DO NOTHING;
  -- Approved zero-type demos we cannot floor because their own window is
  -- degenerate (would violate CHECK effective_date < expiration_date).
  SELECT
    count(*)
  INTO
    skipped
  FROM
    demos_app.demonstration d
  WHERE
    d.status_id = 'Approved'
    AND NOT EXISTS (
      SELECT
        1
      FROM
        demos_app.demonstration_type_tag_assignment a
      WHERE
        a.demonstration_id = d.id)
    AND NOT (d.effective_date IS NOT NULL
      AND d.expiration_date IS NOT NULL
      AND d.effective_date < d.expiration_date);
  INSERT INTO demos_app.demonstration_type_tag_assignment(demonstration_id, tag_name_id, tag_type_id, effective_date, expiration_date, created_at, updated_at)
  SELECT
    d.id,
    'Migrated From PMDA',
    'Demonstration Type',
    d.effective_date,
    d.expiration_date,
    now(),
    now()
  FROM
    demos_app.demonstration d
    JOIN demos_app.tag tg ON tg.tag_name_id = 'Migrated From PMDA'
      AND tg.tag_type_id = 'Demonstration Type'
  WHERE
    d.status_id = 'Approved'
    AND d.effective_date IS NOT NULL
    AND d.expiration_date IS NOT NULL
    AND d.effective_date < d.expiration_date
    AND NOT EXISTS (
      SELECT
        1
      FROM
        demos_app.demonstration_type_tag_assignment a
      WHERE
        a.demonstration_id = d.id)
  ON CONFLICT (demonstration_id,
    tag_name_id)
    DO NOTHING;
  GET DIAGNOSTICS ins = ROW_COUNT;
  RAISE NOTICE 'demonstration-type floor: floored % Approved zero-type demonstration(s) with "Migrated From PMDA" (% left uncovered for a degenerate/NULL demonstration window)', ins, skipped;
END
$$;

