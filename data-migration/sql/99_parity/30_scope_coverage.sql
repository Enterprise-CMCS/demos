/*
 * Purpose:    Informational disposition + current row count of each DEMOS target table this migration owns (BUILT vs DEFERRED / OUT-OF-SCOPE); not an anomaly view.
 * Inputs:     demos_app.* (users, person, person_state, system_role_assignment, demonstration_role_assignment, primary_demonstration_role_assignment, demonstration, application, application_date, demonstration_type_tag_assignment, amendment, extension, deliverable, private_comment, public_comment, document)
 * Outputs:    migration._scope_coverage (deliberately NOT migration._parity_*, so it is exempt from the parity-views-empty harness contract)
 * Invariants: Always returns one row per tracked table; informational and non-gating GREEN (never REDs the gate); conditional-DDL guard on demos_app.demonstration so it is a clean no-op until build_app has applied the Prisma DDL; idempotent via CREATE OR REPLACE.
 * Refs:       reports/narrative/pending_approved_decisions.md (Workflow-level scope dispositions); migration/phases/parity.py; tests/sql/test_app_layers_idempotency.py::test_parity_views_empty
 *
 * Scope coverage (non-gating informational view).
 *
 * Surfaces, at the parity gate, the disposition + current row count of each
 * DEMOS target table this migration is responsible for, so a reviewer can see
 * what is BUILT vs deliberately DEFERRED / OUT-OF-SCOPE without reading the
 * source. The dispositions mirror the "Workflow-level scope dispositions"
 * table in reports/narrative/pending_approved_decisions.md (PMDA workflows 1-11).
 *
 * This is NOT an anomaly view: it always returns one row per tracked table and
 * is therefore deliberately named migration._scope_coverage, NOT
 * migration._parity_* -- the parity-views-empty harness contract
 * (tests/sql/test_app_layers_idempotency.py::test_parity_views_empty) requires
 * every _parity_* view to be empty (empty == healthy). A coverage report is
 * informational, so it lives outside that prefix and the parity check that
 * reads it (migration/phases/parity.py) is non-gating GREEN.
 *
 * Conditional DDL: guarded on demos_app.demonstration so the file is a clean
 * no-op until build_app has applied the Prisma DDL. CREATE OR REPLACE keeps
 * re-apply idempotent.
 */
SET search_path TO migration, demos_app, public;

DO $$
BEGIN
  IF to_regclass('demos_app.demonstration') IS NULL THEN
    RAISE NOTICE 'parity scope_coverage: demos_app not built; view not created';
    RETURN;
  END IF;
  EXECUTE $v$
    CREATE OR REPLACE VIEW migration._scope_coverage AS
    SELECT t.workflow, t.target_table, t.disposition, t.row_count
      FROM (VALUES
        ('1', 'crosswalks (reference data)',          'BUILT',        NULL::bigint),
        ('2', 'users',                                'BUILT',        (SELECT count(*) FROM demos_app.users)),
        ('2', 'person',                               'BUILT',        (SELECT count(*) FROM demos_app.person)),
        ('2', 'person_state',                         'BUILT',        (SELECT count(*) FROM demos_app.person_state)),
        ('2', 'system_role_assignment',               'BUILT',        (SELECT count(*) FROM demos_app.system_role_assignment)),
        ('2', 'demonstration_role_assignment',        'BUILT',        (SELECT count(*) FROM demos_app.demonstration_role_assignment)),
        ('2', 'primary_demonstration_role_assignment','BUILT',        (SELECT count(*) FROM demos_app.primary_demonstration_role_assignment)),
        ('3', 'demonstration',                        'BUILT',        (SELECT count(*) FROM demos_app.demonstration)),
        ('7', 'application',                          'BUILT',        (SELECT count(*) FROM demos_app.application)),
        ('3', 'application_date',                      'BUILT',        (SELECT count(*) FROM demos_app.application_date)),
        ('3', 'amendment',                            'BUILT',        (SELECT count(*) FROM demos_app.amendment)),
        ('4', 'demonstration_type_tag_assignment',    'PARTIAL',      (SELECT count(*) FROM demos_app.demonstration_type_tag_assignment)),
        ('3', 'extension',                            'DEFERRED',     (SELECT count(*) FROM demos_app.extension)),
        ('6', 'deliverable',                          'BUILT',        (SELECT count(*) FROM demos_app.deliverable)),
        ('6', 'private_comment',                      'BUILT',        (SELECT count(*) FROM demos_app.private_comment)),
        ('6', 'public_comment',                       'BUILT',        (SELECT count(*) FROM demos_app.public_comment)),
        ('6', 'document',                             'DEFERRED',     (SELECT count(*) FROM demos_app.document))
      ) AS t(workflow, target_table, disposition, row_count);
  $v$;
END
$$;

