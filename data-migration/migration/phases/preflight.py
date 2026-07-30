"""P0: pre-flight checks before freeze."""

from __future__ import annotations

import shutil

from migration.lib import (
    PRISMA_CACHE_DIR,
    PRISMA_PIN_FILE,
    Env,
    die,
    log,
    pgloader_runner_problem,
    phase,
    psql_query,
    rel,
)
from migration.phases.prod_schema_guard import run_prod_schema_guard


@phase("preflight")
def run_preflight() -> None:
    """Run P0 pre-flight checks; mark the ``preflight`` gate on full success.

    Verifies Postgres reachability, the current DB size query, DuckDB
    availability with its MySQL/Postgres scanners installable, that
    ``pgloader`` is on ``PATH``, the pinned Prisma artifact is cached, and
    (when the earlier checks pass) re-runs the prod-schema guard with the
    emptiness check so the target demos_app still matches the reference and
    holds no data before ``build_app`` writes. Two migration-specific schema
    preconditions follow the guard. P0.8 is informational: it confirms
    ``demos_app.demonstration.chip_id`` exists and logs its nullability, but no
    longer HOLDs on NOT NULL -- the DEMOS ``generate_medicaid_chip_id_numbers``
    trigger (BEFORE INSERT) now mints a chip_id for migrated rows carrying NULL,
    so the column may stay NOT NULL. P0.9 encodes the resulting split trigger
    state for ``build_app``: ``generate_medicaid_chip_id_numbers`` MUST BE
    PRESENT (it preserves the migration's provided medicaid_id / legacy chip_id
    and mints a chip_id only when NULL, on insert), while
    ``create_phases_and_dates_for_new_application`` and
    ``check_demonstration_primary_project_officer`` MUST BE ABSENT (deployed
    only post-P5 by ``refreshDbObjects.ts``; at load they would collide on the
    application_phase/date rows the migration inserts, or reject demos with no
    primary PO). Logs a reminder to manually confirm the backup operator +
    on-call rotation. Hard-fails via :func:`die` if any automated check fails so
    the operator never proceeds to ``freeze`` with a broken toolchain.
    """
    env = Env.load()
    ok = True

    log("P0.1 PG reachable")
    try:
        rows = psql_query(env, "SELECT 1")
        assert rows == [(1,)]
    except Exception as e:
        log(f"FAIL: PG not reachable: {e}")
        ok = False

    log("P0.2 PG cluster size + free space")
    try:
        rows = psql_query(
            env,
            "SELECT pg_size_pretty(pg_database_size(current_database()))",
        )
        log(f"  current database size: {rows[0][0]}")
    except Exception as e:
        log(f"FAIL: could not query DB size: {e}")
        ok = False

    log("P0.3 DuckDB sidecar available")
    if shutil.which("duckdb") is None:
        log("FAIL: duckdb not on PATH")
        ok = False
    else:
        try:
            import duckdb

            conn = duckdb.connect(":memory:")
            conn.execute("INSTALL mysql_scanner; INSTALL postgres_scanner;")
            conn.close()
        except Exception as e:
            log(f"FAIL: DuckDB scanners not installable: {e}")
            ok = False

    log("P0.4 pgloader available (v4 jar via Java, or v3 binary on PATH)")
    pgloader_problem = pgloader_runner_problem(env)
    if pgloader_problem:
        log(f"FAIL: {pgloader_problem}")
        ok = False

    log("P0.5 prisma ddl artifact cached (no network on cutover day)")
    if not PRISMA_PIN_FILE.exists():
        log(f"FAIL: pin file missing: {rel(PRISMA_PIN_FILE)}")
        ok = False
    else:
        sha = PRISMA_PIN_FILE.read_text(encoding="utf-8").strip().split()[0:1]
        if not sha:
            log(f"FAIL: pin file empty: {rel(PRISMA_PIN_FILE)}")
            ok = False
        else:
            cached = PRISMA_CACHE_DIR / f"{sha[0]}.sql"
            if not cached.exists():
                log(
                    f"FAIL: prisma ddl artifact not cached at {rel(cached)}; "
                    "run `make fetch_prisma` before cutover"
                )
                ok = False
            else:
                log(f"  cached: {rel(cached)}")

    if ok:
        log("P0.6 prod demos_app schema/seed/emptiness guard (live target vs reference)")
        run_prod_schema_guard(require_empty=True, label="preflight")

        log("P0.8 demonstration.chip_id present (mint-on-insert covers NULLs)")
        try:
            rows = psql_query(
                env,
                "SELECT is_nullable FROM information_schema.columns "
                "WHERE table_schema = 'demos_app' AND table_name = 'demonstration' "
                "AND column_name = 'chip_id'",
            )
            if not rows:
                log("FAIL: demos_app.demonstration.chip_id not found; schema not applied?")
                ok = False
            else:
                # No longer a HOLD on NOT NULL. The DEMOS
                # generate_medicaid_chip_id_numbers trigger (BEFORE INSERT) now mints a
                # chip_id for migrated rows that carry NULL, so chip_id may stay NOT
                # NULL. Nullability is informational; the enforced precondition moved to
                # P0.9 (that trigger must be present during build_app).
                log(
                    f"  chip_id nullability: {rows[0][0]} "
                    "(informational; mint-on-insert covers NULLs)"
                )
        except Exception as e:
            log(f"FAIL: could not query chip_id column: {e}")
            ok = False

        log("P0.9 DEMOS app-trigger deployment state for build_app")
        # After the DE's chip_id mint-on-insert change, the guarded trigger set splits:
        #   MUST BE PRESENT: generate_medicaid_chip_id_numbers -- BEFORE INSERT ON
        #     demonstration; modified to preserve the migration's provided medicaid_id /
        #     legacy chip_id and mint a chip_id only when NULL, so migrated NULL chip_ids
        #     are generated during the build_app insert.
        #   MUST BE ABSENT: create_phases_and_dates_for_new_application (AFTER INSERT ON
        #     application -> would double-create the application_phase/date rows the
        #     migration inserts) and check_demonstration_primary_project_officer
        #     (constraint trigger -> would reject demos with no primary PO). Both are
        #     deployed only post-P5 by refreshDbObjects.ts.
        # The modified trigger now ships in server/src/sql/functions.sql, and
        # init_pg.run_ddl deploys ONLY it (verbatim, via lib.mint_trigger_deploy_sql)
        # after the pinned Prisma DDL; build_app runs with demos_app.migration_mode='on'
        # so the loader-provided medicaid_id / legacy chip_id are accepted and NULL
        # chip_ids are minted on insert. This check therefore expects the mint trigger
        # PRESENT here. The demonstration loader still floors chip_id_number_seq above
        # every preserved legacy 21-W before the trigger mints, so a minted value cannot
        # collide with a preserved one (demonstration_chip_id_key UNIQUE).
        mint_trigger = "generate_medicaid_chip_id_numbers"
        must_be_absent = (
            "create_phases_and_dates_for_new_application",
            "check_demonstration_primary_project_officer",
        )
        try:
            rows = psql_query(
                env,
                "SELECT t.tgname FROM pg_trigger t "
                "JOIN pg_class c ON c.oid = t.tgrelid "
                "JOIN pg_namespace n ON n.oid = c.relnamespace "
                "WHERE n.nspname = 'demos_app' AND NOT t.tgisinternal "
                "AND t.tgname IN ("
                "'create_phases_and_dates_for_new_application', "
                "'generate_medicaid_chip_id_numbers', "
                "'check_demonstration_primary_project_officer')",
            )
            present = {str(r[0]) for r in rows}
            forbidden_present = sorted(present.intersection(must_be_absent))
            if forbidden_present:
                log(
                    "FAIL: DEMOS application trigger(s) present before build_app: "
                    f"{', '.join(forbidden_present)}. These are deployed by "
                    "refreshDbObjects.ts AFTER P5 (constraints), never before the load; "
                    "at load they would collide on application_phase/date PKs or fire "
                    "the primary-PO check. Rebuild the schema (migrate ddl) so they are "
                    "absent. See docs/developer/explanation-api-validation-audit.adoc "
                    "T0.2/T0.4."
                )
                ok = False
            if mint_trigger not in present:
                log(
                    f"FAIL: {mint_trigger} is absent. It must be deployed before "
                    "build_app so migrated rows with a NULL chip_id are minted on insert "
                    "(the migration supplies medicaid_id + preserved legacy chip_id and "
                    "leaves the remainder NULL). Deploy the modified trigger, then "
                    "re-run. See docs/developer/explanation-api-validation-audit.adoc T0.1."
                )
                ok = False
            if not forbidden_present and mint_trigger in present:
                log(
                    f"  {mint_trigger} present (mints NULL chip_ids on insert); "
                    "phases + primary-PO triggers absent (as expected pre-load)"
                )
        except Exception as e:
            log(f"FAIL: could not query app-trigger presence: {e}")
            ok = False
    else:
        log("P0.6/P0.8/P0.9 schema checks skipped (earlier checks failed)")

    log("P0.7 backup operator + on-call rotation -- manual confirmation required")

    if not ok:
        die("preflight failed; do not proceed")
