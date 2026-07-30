/*
 * Purpose:    Assert the 'Migrated From PMDA' placeholder tag still carries the source/status this pipeline seeded, so a parallel migration writing the same primary key cannot silently redefine a user-visible tag.
 * Inputs:     demos_app.tag; demos_app.tag_name
 * Outputs:    migration._parity_tag_provenance
 * Invariants: Non-empty -> RED; conditional-DDL guard (created only when demos_app.tag and demos_app.tag_name both exist, so partial harnesses apply it as a no-op); idempotent via CREATE OR REPLACE; asserts the value of a shared key, not row provenance by id.
 * Refs:       migration/phases/parity.py "Tag provenance" CheckResult; sql/21_app_associative/14_demonstration_type_tag_floor.sql; docs/developer/explanation-dbt-alignment-updates.adoc
 *
 * Parity check: placeholder-tag provenance.
 *
 * Both migrations seed a placeholder demonstration type called
 * 'Migrated From PMDA', and they disagree about what it means.
 *
 *   this pipeline  tag_name 'Migrated From PMDA'; ONE tag row,
 *                  ('Migrated From PMDA', 'Demonstration Type'), seeded
 *                  source_id 'User' / status_id 'Unapproved' so the floored
 *                  demos surface in-app as "(Unapproved)" pending SME
 *                  ratification. This is decision D16, and the Unapproved
 *                  status is the whole point of it.
 *   dbt            the same tag_name, and TWO tag rows -- ('…','Application')
 *                  and ('…','Demonstration Type') -- both source_id 'System' /
 *                  status_id 'Approved'.
 *
 * demos_app.tag_name is PRIMARY KEY (id) and demos_app.tag is
 * PRIMARY KEY (tag_name_id, tag_type_id), so the two pipelines collide on a
 * shared natural key rather than doubling rows. The collision is asymmetric and
 * neither direction is safe:
 *
 *   dbt after us   dbt inserts with no conflict handling, so its INSERT raises
 *                  23505 and the dbt load aborts partway.
 *   us after dbt   14_demonstration_type_tag_floor.sql seeds ON CONFLICT DO
 *                  NOTHING, so dbt's System/Approved row survives untouched and
 *                  every floored demonstration silently presents as an approved
 *                  system tag. D16 is violated and nothing in the schema or the
 *                  existing gates notices, because the row count is right and
 *                  every FK is satisfied.
 *
 * The id-based provenance pattern used by 65_deliverable_action_provenance.sql
 * cannot catch this: tag and tag_name are keyed by text, not by a minted uuid,
 * so there is no id map to compare against. This check therefore asserts the
 * VALUE of the shared key instead.
 *
 * WHAT IS ASSERTED
 *
 *   floor tag values  if ('Migrated From PMDA', 'Demonstration Type') exists at
 *                     all, it carries source_id 'User' and status_id
 *                     'Unapproved'.
 *   no foreign tag    no OTHER tag row hangs off tag_name 'Migrated From PMDA'.
 *                     Only the Demonstration Type row is ours; an 'Application'
 *                     row on the same tag_name is dbt's and means a parallel
 *                     migration wrote here.
 *
 * WHAT IS DELIBERATELY NOT ASSERTED
 *
 * Absence. The floor is conditional -- 14_*.sql seeds the tag only when at
 * least one Approved demonstration migrated with zero types -- so a clean run
 * with full type coverage legitimately has no such tag, and requiring one would
 * red on a good outcome. This check fires only on a tag that exists and is
 * wrong.
 *
 * Consumed by migration/phases/parity.py. Non-empty -> RED.
 *
 * Conditional DDL: guarded so a harness that stands up demos_app without the
 * tag vocabulary applies this file as a clean no-op.
 */
SET search_path TO migration, demos_app, public;

DO $$
BEGIN
  IF to_regclass('demos_app.tag') IS NULL OR to_regclass('demos_app.tag_name') IS NULL THEN
    RAISE NOTICE 'parity tag_provenance: tag vocabulary absent; view not created';
    RETURN;
  END IF;
  EXECUTE $v$
    CREATE OR REPLACE VIEW migration._parity_tag_provenance AS
    SELECT
      t.tag_name_id AS tag_name_id,
      t.tag_type_id AS tag_type_id,
      t.source_id   AS source_id,
      t.status_id   AS status_id,
      'placeholder tag redefined by another writer'::text AS reason,
      'expected source_id User / status_id Unapproved per D16'::text AS detail
    FROM demos_app.tag t
    WHERE t.tag_name_id = 'Migrated From PMDA'
      AND t.tag_type_id = 'Demonstration Type'
      AND (t.source_id <> 'User' OR t.status_id <> 'Unapproved')
    UNION ALL
    SELECT
      t.tag_name_id,
      t.tag_type_id,
      t.source_id,
      t.status_id,
      'unexpected tag type on the placeholder tag_name'::text AS reason,
      'this pipeline seeds only the Demonstration Type row; another migration wrote this one'::text AS detail
    FROM demos_app.tag t
    WHERE t.tag_name_id = 'Migrated From PMDA'
      AND t.tag_type_id <> 'Demonstration Type'
  $v$;
END
$$;

