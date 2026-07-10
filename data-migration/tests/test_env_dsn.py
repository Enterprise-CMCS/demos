"""Tests for the Env DSN resolution (PG_URL override vs Secrets Manager)."""

from __future__ import annotations

from pathlib import Path

import pytest

from migration import lib, secrets


def test_pg_url_override_used_verbatim() -> None:
    """When PG_URL is set it is returned verbatim for both psycopg and pgloader."""
    env = lib.Env(pg_url="postgresql://u:p@h/d", mysql_url="mysql://u:p@h/m")
    assert env.pg_dsn() == "postgresql://u:p@h/d"
    assert env.pg_url_pgloader() == "postgresql://u:p@h/d"


def test_secret_name_derivation() -> None:
    """secret_name() derives demos-<env>-rds-admin unless overridden."""
    env = lib.Env(pg_url="", mysql_url="mysql://u:p@h/m", demos_env="staging")
    assert env.secret_name() == "demos-staging-rds-admin"
    env2 = lib.Env(pg_url="", mysql_url="mysql://u:p@h/m", db_secret_name="custom-secret")
    assert env2.secret_name() == "custom-secret"


def test_secret_path_builds_ssl_dsns(monkeypatch: pytest.MonkeyPatch) -> None:
    """No PG_URL: pg_dsn() is verify-full, pgloader is require, secret fetched once."""
    calls = {"n": 0}

    def fake_get(secret_id: str, region: str | None = None) -> dict:
        calls["n"] += 1
        return {"username": "admin", "password": "p@ss/word", "host": "db.demos", "port": 5432}  # pragma: allowlist secret

    monkeypatch.setattr(secrets, "get_secret_json", fake_get)
    monkeypatch.setattr(lib.Env, "_ensure_ca_bundle", lambda self: Path("/tmp/ca.pem"))
    env = lib.Env(pg_url="", mysql_url="mysql://u:p@h/m", demos_env="prod", db_name="demos")

    dsn = env.pg_dsn()
    assert dsn.startswith("postgresql://admin:")
    assert "@db.demos:5432/demos" in dsn
    assert "sslmode=verify-full" in dsn
    assert "sslrootcert" in dsn
    # Credentials are URL-encoded (the '@' and '/' in the password).
    assert "p%40ss%2Fword" in dsn

    loader = env.pg_url_pgloader()
    assert "sslmode=require" in loader
    assert "verify-full" not in loader

    # Both methods reuse the memoized secret -> a single fetch.
    assert calls["n"] == 1


def test_secret_missing_fields_dies(monkeypatch: pytest.MonkeyPatch) -> None:
    """A secret missing required fields hard-fails."""
    monkeypatch.setattr(secrets, "get_secret_json", lambda sid, region=None: {"username": "u"})
    monkeypatch.setattr(lib.Env, "_ensure_ca_bundle", lambda self: Path("/tmp/ca.pem"))
    env = lib.Env(pg_url="", mysql_url="mysql://u:p@h/m")
    with pytest.raises(SystemExit):
        env.pg_dsn()
