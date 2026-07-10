"""Shared pytest fixtures."""

from __future__ import annotations

import os
from collections.abc import Iterator
from pathlib import Path
from typing import TYPE_CHECKING

import pytest

if TYPE_CHECKING:
    import psycopg


@pytest.fixture
def pg_db() -> Iterator[psycopg.Connection]:
    """Yield an autocommit connection to a throwaway Postgres for SQL harness tests.

    Reads ``PG_TEST_DSN`` and ``pytest.skip``s when it is unset or the
    server is unreachable, so the suite stays runnable without a database.
    CI sets ``PG_TEST_DSN`` to a postgres service so these tests execute
    there. The connection is plain (no SSL forcing): unlike ``Env.pg_dsn``
    this targets a disposable local/CI server, never the DEMOS RDS.
    """
    dsn = os.environ.get("PG_TEST_DSN")
    if not dsn:
        pytest.skip("PG_TEST_DSN not set; skipping Postgres SQL apply-twice harness")

    import psycopg

    try:
        conn = psycopg.connect(dsn, autocommit=True)
    except psycopg.Error as e:
        pytest.skip(f"PG_TEST_DSN set but unreachable: {e}")
    try:
        yield conn
    finally:
        conn.close()


@pytest.fixture(autouse=True)
def _reset_env_cache() -> Iterator[None]:
    """Make Env.load() re-read os.environ for every test."""
    from migration import lib

    lib.reset_env_cache()
    yield
    lib.reset_env_cache()


@pytest.fixture
def tmp_state_dir(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Path:
    """Redirect migration.lib.STATE_DIR to a tmp dir for the duration of a test."""
    from migration import lib

    monkeypatch.setattr(lib, "STATE_DIR", tmp_path)
    return tmp_path
