"""Live check that the UTC session-timezone pin is honored end-to-end.

``Env.pg_dsn`` appends ``options=-c%20timezone%3DUTC`` to the built RDS DSN so
every psycopg apply connection runs with ``TimeZone=UTC`` (defense-in-depth
alongside the explicit Eastern date anchoring). This connects with that exact
URI encoding and asserts libpq/psycopg actually applies it, guarding against a
regression where the space is encoded as '+' (which libpq would not decode).

Runs against a throwaway Postgres (``PG_TEST_DSN``); self-skips without it.
"""

from __future__ import annotations

import os
import urllib.parse

import pytest


def test_options_uri_encoding_sets_utc() -> None:
    dsn = os.environ.get("PG_TEST_DSN")
    if not dsn:
        pytest.skip("PG_TEST_DSN not set; skipping session-timezone live check")

    import psycopg

    parts = urllib.parse.urlsplit(dsn)
    query = urllib.parse.urlencode(
        {"options": "-c timezone=UTC"}, quote_via=urllib.parse.quote
    )
    joined = f"{parts.query}&{query}" if parts.query else query
    pinned = urllib.parse.urlunsplit(
        (parts.scheme, parts.netloc, parts.path, joined, parts.fragment)
    )
    assert "options=-c%20timezone%3DUTC" in pinned

    try:
        conn = psycopg.connect(pinned, autocommit=True)
    except psycopg.Error as e:  # pragma: no cover - environment guard
        pytest.skip(f"PG_TEST_DSN set but unreachable: {e}")
    try:
        row = conn.execute("SHOW TimeZone").fetchone()
        assert row is not None
        assert row[0] == "UTC"
    finally:
        conn.close()
