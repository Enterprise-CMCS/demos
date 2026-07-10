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
    holds no data before ``build_app`` writes. Logs a reminder to manually
    confirm the backup operator + on-call rotation. Hard-fails via
    :func:`die` if any automated check fails so the operator never
    proceeds to ``freeze`` with a broken toolchain.
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
    else:
        log("P0.6 prod-schema guard skipped (earlier checks failed)")

    log("P0.7 backup operator + on-call rotation -- manual confirmation required")

    if not ok:
        die("preflight failed; do not proceed")
