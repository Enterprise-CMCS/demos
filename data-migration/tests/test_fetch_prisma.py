"""Tests for migration.phases.fetch_prisma."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path

import pytest

from migration import lib
from migration.phases import fetch_prisma
from migration.phases.fetch_prisma import HttpGet


@pytest.fixture
def prisma_paths(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> dict[str, Path]:
    """Redirect every Prisma path constant in lib + fetch_prisma to tmp dirs."""
    cache = tmp_path / "state" / "prisma_ddl"
    pin = tmp_path / "reports" / "prisma_ddl.sha256"
    src = tmp_path / "reports" / "prisma_ddl_source.txt"
    manifest = tmp_path / "reports" / "prisma_ddl.manifest.json"
    pin.parent.mkdir(parents=True, exist_ok=True)
    monkeypatch.setattr(lib, "PRISMA_CACHE_DIR", cache)
    monkeypatch.setattr(lib, "PRISMA_PIN_FILE", pin)
    monkeypatch.setattr(lib, "PRISMA_SOURCE_FILE", src)
    monkeypatch.setattr(lib, "PRISMA_DDL_MANIFEST_FILE", manifest)
    monkeypatch.setattr(fetch_prisma, "PRISMA_CACHE_DIR", cache)
    monkeypatch.setattr(fetch_prisma, "PRISMA_PIN_FILE", pin)
    monkeypatch.setattr(fetch_prisma, "PRISMA_SOURCE_FILE", src)
    monkeypatch.setattr(fetch_prisma, "PRISMA_DDL_MANIFEST_FILE", manifest)
    return {"cache": cache, "pin": pin, "src": src, "manifest": manifest}


def _set_env(
    monkeypatch: pytest.MonkeyPatch,
    *,
    repo: str = "Enterprise-CMCS/demos",
    ref: str = "main",
    path: str = "server/src/model/migrations",
    token: str = "",
) -> None:
    monkeypatch.setenv("PG_URL", "postgresql://u:p@h/d")
    monkeypatch.setenv("MYSQL_URL", "mysql://u:p@h/m")
    monkeypatch.setenv("PRISMA_REPO", repo)
    monkeypatch.setenv("PRISMA_REPO_REF", ref)
    monkeypatch.setenv("PRISMA_MIGRATIONS_PATH", path)
    monkeypatch.setenv("GITHUB_TOKEN", token)


def _stub_http(responses: dict[str, bytes]) -> tuple[HttpGet, list[str]]:
    """Build an injectable ``get`` from a URL -> bytes table + a call log.

    Returns ``(get, calls)``; pass ``get`` to the function under test
    (``_compose_ddl``/``ensure_prisma_ddl``/``run_fetch_prisma``) instead of
    monkeypatching the module-internal ``_http_get``.
    """
    calls: list[str] = []

    def fake_get(url: str, *, accept: str | None = None) -> bytes:
        calls.append(url)
        if url not in responses:
            raise AssertionError(f"unexpected URL fetched: {url}")
        return responses[url]

    return fake_get, calls


def _never_get(url: str, *, accept: str | None = None) -> bytes:
    """An injectable ``get`` that fails if called (asserts no network)."""
    raise AssertionError(f"network must not be used; attempted: {url}")


def _listing(dirs: list[str], extra: list[dict] | None = None) -> bytes:
    """Build a GitHub Contents API JSON payload listing the given dir names."""
    payload: list[dict] = [{"name": d, "type": "dir"} for d in dirs]
    payload.extend(extra or [])
    return json.dumps(payload).encode("utf-8")


def _api_url(repo: str = "Enterprise-CMCS/demos", ref: str = "main") -> str:
    return (
        f"https://api.github.com/repos/{repo}/contents/"
        f"server/src/model/migrations?ref={ref}"
    )


def _raw_url(d: str, repo: str = "Enterprise-CMCS/demos", ref: str = "main") -> str:
    return (
        f"https://raw.githubusercontent.com/{repo}/{ref}/"
        f"server/src/model/migrations/{d}/migration.sql"
    )


def test_pin_missing_dies(prisma_paths: dict[str, Path], monkeypatch: pytest.MonkeyPatch) -> None:
    """A missing pin file is a hard fail with a targeted message."""
    _set_env(monkeypatch)
    with pytest.raises(SystemExit):
        fetch_prisma.ensure_prisma_ddl()


@pytest.mark.parametrize("bad_pin", ["", "not-a-hash", "abc", "z" * 64])
def test_pin_invalid_dies(
    bad_pin: str, prisma_paths: dict[str, Path], monkeypatch: pytest.MonkeyPatch
) -> None:
    """A pin that isn't a 64-char hex sha must die loudly."""
    _set_env(monkeypatch)
    prisma_paths["pin"].write_text(bad_pin, encoding="utf-8")
    with pytest.raises(SystemExit):
        fetch_prisma.ensure_prisma_ddl()


def test_fetch_concatenates_in_chronological_order(
    prisma_paths: dict[str, Path], monkeypatch: pytest.MonkeyPatch
) -> None:
    """Migrations are listed via API, fetched, and concatenated oldest-first."""
    # Out-of-order listing to verify sorting.
    dirs = [
        "20260520180111_state_updates_and_fixes",
        "20260312131729_prisma_init_baseline",
        "20260520153709_remove_unneeded_permissions",
        "20260312131759_init_baseline",
    ]
    expected_order = sorted(dirs)
    bodies = {d: f"-- body of {d}\nSELECT 1;\n".encode() for d in dirs}

    responses = {
        _api_url(): _listing(
            dirs,
            extra=[
                # migration_lock.toml — a file, must be filtered out.
                {"name": "migration_lock.toml", "type": "file"},
                # A non-Prisma directory — must be filtered out.
                {"name": "scratch", "type": "dir"},
            ],
        )
    }
    for d in dirs:
        responses[_raw_url(d)] = bodies[d]

    _set_env(monkeypatch)
    get, calls = _stub_http(responses)

    # Compute the expected concatenation by composing once and pinning to it.
    env = lib.Env.load()
    composed, dirs_returned = fetch_prisma._compose_ddl(env, get=get)
    assert dirs_returned == expected_order
    sha = hashlib.sha256(composed).hexdigest()
    prisma_paths["pin"].write_text(sha, encoding="utf-8")

    # Reset and run via the public entry point.
    calls.clear()
    lib.reset_env_cache()
    path = fetch_prisma.ensure_prisma_ddl(get=get)

    assert path == prisma_paths["cache"] / f"{sha}.sql"
    assert path.read_bytes() == composed
    # API listing first, then each migration.sql in chronological order.
    assert calls[0] == _api_url()
    assert calls[1:] == [_raw_url(d) for d in expected_order]
    # Source-log records the ordered migration list.
    src = prisma_paths["src"].read_text(encoding="utf-8")
    for d in expected_order:
        assert f"  - {d}" in src
    assert f"sha256: {sha}" in src
    assert "repo: Enterprise-CMCS/demos" in src


def test_fetch_writes_per_migration_manifest(
    prisma_paths: dict[str, Path], monkeypatch: pytest.MonkeyPatch
) -> None:
    """ensure_prisma_ddl writes [{name, sha256}] of each raw migration body."""
    dirs = ["20260101000000_init", "20260202000000_next"]
    bodies = {d: f"-- {d}\nSELECT 1;\n".encode() for d in dirs}
    responses = {_api_url(): _listing(dirs)}
    for d in dirs:
        responses[_raw_url(d)] = bodies[d]
    _set_env(monkeypatch)
    get, _ = _stub_http(responses)

    env = lib.Env.load()
    composed, _ = fetch_prisma._compose_ddl(env, get=get)
    prisma_paths["pin"].write_text(hashlib.sha256(composed).hexdigest(), encoding="utf-8")
    lib.reset_env_cache()

    fetch_prisma.ensure_prisma_ddl(get=get)

    manifest = json.loads(prisma_paths["manifest"].read_text(encoding="utf-8"))
    assert manifest == [
        {"name": d, "sha256": hashlib.sha256(bodies[d]).hexdigest()} for d in dirs
    ]


def test_fetch_drift_dies(
    prisma_paths: dict[str, Path], monkeypatch: pytest.MonkeyPatch
) -> None:
    """If composed sha != pin, fail loudly and don't cache."""
    dirs = ["20260101000000_init"]
    responses = {
        _api_url(): _listing(dirs),
        _raw_url(dirs[0]): b"-- changed upstream\n",
    }
    _set_env(monkeypatch)
    get, _ = _stub_http(responses)
    pin = "a" * 64
    prisma_paths["pin"].write_text(pin, encoding="utf-8")

    with pytest.raises(SystemExit):
        fetch_prisma.ensure_prisma_ddl(get=get)
    assert not (prisma_paths["cache"] / f"{pin}.sql").exists()


def test_cache_hit_skips_network(
    prisma_paths: dict[str, Path], monkeypatch: pytest.MonkeyPatch
) -> None:
    """A pre-existing cache file with matching sha must skip every HTTP call."""
    body = b"cached body\n"
    sha = hashlib.sha256(body).hexdigest()
    prisma_paths["pin"].write_text(sha, encoding="utf-8")
    prisma_paths["cache"].mkdir(parents=True, exist_ok=True)
    (prisma_paths["cache"] / f"{sha}.sql").write_bytes(body)
    _set_env(monkeypatch)

    path = fetch_prisma.ensure_prisma_ddl(get=_never_get)
    assert path == prisma_paths["cache"] / f"{sha}.sql"


def test_cache_corruption_detected(
    prisma_paths: dict[str, Path], monkeypatch: pytest.MonkeyPatch
) -> None:
    """A cached file whose sha no longer matches the pin must hard-fail."""
    body = b"good content\n"
    sha = hashlib.sha256(body).hexdigest()
    prisma_paths["pin"].write_text(sha, encoding="utf-8")
    prisma_paths["cache"].mkdir(parents=True, exist_ok=True)
    (prisma_paths["cache"] / f"{sha}.sql").write_bytes(b"corrupted bytes")
    _set_env(monkeypatch)

    with pytest.raises(SystemExit):
        fetch_prisma.ensure_prisma_ddl()


def test_empty_migrations_list_dies(
    prisma_paths: dict[str, Path], monkeypatch: pytest.MonkeyPatch
) -> None:
    """An empty (or filter-empty) migrations directory is a hard fail."""
    sha = "b" * 64
    prisma_paths["pin"].write_text(sha, encoding="utf-8")
    _set_env(monkeypatch)
    get, _ = _stub_http(
        {_api_url(): _listing([], extra=[{"name": "migration_lock.toml", "type": "file"}])},
    )
    with pytest.raises(SystemExit):
        fetch_prisma.ensure_prisma_ddl(get=get)


def test_filters_non_prisma_directories(
    prisma_paths: dict[str, Path], monkeypatch: pytest.MonkeyPatch
) -> None:
    """Directory names that don't match the Prisma timestamp prefix are skipped."""
    dirs_in_api = [
        "scratch",
        "notes",
        "20260101000000_real_migration",
    ]
    responses = {
        _api_url(): _listing(dirs_in_api),
        _raw_url("20260101000000_real_migration"): b"SELECT 1;\n",
    }
    _set_env(monkeypatch)
    get, _ = _stub_http(responses)
    env = lib.Env.load()
    _, dirs = fetch_prisma._compose_ddl(env, get=get)
    assert dirs == ["20260101000000_real_migration"]


def test_run_fetch_prisma_verify_only(
    prisma_paths: dict[str, Path], monkeypatch: pytest.MonkeyPatch
) -> None:
    """``--verify-only`` still composes + verifies on a cache miss."""
    dirs = ["20260101000000_init"]
    body = b"-- init\nCREATE TABLE app.x ();\n"
    responses = {_api_url(): _listing(dirs), _raw_url(dirs[0]): body}
    _set_env(monkeypatch)
    get, _ = _stub_http(responses)

    env = lib.Env.load()
    composed, _ = fetch_prisma._compose_ddl(env, get=get)
    sha = hashlib.sha256(composed).hexdigest()
    prisma_paths["pin"].write_text(sha, encoding="utf-8")
    lib.reset_env_cache()

    path = fetch_prisma.run_fetch_prisma(verify_only=True, get=get)
    assert path.exists()
    assert path.read_bytes() == composed


def test_refresh_bypasses_cache_hit(
    prisma_paths: dict[str, Path], monkeypatch: pytest.MonkeyPatch
) -> None:
    """``refresh=True`` re-fetches from upstream even when the cache is valid."""
    dirs = ["20260101000000_init"]
    body = b"-- init\nSELECT 1;\n"
    responses = {_api_url(): _listing(dirs), _raw_url(dirs[0]): body}
    _set_env(monkeypatch)

    # Compose once (with stubbed HTTP) to learn the pinned sha + bytes.
    get, calls = _stub_http(responses)
    env = lib.Env.load()
    composed, _ = fetch_prisma._compose_ddl(env, get=get)
    sha = hashlib.sha256(composed).hexdigest()
    prisma_paths["pin"].write_text(sha, encoding="utf-8")

    # Seed a valid cache so the default path would be a no-network hit.
    prisma_paths["cache"].mkdir(parents=True, exist_ok=True)
    (prisma_paths["cache"] / f"{sha}.sql").write_bytes(composed)
    lib.reset_env_cache()

    # refresh=True must hit the network and rebuild from upstream.
    calls.clear()
    path = fetch_prisma.ensure_prisma_ddl(refresh=True, get=get)
    assert path == prisma_paths["cache"] / f"{sha}.sql"
    assert path.read_bytes() == composed
    assert calls[0] == _api_url()
    assert _raw_url(dirs[0]) in calls


def test_refresh_still_detects_drift(
    prisma_paths: dict[str, Path], monkeypatch: pytest.MonkeyPatch
) -> None:
    """``refresh=True`` re-verifies against the pin and dies on drift."""
    dirs = ["20260101000000_init"]
    responses = {
        _api_url(): _listing(dirs),
        _raw_url(dirs[0]): b"-- changed upstream\n",
    }
    _set_env(monkeypatch)
    get, _ = _stub_http(responses)

    pin = "a" * 64
    prisma_paths["pin"].write_text(pin, encoding="utf-8")
    # A stale cache under the pin name exists, but refresh must ignore it
    # and fail loudly because upstream no longer matches the pin.
    prisma_paths["cache"].mkdir(parents=True, exist_ok=True)
    (prisma_paths["cache"] / f"{pin}.sql").write_bytes(b"stale-but-named-right")

    with pytest.raises(SystemExit):
        fetch_prisma.ensure_prisma_ddl(refresh=True, get=get)
