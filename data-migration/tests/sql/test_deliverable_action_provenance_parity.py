"""Parity check 25: every deliverable_action row was minted by this pipeline.

The check exists because ``demos_app.deliverable_action`` is written by two
independent migrations whose id spaces cannot overlap, so neither can see the
other's rows and the database has no natural key that would reject the overlap.
The failure mode is therefore silent duplication, which is exactly the kind of
thing a check can be written for and still never actually catch. Every test past
the happy path plants a foreign row and asserts the specific detail the check is
supposed to report.
"""

from __future__ import annotations

import uuid
from pathlib import Path
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    import psycopg

ROOT = Path(__file__).resolve().parents[2]
PARITY = ROOT / "sql" / "99_parity" / "65_deliverable_action_provenance.sql"

DELIV_A = uuid.UUID("11111111-1111-4111-8111-111111111111")
DELIV_B = uuid.UUID("22222222-2222-4222-8222-222222222222")
# A deliverable a parallel migration loaded: present in demos_app, absent from
# this pipeline's id map.
DELIV_FOREIGN = uuid.UUID("33333333-3333-4333-8333-333333333333")

ACTION_A1 = uuid.UUID("aaaa0001-0000-4000-8000-000000000001")
ACTION_A2 = uuid.UUID("aaaa0001-0000-4000-8000-000000000002")
ACTION_B1 = uuid.UUID("aaaa0001-0000-4000-8000-000000000003")

USER = uuid.UUID("bbbb0001-0000-4000-8000-00000000000b")


def _provision(conn: Any) -> None:
    """Stand up only what the check reads: the target table and two id maps."""
    conn.execute("DROP SCHEMA IF EXISTS migration, demos_app CASCADE")
    for schema in ("migration", "demos_app"):
        conn.execute(f"CREATE SCHEMA {schema}")

    conn.execute(
        "CREATE TABLE demos_app.deliverable_action ("
        " id uuid PRIMARY KEY, action_timestamp timestamptz NOT NULL,"
        " deliverable_id uuid NOT NULL, action_type_id text NOT NULL,"
        " old_status_id text NOT NULL, new_status_id text NOT NULL,"
        " note text, active_extension_id uuid,"
        " due_date_change_allowed boolean NOT NULL, should_have_note boolean NOT NULL,"
        " should_have_user_id boolean NOT NULL, extension_id_optional boolean NOT NULL,"
        " old_due_date timestamptz NOT NULL, new_due_date timestamptz NOT NULL,"
        " user_id uuid)"
    )
    conn.execute(
        "CREATE TABLE migration._id_map_deliverable_action ("
        " deliverable_id uuid NOT NULL, hop_seq integer NOT NULL,"
        " new_uuid uuid UNIQUE NOT NULL)"
    )
    conn.execute(
        "CREATE TABLE migration._id_map_mdcd_dlvrbl ("
        " legacy_int_id bigint PRIMARY KEY, new_uuid uuid UNIQUE NOT NULL)"
    )

    conn.execute(
        "INSERT INTO migration._id_map_mdcd_dlvrbl VALUES (100, %s), (200, %s)",
        (DELIV_A, DELIV_B),
    )
    for action_id, deliv, hop in (
        (ACTION_A1, DELIV_A, 1),
        (ACTION_A2, DELIV_A, 2),
        (ACTION_B1, DELIV_B, 1),
    ):
        conn.execute(
            "INSERT INTO migration._id_map_deliverable_action VALUES (%s, %s, %s)",
            (deliv, hop, action_id),
        )
        _insert_action(conn, action_id, deliv)


def _insert_action(conn: Any, action_id: uuid.UUID, deliverable_id: uuid.UUID) -> None:
    conn.execute(
        "INSERT INTO demos_app.deliverable_action VALUES ("
        " %s, now(), %s, 'Submitted Deliverable', 'Submitted', 'Submitted',"
        " NULL, NULL, false, false, true, true, now(), now(), %s)",
        (action_id, deliverable_id, USER),
    )


def _apply(conn: Any) -> None:
    """conn is Any because the SQL is read at runtime, not a LiteralString."""
    conn.execute(PARITY.read_text(encoding="utf-8"))


def _details(conn: Any) -> list[str]:
    rows = conn.execute(
        "SELECT detail FROM migration._parity_deliverable_action_provenance ORDER BY detail"
    ).fetchall()
    return [r[0] for r in rows]


def _count(conn: Any) -> int:
    row = conn.execute(
        "SELECT count(*) FROM migration._parity_deliverable_action_provenance"
    ).fetchone()
    assert row is not None
    return int(row[0])


def test_parity_applies_twice(pg_db: psycopg.Connection) -> None:
    """The file applies, and re-applies, cleanly."""
    _provision(pg_db)
    _apply(pg_db)
    _apply(pg_db)
    assert _count(pg_db) == 0


def test_green_when_every_row_was_minted_here(pg_db: psycopg.Connection) -> None:
    """The happy path: three actions, three id-map entries, nothing flagged."""
    _provision(pg_db)
    _apply(pg_db)
    assert _details(pg_db) == []


def test_view_absent_without_target_table(pg_db: psycopg.Connection) -> None:
    """The conditional-DDL guard makes the file a no-op before the app layer."""
    pg_db.execute("DROP SCHEMA IF EXISTS migration, demos_app CASCADE")
    pg_db.execute("CREATE SCHEMA migration")
    pg_db.execute(
        "CREATE TABLE migration._id_map_deliverable_action ("
        " deliverable_id uuid NOT NULL, hop_seq integer NOT NULL, new_uuid uuid NOT NULL)"
    )
    _apply(pg_db)

    row = pg_db.execute(
        "SELECT to_regclass('migration._parity_deliverable_action_provenance') IS NULL"
    ).fetchone()
    assert row is not None
    assert row[0] is True


def test_view_absent_without_id_map(pg_db: psycopg.Connection) -> None:
    """Guarded on the id map too, so a target-only harness is also a no-op."""
    pg_db.execute("DROP SCHEMA IF EXISTS migration, demos_app CASCADE")
    for schema in ("migration", "demos_app"):
        pg_db.execute(f"CREATE SCHEMA {schema}")
    pg_db.execute(
        "CREATE TABLE demos_app.deliverable_action ("
        " id uuid PRIMARY KEY, action_timestamp timestamptz NOT NULL,"
        " deliverable_id uuid NOT NULL, action_type_id text NOT NULL,"
        " old_status_id text NOT NULL, new_status_id text NOT NULL,"
        " note text, active_extension_id uuid,"
        " due_date_change_allowed boolean NOT NULL, should_have_note boolean NOT NULL,"
        " should_have_user_id boolean NOT NULL, extension_id_optional boolean NOT NULL,"
        " old_due_date timestamptz NOT NULL, new_due_date timestamptz NOT NULL,"
        " user_id uuid)"
    )
    _apply(pg_db)

    row = pg_db.execute(
        "SELECT to_regclass('migration._parity_deliverable_action_provenance') IS NULL"
    ).fetchone()
    assert row is not None
    assert row[0] is True


def test_detects_foreign_row_on_a_deliverable_we_loaded(
    pg_db: psycopg.Connection,
) -> None:
    """An extra action written onto one of our own timelines.

    This is the shape the dbt submission-events model produces once its
    deliverables happen to coincide with ours: a fresh gen_random_uuid() action
    hanging off a deliverable this pipeline already migrated.
    """
    _provision(pg_db)
    _apply(pg_db)
    _insert_action(pg_db, uuid.uuid4(), DELIV_A)

    assert _details(pg_db) == ["on a deliverable this pipeline loaded"]


def test_detects_foreign_row_on_a_foreign_deliverable(
    pg_db: psycopg.Connection,
) -> None:
    """A parallel migration that loaded its own deliverables as well as actions.

    Check 62 cannot see this one: it walks the deliverables *this* pipeline
    loaded, so actions hanging off someone else's deliverable ids are outside
    its frame entirely.
    """
    _provision(pg_db)
    _apply(pg_db)
    _insert_action(pg_db, uuid.uuid4(), DELIV_FOREIGN)

    assert _details(pg_db) == [
        "on a deliverable unknown to this pipeline (parallel migration)"
    ]


def test_reports_both_kinds_separately(pg_db: psycopg.Connection) -> None:
    """The two details are distinguished because they need different responses."""
    _provision(pg_db)
    _apply(pg_db)
    _insert_action(pg_db, uuid.uuid4(), DELIV_A)
    _insert_action(pg_db, uuid.uuid4(), DELIV_FOREIGN)

    assert _details(pg_db) == [
        "on a deliverable this pipeline loaded",
        "on a deliverable unknown to this pipeline (parallel migration)",
    ]


def test_reports_every_foreign_row_not_just_the_first(
    pg_db: psycopg.Connection,
) -> None:
    """A double-load plants thousands of rows; the check must not collapse them."""
    _provision(pg_db)
    _apply(pg_db)
    for _ in range(5):
        _insert_action(pg_db, uuid.uuid4(), DELIV_A)

    assert _count(pg_db) == 5


def test_ignores_id_map_entries_with_no_row(pg_db: psycopg.Connection) -> None:
    """The reverse direction is deliberately not asserted.

    An id-map entry without a surviving action row is a different failure, and
    nothing in the loader guarantees the pairing for held deliverables. Encoding
    the decision as a test keeps a future contributor from "tightening" the
    check into a gate that reds on an unobserved state.
    """
    _provision(pg_db)
    _apply(pg_db)
    pg_db.execute(
        "INSERT INTO migration._id_map_deliverable_action VALUES (%s, 99, %s)",
        (DELIV_A, uuid.uuid4()),
    )

    assert _count(pg_db) == 0


def test_empty_target_table_is_green(pg_db: psycopg.Connection) -> None:
    """Nothing loaded yet is not a provenance failure."""
    _provision(pg_db)
    pg_db.execute("DELETE FROM demos_app.deliverable_action")
    _apply(pg_db)

    assert _count(pg_db) == 0
