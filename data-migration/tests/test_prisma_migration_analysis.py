"""Unit tests for docs/tools/prisma_migration_analysis.py.

The generator lives under docs/tools (not an installed package), so it is
imported by path. These tests pin the behaviour that makes the tool more
trustworthy than a naive ``grep``: dollar-quoted ``DO`` blocks are treated as
one statement (so inner ``UPDATE``/``;`` are not miscounted), and each
migration-relevant statement category is classified from the leading keyword.
"""

from __future__ import annotations

import importlib.util
import sys
from pathlib import Path

_TOOLS_DIR = Path(__file__).resolve().parents[1] / "docs" / "tools"
sys.path.insert(0, str(_TOOLS_DIR))


def _load(name: str):
    spec = importlib.util.spec_from_file_location(name, _TOOLS_DIR / f"{name}.py")
    assert spec is not None
    assert spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


pma = _load("prisma_migration_analysis")


def test_split_statements_treats_do_block_as_one() -> None:
    sql = """
    ALTER TABLE demos_app.demonstration ADD COLUMN medicaid_id TEXT;
    DO
    $$
    BEGIN
        ALTER TABLE demos_app.demonstration DISABLE TRIGGER log_changes_demonstration;
        UPDATE demos_app.demonstration SET medicaid_id = '1';
    END
    $$;
    """
    stmts = pma.split_statements(sql)
    assert len(stmts) == 2
    # The inner UPDATE / inner ; must not leak out as a separate statement.
    assert "DISABLE TRIGGER" in stmts[1]
    assert stmts[1].count("UPDATE") == 1


def test_split_statements_ignores_semicolons_in_line_comments() -> None:
    sql = "CREATE TABLE a (id int); -- a; b; c\nCREATE TABLE b (id int);"
    stmts = pma.split_statements(sql)
    assert len(stmts) == 2


def test_classify_categorises_each_statement_kind() -> None:
    stmts = [
        'CREATE TABLE "on_demand_report" (id text)',
        "CREATE SEQUENCE demos_app.medicaid_id_number_seq START WITH 11000",
        "INSERT INTO date_type (id) VALUES ('X')",
        "ALTER TABLE demos_app.demonstration ADD COLUMN medicaid_id TEXT, ADD COLUMN chip_id TEXT",
        "ALTER TABLE demos_app.demonstration ALTER COLUMN medicaid_id SET NOT NULL",
        "ALTER TABLE demos_app.reference ALTER COLUMN description DROP DEFAULT",
        'ALTER TABLE "demonstration" ADD CONSTRAINT demonstration_signature_level_check CHECK (x)',
        "DELETE FROM permission WHERE id = '1'",
        "WITH n AS (SELECT 1) UPDATE demonstration AS d SET x = 1 FROM n INNER JOIN state s ON true",
    ]
    f = pma.classify("m", stmts)
    assert f.created_tables == ["on_demand_report"]
    assert f.created_sequences == ["medicaid_id_number_seq"]
    assert f.inserts == ["date_type"]
    assert f.added_columns == ["demonstration.medicaid_id", "demonstration.chip_id"]
    assert f.set_not_null == ["demonstration.medicaid_id"]
    assert f.drop_default == ["reference.description"]
    assert f.checks == ["demonstration: demonstration_signature_level_check"]
    assert f.deletes == ["permission"]
    assert f.backfills == 1
    assert f.backfill_joins == 1
    assert f.is_noteworthy()


def test_classify_flags_conflict_merge_upsert() -> None:
    f = pma.classify("m", ["INSERT INTO t VALUES (1) ON CONFLICT DO NOTHING"])
    assert f.risky


def test_parse_ddl_segments_by_migration_banner() -> None:
    text = (
        "-- migration: 0001_a\n"
        "CREATE TABLE a (id int);\n"
        "-- migration: 0002_b\n"
        "CREATE TABLE b (id int);\n"
    )
    facts = pma.parse_ddl(text)
    assert [x.name for x in facts] == ["0001_a", "0002_b"]
    assert facts[0].created_tables == ["a"]
    assert facts[1].created_tables == ["b"]
