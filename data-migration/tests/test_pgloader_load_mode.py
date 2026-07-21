"""Guard the load *mode* of the pgloader templates.

CODE_REVIEW C5: ``schema.load`` once carried ``schema only``, so the "full
load" created every ``mysql_raw`` table empty. pgloader cannot run in this
environment (no MySQL), so these assert the template text -- the same class of
check that would have caught C5 -- to stop the flag from silently returning.
"""

from __future__ import annotations

from migration.lib import PGLOADER_DIR, cast_block

SCHEMA_LOAD = PGLOADER_DIR / "schema.load"
DELTA_LOAD = PGLOADER_DIR / "delta.tmpl.load"

# Casts that must survive both loads. Missing these in the delta (the C5
# sibling, CODE_REVIEW H7) silently drifts re-pulled rows' types.
_KEY_CASTS = (
    "type int when (= precision 1) to boolean",
    "type year to integer",
    "type bigint to bigint",
    "type blob to bytea",
)


def test_full_load_copies_data_not_schema_only() -> None:
    """The full load must create tables AND copy rows, never ``schema only``."""
    text = SCHEMA_LOAD.read_text(encoding="utf-8")
    assert "schema only" not in text
    assert "create tables" in text


def test_delta_load_is_data_only() -> None:
    """The delta load refills existing tables, so it stays ``data only``."""
    assert "data only" in DELTA_LOAD.read_text(encoding="utf-8")


def test_both_templates_share_one_cast_block() -> None:
    """Both templates must defer to the shared ``{{CAST_BLOCK}}`` marker (H7)."""
    assert "{{CAST_BLOCK}}" in SCHEMA_LOAD.read_text(encoding="utf-8")
    assert "{{CAST_BLOCK}}" in DELTA_LOAD.read_text(encoding="utf-8")


def test_shared_cast_block_has_key_casts() -> None:
    """The shared block carries the casts the delta previously dropped."""
    block = cast_block()
    for rule in _KEY_CASTS:
        assert rule in block, f"casts.load missing: {rule}"
