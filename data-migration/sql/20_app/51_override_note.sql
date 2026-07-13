/*
 * Purpose:    Load demos_app.private_comment from stg.override_note_resolved, migrating each deliverable's budget-neutrality override note as a CMS-internal private comment on its deliverable.
 * Inputs:     stg.override_note_resolved; demos_app.deliverable (loaded-parent JOIN).
 * Outputs:    demos_app.private_comment
 * Invariants: runs inside the deferred-constraint build_app txn; RETURNs before the INSERT while stg.override_note_resolved is absent (app-layers idempotency harness no-op); inner-join demos_app.deliverable so a note whose parent deliverable was not loaded is held back; private_comment requires a CMS author person_type (cms_user_person_type_limit); empty content + unresolved author held back; held-back rows logged for SME review by the parity views; idempotent via NOT EXISTS + ON CONFLICT (id) DO NOTHING.
 * Refs:       sql/10_stg/35_override_note_resolved.sql, sql/99_parity/48_override_note.sql, sql/20_app/50_comment.sql, reports/crosswalks/proposed/deliverable_type_bn_routing.md
 *
 * App load: demos_app.private_comment from the deliverable budget-neutrality
 * override notes resolved in stg.override_note_resolved (10_stg/35_*). The
 * override note is CMS-internal by nature (a Medicaid-side reviewer's note on
 * why the BN treatment was overridden), so it always routes to private_comment;
 * there is no public route and no origin-code crosswalk.
 *
 * Hold-backs (logged, non-gating; see sql/99_parity/48_override_note.sql):
 *   - parent deliverable not loaded
 *   - author user_id did not migrate (author_user_id IS NULL)
 *   - author is not a CMS user (private_comment.author_person_type_id FK ->
 *     cms_user_person_type_limit; a non-CMS override author is held back)
 *   - empty/whitespace override comment
 *
 * Idempotent: NOT EXISTS + ON CONFLICT (id) DO NOTHING keep re-apply a no-op.
 * The note UUID is minted per deliverable in migration._id_map_override_note
 * (a distinct row from the comment id maps), so it never collides with a
 * deliverable comment loaded by sql/20_app/50_comment.sql.
 */
SET search_path TO demos_app, stg, migration, mysql_raw, public;

DO $$
DECLARE
  held int;
BEGIN
  IF to_regclass('stg.override_note_resolved') IS NULL THEN
    RAISE NOTICE 'skip override-note load: stg.override_note_resolved not built yet';
    RETURN;
  END IF;
  INSERT INTO demos_app.private_comment(id, deliverable_id, author_user_id, author_person_type_id, content, created_at, updated_at)
  SELECT
    r.new_uuid,
    r.deliverable_id,
    r.author_user_id,
    r.author_person_type_id,
    r.content,
    r.created_at,
    r.updated_at
  FROM
    stg.override_note_resolved r
    JOIN demos_app.deliverable d ON d.id = r.deliverable_id
  WHERE
    r.author_user_id IS NOT NULL
    AND r.author_person_type_id IN ('demos-admin', 'demos-cms-user')
    AND r.content <> ''
    AND NOT EXISTS (
      SELECT
        1
      FROM
        demos_app.private_comment ex
      WHERE
        ex.id = r.new_uuid)
  ON CONFLICT (id)
    DO NOTHING;
  SELECT
    count(*)
  INTO
    held
  FROM
    stg.override_note_resolved r
  WHERE
    NOT EXISTS (
      SELECT
        1
      FROM
        demos_app.private_comment p
      WHERE
        p.id = r.new_uuid);
  IF held > 0 THEN
    RAISE NOTICE 'override-note load: % note(s) held back (parent deliverable not loaded, unresolved author, non-CMS author, or empty content); see migration._parity_override_note_held', held;
  END IF;
END
$$;

