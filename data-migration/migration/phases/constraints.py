"""P5: constraints + triggers + indexes.

FKs are owned by Prisma. ``init_pg.run_ddl`` captures their definitions
to ``state/prisma_fks.json`` and drops them so the bulk build can run
unconstrained. This phase re-creates them as ``NOT VALID`` and then
``VALIDATE``s them, then runs the rest of the P5 pipeline (constraint
triggers, app triggers, indexes, sequences). Hard-fails if any FK
remains unvalidated after the loop.
"""

from __future__ import annotations

import csv
import json
import re
from typing import LiteralString, cast

from psycopg import sql as psql

from migration.lib import (
    PRISMA_FKS_FILE,
    SQL_DIR,
    STATE_DIR,
    Env,
    apply_dir,
    die,
    log,
    phase,
    progress_for,
    psql_exec_composed,
    psql_query,
    rel,
)


def _list_invalid_fks(env: Env) -> list[tuple[str, str, str]]:
    """Return (schema, table, constraint_name) for every NOT VALID FK on demos_app.*."""
    rows = psql_query(
        env,
        """
        SELECT n.nspname  AS schema_name,
               c.relname  AS table_name,
               con.conname
        FROM pg_constraint con
        JOIN pg_class c ON c.oid = con.conrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE con.contype = 'f'
          AND NOT con.convalidated
          AND n.nspname = 'demos_app'
        ORDER BY schema_name, table_name, con.conname
        """,
    )
    return [(str(r[0]), str(r[1]), str(r[2])) for r in rows]


def _write_violations(violations: list[tuple[str, str, str]]) -> None:
    out = STATE_DIR / "fk_violations.csv"
    with out.open("w", encoding="utf-8", newline="") as f:
        w = csv.writer(f)
        w.writerow(["schema", "table", "constraint_name"])
        w.writerows(violations)
    log(f"wrote {rel(out)} ({len(violations)} rows)")


_FK_DEF_RE = re.compile(r"^FOREIGN KEY\b", re.IGNORECASE)


def _load_captured_fks() -> list[dict[str, str]]:
    """Read FKs captured by ``run_ddl`` from ``state/prisma_fks.json``."""
    if not PRISMA_FKS_FILE.exists():
        die(
            f"missing {rel(PRISMA_FKS_FILE)}; run `migrate ddl` to capture "
            "Prisma FKs before running constraints"
        )
    raw = json.loads(PRISMA_FKS_FILE.read_text(encoding="utf-8"))
    if not isinstance(raw, list):
        die(f"{rel(PRISMA_FKS_FILE)} is malformed: expected a list")
    return [dict(row) for row in raw]


def _readd_captured_fks(env: Env, fks: list[dict[str, str]]) -> None:
    """Re-create each captured FK as ``NOT VALID``.

    Preserves the original constraint name and the verbatim
    ``FOREIGN KEY ... REFERENCES ...`` clause from
    ``pg_get_constraintdef``; only appends ``NOT VALID`` so the bulk
    build's deferred validation pattern is preserved.

    Each FK is dropped (``IF EXISTS``) and re-added in a single
    ``ALTER TABLE`` so the phase is re-runnable after a partial failure:
    Postgres has no ``ADD CONSTRAINT IF EXISTS``, so a plain re-add would
    abort on the first already-present constraint. This mirrors the
    ``DROP CONSTRAINT IF EXISTS`` symmetry in ``init_pg``.

    Identifier interpolation goes through ``psycopg.sql.Identifier``
    per the policy on :func:`migration.lib.psql_query`. The verbatim
    ``definition`` is wrapped in ``psql.SQL``; the regex guard below
    is what makes that wrap safe -- it rejects any string that does
    not start with ``FOREIGN KEY``, so a malformed
    ``state/prisma_fks.json`` cannot smuggle arbitrary SQL.
    """
    if not fks:
        return
    for fk in fks:
        definition = fk["definition"].strip().rstrip(";")
        if not _FK_DEF_RE.match(definition):
            die(
                f"refusing to re-apply unexpected constraint def for "
                f"{fk['schema']}.{fk['table']} {fk['name']}: {definition!r}"
            )
        stmt = psql.SQL(
            "ALTER TABLE {tbl} DROP CONSTRAINT IF EXISTS {con}, "
            "ADD CONSTRAINT {con} {defn} NOT VALID"
        ).format(
            tbl=psql.Identifier(fk["schema"], fk["table"]),
            con=psql.Identifier(fk["name"]),
            # `definition` is verbatim pg_get_constraintdef output and has been
            # regex-guarded above to start with "FOREIGN KEY"; cast documents
            # that contract to psycopg.sql.SQL's LiteralString-typed overload.
            defn=psql.SQL(cast(LiteralString, definition)),
        )
        psql_exec_composed(env, stmt)
    log(f"re-added {len(fks)} FK(s) as NOT VALID")


@phase("constraints", requires="build_app")
def run_constraints() -> None:
    """Run P5: re-apply Prisma FKs (NOT VALID then VALIDATE), triggers, indexes.

    Requires the ``build_app`` gate. Reads the captured Prisma FK
    definitions from ``state/prisma_fks.json`` and re-creates them as
    ``NOT VALID`` so violations surface per-constraint instead of
    batch-failing the apply. Iterates ``VALIDATE CONSTRAINT`` for each.
    Then applies any remaining (migration-owned) constraint SQL plus
    constraint triggers, app triggers, indexes, and sequences. Writes
    ``state/fk_violations.csv`` and hard-fails if any FK is still
    unvalidated.
    """
    env = Env.load()

    fks = _load_captured_fks()
    log(f"re-applying {len(fks)} captured FK(s) from {rel(PRISMA_FKS_FILE)}")
    _readd_captured_fks(env, fks)

    # Any migration-owned constraint SQL still applies (currently empty
    # in the supplements model; the directory is kept for future use).
    apply_dir(env, SQL_DIR / "30_constraints")

    log("validating FKs")
    pending = _list_invalid_fks(env)
    with progress_for(len(pending), "validate FKs") as p:
        for schema, table, constraint_name in pending:
            p.step(f"{schema}.{table} {constraint_name}")
            stmt = psql.SQL("ALTER TABLE {tbl} VALIDATE CONSTRAINT {con}").format(
                tbl=psql.Identifier(schema, table),
                con=psql.Identifier(constraint_name),
            )
            try:
                psql_exec_composed(env, stmt)
            except Exception as e:
                log(f"  VIOLATION: {schema}.{table} {constraint_name}: {e}")

    apply_dir(env, SQL_DIR / "31_constraint_triggers")
    apply_dir(env, SQL_DIR / "32_app_triggers")
    apply_dir(env, SQL_DIR / "40_indexes")
    apply_dir(env, SQL_DIR / "50_sequences")

    remaining = _list_invalid_fks(env)
    _write_violations(remaining)
    if remaining:
        die(f"FK violations remain ({len(remaining)}); see state/fk_violations.csv")
