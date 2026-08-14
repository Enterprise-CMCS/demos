/*
 * Purpose:    Create the SME-ratified demonstration-type tags that the DEMOS Prisma baseline does not seed, so the tag-pivot fold (10_*.sql) can resolve them.
 * Inputs:     none (data-only); demos_app.tag_name, demos_app.tag, demos_app.tag_type, demos_app.tag_source, demos_app.tag_status.
 * Outputs:    demos_app.tag_name (+7 rows), demos_app.tag (+7 demonstration-type rows).
 * Invariants: source_id='User', status_id='Unapproved' (identical to the app's createNewTagIfNotExists, so they surface as "(Unapproved)" in the UI pending in-app ratification); guarded inert unless all five tag tables exist (each a separate IF so an absent relation is never planned); idempotent via ON CONFLICT DO NOTHING; survives build_app truncation because tag/tag_name are Prisma-seeded (excluded from truncate_schema_data).
 * Refs:       reports/crosswalks/proposed/pgm_dtl_tag_sme_decisions.md; ../demos/server/src/model/tag/queries/createNewTagIfNotExists.ts; sql/21_app_associative/10_demonstration_type_tag_assignment.sql.
 *
 * App vocabulary: the seven SME-approved demonstration-type tags that are NOT
 * in the DEMOS Prisma seed.
 *
 * The pgm_dtl_tag fold (10_demonstration_type_tag_assignment.sql) resolves each
 * mapped tag_name verbatim against the seeded demonstration-type tag vocabulary
 * and silently skips any miss. Ten source pgm_dtl tables were SME-ratified in
 * reports/crosswalks/proposed/pgm_dtl_tag_sme_decisions.md; two of the approved
 * tags already exist in the seed (CMMI - Integrated Care for Kids (IncK),
 * Premiums/Cost-Sharing) and seven do not. Rather than let those seven silently
 * drop their rows, the migration creates them here exactly the way the DEMOS app
 * itself creates a new demonstration type when a user types one that does not
 * exist (../demos .../createNewTagIfNotExists.ts): a User-sourced, Unapproved
 * tag under the 'Demonstration Type' tag type. They therefore appear in DEMOS as
 * "<name> (Unapproved)" pending the app's own tag-approval workflow, which is the
 * honest state (the SME ratified the migration mapping; in-app approval is
 * separate).
 *
 * GUARDED / inert unless all five tag tables exist (each a separate IF so an
 * absent relation is never planned). Idempotent via ON CONFLICT DO NOTHING.
 * Placed at 05_ so it runs before the fold loader (10_) inside the same build;
 * tag/tag_name are Prisma-seeded and excluded from build_app truncation, so the
 * rows survive the bulk rebuild.
 */
SET search_path TO demos_app, public;

DO $$
DECLARE
  t text;
  tags text[] := ARRAY['Benefits', 'Diagnosis/Disease Specific', 'Disproportionate Share Hospital (DSH)', 'Eligibility and Coverage', 'Emergency Waiver Authority', 'Financial Pool', 'Healthy Adult Opportunity'];
BEGIN
  IF to_regclass('demos_app.tag_name') IS NULL THEN
    RAISE NOTICE 'skip demonstration-type tag seed: demos_app.tag_name absent';
    RETURN;
  END IF;
  IF to_regclass('demos_app.tag') IS NULL THEN
    RAISE NOTICE 'skip demonstration-type tag seed: demos_app.tag absent';
    RETURN;
  END IF;
  IF to_regclass('demos_app.tag_type') IS NULL THEN
    RAISE NOTICE 'skip demonstration-type tag seed: demos_app.tag_type absent';
    RETURN;
  END IF;
  IF to_regclass('demos_app.tag_source') IS NULL THEN
    RAISE NOTICE 'skip demonstration-type tag seed: demos_app.tag_source absent';
    RETURN;
  END IF;
  IF to_regclass('demos_app.tag_status') IS NULL THEN
    RAISE NOTICE 'skip demonstration-type tag seed: demos_app.tag_status absent';
    RETURN;
  END IF;
  FOREACH t IN ARRAY tags LOOP
    INSERT INTO demos_app.tag_name(id, created_at, updated_at)
      VALUES (t, now(), now())
    ON CONFLICT (id)
      DO NOTHING;
    INSERT INTO demos_app.tag(tag_name_id, tag_type_id, source_id, status_id, created_at, updated_at)
      VALUES (t, 'Demonstration Type', 'User', 'Unapproved', now(), now())
    ON CONFLICT (tag_name_id, tag_type_id)
      DO NOTHING;
  END LOOP;
  RAISE NOTICE 'demonstration-type tag seed: ensured % SME-approved User/Unapproved tag(s)', array_length(tags, 1);
END
$$;

