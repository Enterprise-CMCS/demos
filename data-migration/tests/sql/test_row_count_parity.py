"""Live-PG harness for the row-count parity view (parity checks 1 + 2).

Exercises ``sql/99_parity/90_row_counts.sql`` against a hand-built set of the
source resolvers, targets, and hold-back views it reconciles (no ``mysql_raw``
needed -- the view only ``count(*)``s ``stg.*``/``demos_app.*``/``migration._parity_*``
objects); self-skips without ``PG_TEST_DSN``.

Regression focus (RED-A/RED-B): the ``demonstration`` family target
``demos_app.demonstration`` is a CONSOLIDATED family -- both the approved-track
resolver (``stg.demonstration_resolved``) AND the workflow-7 pending resolver
(``stg.pending_demonstration_resolved``, loaded by ``sql/20_app/31``) land in it.
The family's source/held terms must therefore include the pending contribution
and its hold-back (``migration._parity_pending_demonstration_held``) or the
cross-foot ``source = target + held`` goes RED with a negative delta equal to
the pending rows that loaded but were never counted on the source side.
"""

from __future__ import annotations

from pathlib import Path
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    import psycopg

ROOT = Path(__file__).resolve().parents[2]
ROW_COUNTS = ROOT / "sql" / "99_parity" / "90_row_counts.sql"

# Per-family seeded counts chosen so every family cross-foots source = target +
# held. The demonstration family deliberately splits its source across the
# approved and pending resolvers and its hold-back across the approved dup view
# and the pending held view, so an unfixed check (approved-only) reports a
# negative delta equal to the loaded pending rows.
APPROVED_SRC = 3          # stg.demonstration_resolved
APPROVED_HELD = 1         # _parity_demonstration_held_dup_medicaid_id
PENDING_SRC = 3           # stg.pending_demonstration_resolved
PENDING_HELD = 1          # _parity_pending_demonstration_held
# target = (approved_src - approved_held) + (pending_src - pending_held)
DEMO_TARGET = (APPROVED_SRC - APPROVED_HELD) + (PENDING_SRC - PENDING_HELD)  # 4


def _apply(conn: Any, path: Path) -> None:
    conn.execute(path.read_text(encoding="utf-8"))


def _mk_counted(conn: Any, qualified: str, n: int) -> None:
    """Create a trivial one-column table and insert ``n`` rows (count(*) == n)."""
    conn.execute(f"CREATE TABLE {qualified} (x int)")
    for _ in range(n):
        conn.execute(f"INSERT INTO {qualified} (x) VALUES (1)")


def _provision(conn: Any) -> None:
    conn.execute("DROP SCHEMA IF EXISTS stg, migration, demos_app CASCADE")
    for schema in ("stg", "migration", "demos_app"):
        conn.execute(f"CREATE SCHEMA {schema}")

    # person family: source == target, no hold-back.
    _mk_counted(conn, "stg.users_resolved", 3)
    _mk_counted(conn, "demos_app.person", 3)

    # demonstration family: approved + pending resolvers -> one consolidated target.
    _mk_counted(conn, "stg.demonstration_resolved", APPROVED_SRC)
    _mk_counted(conn, "stg.pending_demonstration_resolved", PENDING_SRC)
    _mk_counted(conn, "demos_app.demonstration", DEMO_TARGET)
    _mk_counted(conn, "migration._parity_demonstration_held_dup_medicaid_id", APPROVED_HELD)
    _mk_counted(conn, "migration._parity_pending_demonstration_held", PENDING_HELD)

    # deliverable family.
    _mk_counted(conn, "stg.deliverable_resolved", 5)
    _mk_counted(conn, "demos_app.deliverable", 4)
    _mk_counted(conn, "migration._parity_deliverable_held", 1)

    # comment family (two sources, two targets, two hold-backs).
    _mk_counted(conn, "stg.comment_resolved", 3)
    _mk_counted(conn, "stg.override_note_resolved", 2)
    _mk_counted(conn, "demos_app.private_comment", 2)
    _mk_counted(conn, "demos_app.public_comment", 2)
    _mk_counted(conn, "migration._parity_comment_held", 1)
    _mk_counted(conn, "migration._parity_override_note_held", 0)

    # system_role_assignment family.
    _mk_counted(conn, "stg.system_role_assignment_resolved", 2)
    _mk_counted(conn, "demos_app.system_role_assignment", 2)

    _apply(conn, ROW_COUNTS)


def _family(conn: Any, family: str) -> tuple[int, int, int, int]:
    row = conn.execute(
        "SELECT source_count, target_count, held_count, delta "
        "FROM migration._parity_row_counts WHERE family = %s",
        (family,),
    ).fetchone()
    assert row is not None, f"family {family} missing from _parity_row_counts"
    return int(row[0]), int(row[1]), int(row[2]), int(row[3])


def test_demonstration_family_counts_pending_source_and_held(
    pg_db: psycopg.Connection,
) -> None:
    """The demonstration family folds in the pending resolver + pending hold-back."""
    _provision(pg_db)
    source, target, held, delta = _family(pg_db, "demonstration")
    assert source == APPROVED_SRC + PENDING_SRC  # 6, not the approved-only 3
    assert target == DEMO_TARGET  # 4
    assert held == APPROVED_HELD + PENDING_HELD  # 2, not the approved-only 1
    assert delta == 0


def test_every_family_reconciles_zero_delta(pg_db: psycopg.Connection) -> None:
    """No family silently drops or over-counts: delta == 0 across the board."""
    _provision(pg_db)
    offenders = pg_db.execute(
        "SELECT family, delta FROM migration._parity_row_counts WHERE delta <> 0"
    ).fetchall()
    assert offenders == []


def test_count_checksum_cross_foots(pg_db: psycopg.Connection) -> None:
    """Check 2: sum(source) == sum(target) + sum(held) across families."""
    _provision(pg_db)
    row = pg_db.execute(
        "SELECT coalesce(sum(source_count),0), coalesce(sum(target_count),0), "
        "coalesce(sum(held_count),0) FROM migration._parity_row_counts"
    ).fetchone()
    assert row is not None
    src, tgt, held = int(row[0]), int(row[1]), int(row[2])
    assert src == tgt + held


def test_row_counts_view_is_idempotent(pg_db: psycopg.Connection) -> None:
    """Re-applying 90_row_counts.sql leaves the reconciliation unchanged."""
    _provision(pg_db)
    before = _family(pg_db, "demonstration")
    _apply(pg_db, ROW_COUNTS)
    after = _family(pg_db, "demonstration")
    assert before == after == (APPROVED_SRC + PENDING_SRC, DEMO_TARGET,
                               APPROVED_HELD + PENDING_HELD, 0)
