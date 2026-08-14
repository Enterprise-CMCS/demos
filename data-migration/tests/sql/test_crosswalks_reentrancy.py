"""run_crosswalks re-entrancy: crosswalk-dependent views are dropped first.

Each ``sql/04_crosswalks/*.sql`` recreates its table with
``DROP TABLE IF EXISTS mysql_raw.crosswalk_* `` (no ``CASCADE``). On a fresh
rebuild this is fine, but once ``stg.*`` / ``migration._parity_*`` views depend
on those tables (a targeted rebuild or any second run), the ``DROP TABLE``
fails. ``init_pg._drop_crosswalk_dependent_views`` clears those regenerable
dependents first so the phase is re-entrant.

Needs a live Postgres (``PG_TEST_DSN`` via ``pg_db``); no pg_jsonschema.
"""

from __future__ import annotations

import os
from typing import TYPE_CHECKING, Any

from migration import lib
from migration.phases import init_pg

if TYPE_CHECKING:
    import psycopg


def _env() -> lib.Env:
    return lib.Env(pg_url=os.environ["PG_TEST_DSN"], mysql_url="u", mysql_db="", pg_db="")


def _setup(conn: Any) -> None:
    conn.execute("DROP SCHEMA IF EXISTS mysql_raw, stg, migration CASCADE")
    for schema in ("mysql_raw", "stg", "migration"):
        conn.execute(f"CREATE SCHEMA {schema}")
    conn.execute(
        "CREATE TABLE mysql_raw.crosswalk_foo (legacy_int_cd int, demos_text_id text)"
    )


def _regclass(conn: Any, qualified: str) -> Any:
    row = conn.execute("SELECT to_regclass(%s)", (qualified,)).fetchone()
    assert row is not None
    return row[0]


def test_noop_when_no_dependent_views(pg_db: psycopg.Connection) -> None:
    """No dependents -> nothing dropped."""
    _setup(pg_db)
    assert init_pg._drop_crosswalk_dependent_views(_env()) == []


def test_drops_dependent_view_so_drop_table_succeeds(pg_db: psycopg.Connection) -> None:
    """A view on a crosswalk table is dropped, and the DDL's DROP TABLE re-runs."""
    _setup(pg_db)
    pg_db.execute(
        "CREATE VIEW stg.uses_cw AS SELECT legacy_int_cd FROM mysql_raw.crosswalk_foo"
    )
    dropped = init_pg._drop_crosswalk_dependent_views(_env())
    assert dropped == ["stg.uses_cw"]
    # The crosswalk DDL recreates the table with DROP TABLE (no CASCADE); it must
    # now succeed because the dependent view is gone.
    pg_db.execute("DROP TABLE mysql_raw.crosswalk_foo")


def test_drops_transitive_view_via_cascade(pg_db: psycopg.Connection) -> None:
    """A view-on-a-view is removed by CASCADE even though only the direct
    dependent is enumerated by pg_depend."""
    _setup(pg_db)
    pg_db.execute("CREATE VIEW stg.a AS SELECT legacy_int_cd FROM mysql_raw.crosswalk_foo")
    pg_db.execute("CREATE VIEW migration._parity_b AS SELECT legacy_int_cd FROM stg.a")
    dropped = init_pg._drop_crosswalk_dependent_views(_env())
    assert dropped == ["stg.a"]
    assert _regclass(pg_db, "stg.a") is None
    assert _regclass(pg_db, "migration._parity_b") is None
    pg_db.execute("DROP TABLE mysql_raw.crosswalk_foo")


def test_preserves_views_not_referencing_crosswalk(pg_db: psycopg.Connection) -> None:
    """A view that does not reference any crosswalk table is left untouched."""
    _setup(pg_db)
    pg_db.execute("CREATE TABLE mysql_raw.other (x int)")
    pg_db.execute("CREATE VIEW stg.unrelated AS SELECT x FROM mysql_raw.other")
    assert init_pg._drop_crosswalk_dependent_views(_env()) == []
    assert _regclass(pg_db, "stg.unrelated") is not None
