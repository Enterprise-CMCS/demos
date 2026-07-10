"""Fixtures for the live-engine integration tier.

Each fixture reads a ``*_TEST_DSN`` / ``REFERENCE_PG_URL`` env var and
``pytest.skip``s when it is unset or the server is unreachable, so the default
unit suite (and CI without engines) stays green. Bring the engines up with
``make compose-up`` and export the DSNs printed in ``docker-compose.test.yml``.
"""

from __future__ import annotations

import os
from collections.abc import Iterator

import pytest


def _require_pg(env_var: str, label: str):
    """Return an autocommit psycopg connection from ``env_var`` or skip."""
    dsn = os.environ.get(env_var)
    if not dsn:
        pytest.skip(f"{env_var} not set; skipping {label}")

    import psycopg

    try:
        conn = psycopg.connect(dsn, autocommit=True)
    except psycopg.Error as e:
        pytest.skip(f"{env_var} set but unreachable: {e}")
    return conn


@pytest.fixture
def target_pg() -> Iterator[object]:
    """Autocommit connection to the target Postgres (``PG_TEST_DSN``)."""
    conn = _require_pg("PG_TEST_DSN", "target-PG integration test")
    try:
        yield conn
    finally:
        conn.close()


@pytest.fixture
def reference_pg() -> Iterator[object]:
    """Autocommit connection to the reference Postgres (``REFERENCE_PG_URL``)."""
    conn = _require_pg("REFERENCE_PG_URL", "reference-PG integration test")
    try:
        yield conn
    finally:
        conn.close()


@pytest.fixture
def mysql_conn() -> Iterator[object]:
    """Autocommit connection to the source MySQL (``MYSQL_URL``).

    Uses whichever DBAPI driver is installed (PyMySQL or mysql-connector);
    skips if neither the DSN nor a driver is available.
    """
    dsn = os.environ.get("MYSQL_URL")
    if not dsn:
        pytest.skip("MYSQL_URL not set; skipping MySQL integration test")

    from urllib.parse import unquote, urlparse

    u = urlparse(dsn)
    try:
        import pymysql

        conn = pymysql.connect(
            host=u.hostname or "localhost",
            port=u.port or 3306,
            user=unquote(u.username) if u.username else "root",
            password=unquote(u.password) if u.password else "",
            database=u.path.lstrip("/"),
            autocommit=True,
        )
    except ImportError:
        pytest.skip("pymysql not installed; skipping MySQL integration test")
    except Exception as e:  # connection refused, auth, etc.
        pytest.skip(f"MYSQL_URL set but unreachable: {e}")
    try:
        yield conn
    finally:
        conn.close()
