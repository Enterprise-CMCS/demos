"""build_app truncate-CASCADE safety against a live Postgres (CODE_REVIEW H1, test #1).

``run_build_app`` truncates the ``demos_app`` *data* tables while excluding the
Prisma-seeded reference tables (``state/prisma_seeded_tables.json``). But once
the constraints phase has re-added and VALIDATEd the Prisma FKs, a plain
``TRUNCATE <data> CASCADE`` cascades through those FKs into the excluded seeded
lookups, silently defeating the very guard the seeded-table capture exists to
provide (CODE_REVIEW H1).

This harness reproduces the hazard with a minimal two-table schema -- a seeded
lookup that holds a FK into a data table -- so ``TRUNCATE <data> CASCADE`` would
wipe the seeded row. It then re-runs ``run_build_app`` and asserts the seeded
row survives. It needs a live Postgres (``PG_TEST_DSN``) but no pg_jsonschema.
"""

from __future__ import annotations

import os
from typing import TYPE_CHECKING

import pytest

from migration import lib
from migration.phases import build

if TYPE_CHECKING:
    from pathlib import Path

    import psycopg


def _seed_schema(conn: psycopg.Connection) -> None:
    """Build demos_app with a seeded lookup that references a data table.

    ``seed_lookup.data_id -> data_tbl.id`` is the re-added/VALIDATED FK; with
    it in place ``TRUNCATE demos_app.data_tbl CASCADE`` cascades into the
    excluded ``seed_lookup``.
    """
    conn.execute("DROP SCHEMA IF EXISTS demos_app CASCADE")
    conn.execute("CREATE SCHEMA demos_app")
    conn.execute("CREATE TABLE demos_app.data_tbl (id int PRIMARY KEY)")
    conn.execute(
        "CREATE TABLE demos_app.seed_lookup (id int PRIMARY KEY, data_id int)"
    )
    conn.execute(
        "ALTER TABLE demos_app.seed_lookup "
        "ADD CONSTRAINT seed_lookup_data_fkey "
        "FOREIGN KEY (data_id) REFERENCES demos_app.data_tbl (id)"
    )
    conn.execute("INSERT INTO demos_app.data_tbl (id) VALUES (1)")
    conn.execute("INSERT INTO demos_app.seed_lookup (id, data_id) VALUES (1, 1)")


def _count(conn: psycopg.Connection, table: str) -> int:
    from psycopg import sql

    row = conn.execute(
        sql.SQL("SELECT count(*) FROM {}").format(sql.Identifier("demos_app", table))
    ).fetchone()
    assert row is not None
    return int(row[0])


def test_build_app_preserves_seeded_lookup_behind_validated_fk(
    pg_db: psycopg.Connection,
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
) -> None:
    """Re-running build_app must not cascade-truncate an excluded seeded lookup."""
    _seed_schema(pg_db)

    dsn = os.environ["PG_TEST_DSN"]
    monkeypatch.setattr(lib, "STATE_DIR", tmp_path)
    monkeypatch.setattr(
        build.Env,
        "load",
        classmethod(lambda cls: lib.Env(pg_url=dsn, mysql_url="u", mysql_db="", pg_db="")),
    )
    lib.mark_gate("build_stg")

    # seed_lookup is the Prisma-seeded reference table build_app must preserve.
    monkeypatch.setattr(build, "_load_seeded_tables", lambda: ["seed_lookup"])
    # Isolate the truncation behavior from the (schema-dependent) app SQL.
    monkeypatch.setattr(build, "_collect_app_files", lambda: [])

    build.run_build_app()

    assert _count(pg_db, "data_tbl") == 0, "the data table must be truncated"
    assert _count(pg_db, "seed_lookup") == 1, (
        "the excluded seeded lookup must survive; TRUNCATE ... CASCADE through the "
        "re-added FK wiped it (CODE_REVIEW H1)"
    )
    assert lib.gate_path("build_app").exists()
