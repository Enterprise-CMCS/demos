"""Live-PG + standalone harness for the CSV-canonical crosswalk loader.

Covers ``migration.lib.copy_csv_into_table`` (the shared CSV-to-PG COPY
primitive) and the crosswalks-phase loading contract. The failure-asserting
tests (``test_missing_csv_dies``, ``test_bad_header_dies``) run without a
database so they execute in every environment; the data tests need
``PG_TEST_DSN`` and skip otherwise (CI provisions a postgres service).

The pgm_dtl fold-loop test verifies the tag-assignment loader honors
per-row ``from_dt_col``/``to_dt_col`` from ``mysql_raw.crosswalk_pgm_dtl_tag``
instead of hardcoding ``from_dt``/``to_dt`` -- the latent divergence fix.
"""

from __future__ import annotations

from pathlib import Path
from typing import TYPE_CHECKING, LiteralString, cast

import pytest

if TYPE_CHECKING:
    import psycopg

ROOT = Path(__file__).resolve().parents[2]
REPORTS_DIR = ROOT / "reports"
TAG_ASSIGNMENT_SQL = ROOT / "sql" / "21_app_associative" / "10_demonstration_type_tag_assignment.sql"


# ---------------------------------------------------------------------------
# Standalone failure tests (no database needed) -- run in every environment.
# ---------------------------------------------------------------------------


def test_missing_csv_dies(tmp_path: Path) -> None:
    """copy_csv_into_table dies when the CSV file does not exist."""
    from migration.lib import copy_csv_into_table

    # conn is None intentionally: the function validates the file path before
    # touching the connection, so it dies without ever needing a real one.
    with pytest.raises(SystemExit):
        copy_csv_into_table(
            cast("psycopg.Connection", None),
            "mysql_raw",
            "crosswalk_demo_status",
            tmp_path / "nope.csv",
        )


def test_bad_header_dies(tmp_path: Path) -> None:
    """copy_csv_into_table dies when the header does not match header_expect (M2 fix)."""
    from migration.lib import copy_csv_into_table

    bad = tmp_path / "bad.csv"
    bad.write_text("wrong,col,header\n1,a,b\n", encoding="utf-8")
    with pytest.raises(SystemExit):
        copy_csv_into_table(
            cast("psycopg.Connection", None),
            "stg",
            "_keep_ids",
            bad,
            header_expect=["entity", "legacy_id", "reason"],
        )


def test_registry_yaml_parses() -> None:
    """The crosswalk registry YAML exists, parses, and lists every expected table."""
    import yaml

    registry = REPORTS_DIR / "crosswalks" / "registry.yaml"
    assert registry.exists(), f"registry missing: {registry}"
    data = yaml.safe_load(registry.read_text(encoding="utf-8")) or {}
    entries = data.get("crosswalks") or []
    tables = {e["table"] for e in entries}
    expected = {
        "crosswalk_demo_status",
        "crosswalk_state",
        "crosswalk_signature_level",
        "crosswalk_role_person_type",
        "crosswalk_application_type",
        "crosswalk_sdg_division",
        "crosswalk_system_role",
        "crosswalk_deliverable_status",
        "crosswalk_amendment_status",
        "crosswalk_pgm_dtl_tag",
        "crosswalk_application_status",
        "crosswalk_document_type",
    }
    assert expected <= tables, f"registry missing tables: {expected - tables}"
    for e in entries:
        csv = REPORTS_DIR / e["csv"]
        assert csv.exists(), f"registry entry {e['table']} -> missing CSV {csv}"


def test_registry_columns_match_csv_headers() -> None:
    """Each registry ``columns`` list equals the actual CSV header verbatim.

    This is the contract passed to copy_csv_into_table as header_expect, so a
    drift between registry.yaml and the CSV would fail closed at load time;
    catch it here without a database instead.
    """
    import csv as csvmod

    import yaml

    registry = REPORTS_DIR / "crosswalks" / "registry.yaml"
    data = yaml.safe_load(registry.read_text(encoding="utf-8")) or {}
    entries = data.get("crosswalks") or []
    for e in entries:
        declared = e.get("columns")
        assert declared is not None, f"registry entry {e['table']} missing columns"
        with (REPORTS_DIR / e["csv"]).open(encoding="utf-8", newline="") as fh:
            header = next(csvmod.reader(fh))
        assert header == [str(c) for c in declared], (
            f"{e['csv']} header {header} != registry columns {declared}"
        )


def test_load_crosswalk_registry_returns_columns() -> None:
    """_load_crosswalk_registry yields (table, csv, columns) triples."""
    from migration.phases.init_pg import _load_crosswalk_registry

    rows = _load_crosswalk_registry()
    assert rows, "registry returned no entries"
    by_table = {t: (csv, cols) for t, csv, cols in rows}
    csv_name, cols = by_table["crosswalk_amendment_status"]
    assert csv_name == "crosswalks/amendment_status.csv"
    assert cols == ["legacy_int_cd", "legacy_name", "demos_text_id", "notes"]


# ---------------------------------------------------------------------------
# Live-PG data tests (need PG_TEST_DSN; skip otherwise).
# ---------------------------------------------------------------------------


def _provision_simple_table(conn: psycopg.Connection) -> None:
    conn.execute("DROP SCHEMA IF EXISTS mysql_raw CASCADE")
    conn.execute("CREATE SCHEMA mysql_raw")
    conn.execute(
        "CREATE TABLE mysql_raw.crosswalk_test "
        "(legacy_int_cd integer PRIMARY KEY, legacy_name text, demos_text_id text)"
    )


def test_copy_csv_loads_rows(pg_db: psycopg.Connection, tmp_path: Path) -> None:
    """COPY loads all rows with correct values."""
    from migration.lib import copy_csv_into_table

    _provision_simple_table(pg_db)
    csv = tmp_path / "test.csv"
    csv.write_text(
        "legacy_int_cd,legacy_name,demos_text_id\n1,Active,Active\n2,Pending,Pending\n",
        encoding="utf-8",
    )
    n = copy_csv_into_table(pg_db, "mysql_raw", "crosswalk_test", csv)
    assert n == 2
    with pg_db.cursor() as cur:
        cur.execute(
            "SELECT legacy_int_cd, demos_text_id "
            "FROM mysql_raw.crosswalk_test ORDER BY legacy_int_cd"
        )
        rows = cur.fetchall()
    assert rows == [(1, "Active"), (2, "Pending")]


def test_empty_cell_becomes_null(pg_db: psycopg.Connection, tmp_path: Path) -> None:
    """An empty CSV cell loads as NULL, not an empty string (sdg_division sentinel)."""
    from migration.lib import copy_csv_into_table

    _provision_simple_table(pg_db)
    csv = tmp_path / "test.csv"
    csv.write_text(
        "legacy_int_cd,legacy_name,demos_text_id\n0,Sentinel,\n1,Real,Active\n",
        encoding="utf-8",
    )
    copy_csv_into_table(pg_db, "mysql_raw", "crosswalk_test", csv)
    with pg_db.cursor() as cur:
        cur.execute("SELECT demos_text_id FROM mysql_raw.crosswalk_test WHERE legacy_int_cd = 0")
        assert cur.fetchone() == (None,)


def test_idempotent_rerun(pg_db: psycopg.Connection, tmp_path: Path) -> None:
    """TRUNCATE-then-COPY is stable across two runs (no duplicate rows)."""
    from migration.lib import copy_csv_into_table

    _provision_simple_table(pg_db)
    csv = tmp_path / "test.csv"
    csv.write_text(
        "legacy_int_cd,legacy_name,demos_text_id\n1,Active,Active\n2,Pending,Pending\n",
        encoding="utf-8",
    )
    copy_csv_into_table(pg_db, "mysql_raw", "crosswalk_test", csv)
    copy_csv_into_table(pg_db, "mysql_raw", "crosswalk_test", csv)
    with pg_db.cursor() as cur:
        cur.execute("SELECT count(*) FROM mysql_raw.crosswalk_test")
        assert cur.fetchone() == (2,)


# ---------------------------------------------------------------------------
# Fold-loop integration test: honors from_dt_col/to_dt_col from the crosswalk.
# ---------------------------------------------------------------------------


def _provision_fold_loop(conn: psycopg.Connection) -> None:
    """Build the minimal schemas the tag-assignment SQL reads."""
    conn.execute("DROP SCHEMA IF EXISTS mysql_raw CASCADE")
    conn.execute("DROP SCHEMA IF EXISTS demos_app CASCADE")
    conn.execute("DROP SCHEMA IF EXISTS migration CASCADE")
    conn.execute("CREATE SCHEMA mysql_raw")
    conn.execute("CREATE SCHEMA demos_app")
    conn.execute("CREATE SCHEMA migration")

    # Source table with NON-standard date column names (the divergence case).
    conn.execute(
        "CREATE TABLE mysql_raw.mdcd_test_pgm_dtl "
        "(mdcd_test_pgm_dtl_id int, mdcd_demo_id int, "
        " custom_from_dt date, custom_to_dt date, "
        " creatd_dt timestamp, dltd_ind smallint)"
    )
    conn.execute(
        "INSERT INTO mysql_raw.mdcd_test_pgm_dtl VALUES "
        "(1, 100, '2024-01-01', '2024-12-31', '2024-01-01', 0)"
    )

    # Crosswalk pointing to the custom date columns.
    conn.execute(
        "CREATE TABLE mysql_raw.crosswalk_pgm_dtl_tag "
        "(source_table text PRIMARY KEY, tag_name text, "
        " from_dt_col text, to_dt_col text, additional_attrs text, notes text)"
    )
    conn.execute(
        "INSERT INTO mysql_raw.crosswalk_pgm_dtl_tag VALUES "
        "('mdcd_test_pgm_dtl', 'Test Tag', 'custom_from_dt', 'custom_to_dt', NULL, NULL)"
    )

    # migration._id_map_mdcd_demo
    conn.execute(
        "CREATE TABLE migration._id_map_mdcd_demo "
        "(legacy_int_id int PRIMARY KEY, new_uuid uuid)"
    )
    conn.execute(
        "INSERT INTO migration._id_map_mdcd_demo VALUES (100, "
        "'11111111-1111-1111-1111-111111111111')"
    )

    # demos_app.demonstration (needs >=1 row for the guard)
    conn.execute("CREATE TABLE demos_app.demonstration (id uuid PRIMARY KEY)")
    conn.execute(
        "INSERT INTO demos_app.demonstration VALUES "
        "('11111111-1111-1111-1111-111111111111')"
    )

    # demos_app.tag + demonstration_type_tag_type_limit
    conn.execute(
        "CREATE TABLE demos_app.tag "
        "(tag_name_id text, tag_type_id text)"
    )
    conn.execute("INSERT INTO demos_app.tag VALUES ('Test Tag', 'demo_type')")

    conn.execute(
        "CREATE TABLE demos_app.demonstration_type_tag_type_limit (id text PRIMARY KEY)"
    )
    conn.execute("INSERT INTO demos_app.demonstration_type_tag_type_limit VALUES ('demo_type')")

    # Target table with the ON CONFLICT unique constraint.
    conn.execute(
        "CREATE TABLE demos_app.demonstration_type_tag_assignment "
        "(demonstration_id uuid, tag_name_id text, tag_type_id text, "
        " effective_date timestamptz, expiration_date timestamptz, "
        " created_at timestamptz, updated_at timestamptz, "
        " UNIQUE(demonstration_id, tag_name_id))"
    )


def test_pgm_dtl_tag_honors_custom_date_cols(pg_db: psycopg.Connection) -> None:
    """The fold loop uses from_dt_col/to_dt_col from the crosswalk, not hardcoded from_dt/to_dt.

    With custom_from_dt/custom_to_dt in the source and no from_dt/to_dt columns,
    the old hardcoded SQL would error. The rewritten SQL reads the column names
    from crosswalk_pgm_dtl_tag and loads the row correctly.
    """
    _provision_fold_loop(pg_db)
    pg_db.execute(cast(LiteralString, TAG_ASSIGNMENT_SQL.read_text(encoding="utf-8")))
    with pg_db.cursor() as cur:
        cur.execute(
            "SELECT tag_name_id, effective_date::date, expiration_date::date "
            "FROM demos_app.demonstration_type_tag_assignment"
        )
        rows = cur.fetchall()
    assert len(rows) == 1
    assert rows[0][0] == "Test Tag"
    assert str(rows[0][1]) == "2024-01-01"
    assert str(rows[0][2]) == "2024-12-31"


def _provision_window_check(conn: psycopg.Connection) -> None:
    """Like _provision_fold_loop but the target carries the real DEMOS
    CHECK (effective_date < expiration_date) and the source has three rows:
    a normal window, a zero-length window (from_dt == to_dt), and an inverted
    window (from_dt > to_dt). Standard from_dt/to_dt column names are used."""
    conn.execute("DROP SCHEMA IF EXISTS mysql_raw CASCADE")
    conn.execute("DROP SCHEMA IF EXISTS demos_app CASCADE")
    conn.execute("DROP SCHEMA IF EXISTS migration CASCADE")
    conn.execute("CREATE SCHEMA mysql_raw")
    conn.execute("CREATE SCHEMA demos_app")
    conn.execute("CREATE SCHEMA migration")
    conn.execute(
        "CREATE TABLE mysql_raw.mdcd_cmnty_enggmt_pgm_dtl "
        "(mdcd_demo_id int, from_dt date, to_dt date, "
        " creatd_dt timestamp, dltd_ind smallint)"
    )
    conn.execute(
        "INSERT INTO mysql_raw.mdcd_cmnty_enggmt_pgm_dtl VALUES "
        "(100, '2018-01-01', '2018-12-31', '2018-01-01', 0),"  # normal -> loads
        "(101, '2018-12-01', '2018-12-01', '2018-12-01', 0),"  # zero-length -> skip
        "(102, '2019-06-01', '2019-01-01', '2019-06-01', 0)"  # inverted -> skip
    )
    conn.execute(
        "CREATE TABLE mysql_raw.crosswalk_pgm_dtl_tag "
        "(source_table text PRIMARY KEY, tag_name text, "
        " from_dt_col text, to_dt_col text, additional_attrs text, notes text)"
    )
    conn.execute(
        "INSERT INTO mysql_raw.crosswalk_pgm_dtl_tag VALUES "
        "('mdcd_cmnty_enggmt_pgm_dtl', 'Community Engagement', NULL, NULL, NULL, NULL)"
    )
    conn.execute(
        "CREATE TABLE migration._id_map_mdcd_demo "
        "(legacy_int_id int PRIMARY KEY, new_uuid uuid)"
    )
    conn.execute(
        "INSERT INTO migration._id_map_mdcd_demo VALUES "
        "(100, '11111111-1111-1111-1111-111111111111'),"
        "(101, '22222222-2222-2222-2222-222222222222'),"
        "(102, '33333333-3333-3333-3333-333333333333')"
    )
    conn.execute("CREATE TABLE demos_app.demonstration (id uuid PRIMARY KEY)")
    conn.execute(
        "INSERT INTO demos_app.demonstration VALUES "
        "('11111111-1111-1111-1111-111111111111'),"
        "('22222222-2222-2222-2222-222222222222'),"
        "('33333333-3333-3333-3333-333333333333')"
    )
    conn.execute("CREATE TABLE demos_app.tag (tag_name_id text, tag_type_id text)")
    conn.execute("INSERT INTO demos_app.tag VALUES ('Community Engagement', 'demo_type')")
    conn.execute(
        "CREATE TABLE demos_app.demonstration_type_tag_type_limit (id text PRIMARY KEY)"
    )
    conn.execute("INSERT INTO demos_app.demonstration_type_tag_type_limit VALUES ('demo_type')")
    conn.execute(
        "CREATE TABLE demos_app.demonstration_type_tag_assignment "
        "(demonstration_id uuid, tag_name_id text, tag_type_id text, "
        " effective_date timestamptz, expiration_date timestamptz, "
        " created_at timestamptz, updated_at timestamptz, "
        " CONSTRAINT effective_date_check CHECK (effective_date < expiration_date), "
        " UNIQUE(demonstration_id, tag_name_id))"
    )


def test_pgm_dtl_tag_filters_nonpositive_window(pg_db: psycopg.Connection) -> None:
    """Zero-length (from_dt == to_dt) and inverted (from_dt > to_dt) source rows
    are filtered (they violate the DEMOS CHECK effective_date < expiration_date);
    only the positive-window row loads, and the loader does not raise."""
    _provision_window_check(pg_db)
    pg_db.execute(cast(LiteralString, TAG_ASSIGNMENT_SQL.read_text(encoding="utf-8")))
    with pg_db.cursor() as cur:
        cur.execute(
            "SELECT demonstration_id, effective_date::date, expiration_date::date "
            "FROM demos_app.demonstration_type_tag_assignment"
        )
        rows = cur.fetchall()
    assert len(rows) == 1
    assert str(rows[0][0]) == "11111111-1111-1111-1111-111111111111"
    assert str(rows[0][1]) == "2018-01-01"
    assert str(rows[0][2]) == "2018-12-31"


def test_pgm_dtl_tag_skips_unloaded_demonstration(pg_db: psycopg.Connection) -> None:
    """A source row whose parent demo was excluded (id-mapped but never loaded
    into demos_app.demonstration -- e.g. soft-deleted) must not produce an
    assignment, so the demonstration_id FK never orphans."""
    _provision_fold_loop(pg_db)
    # The id map points demo 100 at a uuid that is NOT in demos_app.demonstration.
    pg_db.execute("DELETE FROM demos_app.demonstration")
    pg_db.execute(
        "INSERT INTO demos_app.demonstration VALUES "
        "('99999999-9999-9999-9999-999999999999')"
    )
    pg_db.execute(cast(LiteralString, TAG_ASSIGNMENT_SQL.read_text(encoding="utf-8")))
    with pg_db.cursor() as cur:
        cur.execute("SELECT count(*) FROM demos_app.demonstration_type_tag_assignment")
        row = cur.fetchone()
    assert row is not None
    assert row[0] == 0
