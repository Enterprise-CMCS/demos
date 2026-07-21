"""Tests for migration.phases.fetch_prisma_schema."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path

import pytest

from migration import lib
from migration.phases import fetch_prisma_schema
from migration.phases.fetch_prisma import HttpGet


@pytest.fixture
def schema_paths(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> dict[str, Path]:
    """Redirect every prisma-schema path constant to tmp dirs."""
    cache = tmp_path / "state" / "prisma_schema"
    pin = tmp_path / "reports" / "prisma_schema.sha256"
    src = tmp_path / "reports" / "prisma_schema_source.txt"
    pin.parent.mkdir(parents=True, exist_ok=True)
    monkeypatch.setattr(lib, "PRISMA_SCHEMA_CACHE_DIR", cache)
    monkeypatch.setattr(lib, "PRISMA_SCHEMA_PIN_FILE", pin)
    monkeypatch.setattr(lib, "PRISMA_SCHEMA_SOURCE_FILE", src)
    monkeypatch.setattr(fetch_prisma_schema, "PRISMA_SCHEMA_CACHE_DIR", cache)
    monkeypatch.setattr(fetch_prisma_schema, "PRISMA_SCHEMA_PIN_FILE", pin)
    monkeypatch.setattr(fetch_prisma_schema, "PRISMA_SCHEMA_SOURCE_FILE", src)
    return {"cache": cache, "pin": pin, "src": src}


def _set_env(
    monkeypatch: pytest.MonkeyPatch,
    *,
    repo: str = "Enterprise-CMCS/demos",
    ref: str = "main",
    path: str = "server/src/model",
    token: str = "",
) -> None:
    monkeypatch.setenv("PG_URL", "postgresql://u:p@h/d")
    monkeypatch.setenv("MYSQL_URL", "mysql://u:p@h/m")
    monkeypatch.setenv("PRISMA_REPO", repo)
    monkeypatch.setenv("PRISMA_REPO_REF", ref)
    monkeypatch.setenv("PRISMA_SCHEMA_PATH", path)
    monkeypatch.setenv("GITHUB_TOKEN", token)
    lib.reset_env_cache()


def _stub_http(responses: dict[str, bytes]) -> tuple[HttpGet, list[str]]:
    """Build an injectable ``get`` from a URL -> bytes table + a call log."""
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


def _tree_url(repo: str = "Enterprise-CMCS/demos", ref: str = "main") -> str:
    return f"https://api.github.com/repos/{repo}/git/trees/{ref}?recursive=1"


def _raw_url(path: str, repo: str = "Enterprise-CMCS/demos", ref: str = "main") -> str:
    return f"https://raw.githubusercontent.com/{repo}/{ref}/{path}"


def _tree(paths: list[str], *, truncated: bool = False, extra: list[dict] | None = None) -> bytes:
    tree = [{"path": p, "type": "blob"} for p in paths]
    tree.extend(extra or [])
    return json.dumps({"tree": tree, "truncated": truncated}).encode("utf-8")


def test_pin_missing_dies(schema_paths: dict[str, Path], monkeypatch: pytest.MonkeyPatch) -> None:
    _set_env(monkeypatch)
    with pytest.raises(SystemExit):
        fetch_prisma_schema.ensure_prisma_schema()


@pytest.mark.parametrize("bad_pin", ["", "not-a-hash", "abc", "z" * 64])
def test_pin_invalid_dies(
    bad_pin: str, schema_paths: dict[str, Path], monkeypatch: pytest.MonkeyPatch
) -> None:
    _set_env(monkeypatch)
    schema_paths["pin"].write_text(bad_pin, encoding="utf-8")
    with pytest.raises(SystemExit):
        fetch_prisma_schema.ensure_prisma_schema()


def test_fetch_filters_and_sorts(
    schema_paths: dict[str, Path], monkeypatch: pytest.MonkeyPatch
) -> None:
    """Only blobs under the root that end .prisma are fetched, path-sorted."""
    files = [
        "server/src/model/state/state.prisma",
        "server/src/model/demonstration/demonstration.prisma",
    ]
    extra = [
        {"path": "server/src/model/migrations/x/migration.sql", "type": "blob"},
        {"path": "server/src/model/demonstration", "type": "tree"},
        {"path": "server/src/other/thing.prisma", "type": "blob"},
        {"path": "server/src/model/notes.md", "type": "blob"},
    ]
    responses = {_tree_url(): _tree(files, extra=extra)}
    for p in files:
        responses[_raw_url(p)] = f"// {p}\nmodel X {{}}\n".encode()

    _set_env(monkeypatch)
    get, calls = _stub_http(responses)

    env = lib.Env.load()
    composed, paths = fetch_prisma_schema._compose_schema(env, get=get)
    assert paths == sorted(files)
    sha = hashlib.sha256(composed).hexdigest()
    schema_paths["pin"].write_text(sha, encoding="utf-8")

    calls.clear()
    lib.reset_env_cache()
    out = fetch_prisma_schema.ensure_prisma_schema(get=get)
    assert out == schema_paths["cache"] / f"{sha}.sql"
    assert out.read_bytes() == composed
    assert calls[0] == _tree_url()
    assert calls[1:] == [_raw_url(p) for p in sorted(files)]
    src = schema_paths["src"].read_text(encoding="utf-8")
    assert "repo: Enterprise-CMCS/demos" in src
    for p in files:
        assert f"  - {p}" in src


def test_truncated_tree_dies(
    schema_paths: dict[str, Path], monkeypatch: pytest.MonkeyPatch
) -> None:
    schema_paths["pin"].write_text("a" * 64, encoding="utf-8")
    _set_env(monkeypatch)
    get, _ = _stub_http(
        {_tree_url(): _tree(["server/src/model/x/x.prisma"], truncated=True)},
    )
    with pytest.raises(SystemExit):
        fetch_prisma_schema.ensure_prisma_schema(get=get)


def test_empty_listing_dies(
    schema_paths: dict[str, Path], monkeypatch: pytest.MonkeyPatch
) -> None:
    schema_paths["pin"].write_text("b" * 64, encoding="utf-8")
    _set_env(monkeypatch)
    get, _ = _stub_http(
        {_tree_url(): _tree([], extra=[{"path": "server/src/model/x", "type": "tree"}])},
    )
    with pytest.raises(SystemExit):
        fetch_prisma_schema.ensure_prisma_schema(get=get)


def test_drift_dies_and_does_not_cache(
    schema_paths: dict[str, Path], monkeypatch: pytest.MonkeyPatch
) -> None:
    files = ["server/src/model/x/x.prisma"]
    responses = {_tree_url(): _tree(files), _raw_url(files[0]): b"model X {}\n"}
    _set_env(monkeypatch)
    get, _ = _stub_http(responses)
    pin = "a" * 64
    schema_paths["pin"].write_text(pin, encoding="utf-8")
    with pytest.raises(SystemExit):
        fetch_prisma_schema.ensure_prisma_schema(get=get)
    assert not (schema_paths["cache"] / f"{pin}.sql").exists()


def test_cache_hit_skips_network(
    schema_paths: dict[str, Path], monkeypatch: pytest.MonkeyPatch
) -> None:
    body = b"model X {}\n"
    sha = hashlib.sha256(body).hexdigest()
    schema_paths["pin"].write_text(sha, encoding="utf-8")
    schema_paths["cache"].mkdir(parents=True, exist_ok=True)
    (schema_paths["cache"] / f"{sha}.sql").write_bytes(body)
    _set_env(monkeypatch)

    out = fetch_prisma_schema.ensure_prisma_schema(get=_never_get)
    assert out == schema_paths["cache"] / f"{sha}.sql"


def test_cache_corruption_detected(
    schema_paths: dict[str, Path], monkeypatch: pytest.MonkeyPatch
) -> None:
    body = b"good\n"
    sha = hashlib.sha256(body).hexdigest()
    schema_paths["pin"].write_text(sha, encoding="utf-8")
    schema_paths["cache"].mkdir(parents=True, exist_ok=True)
    (schema_paths["cache"] / f"{sha}.sql").write_bytes(b"tampered")
    _set_env(monkeypatch)
    with pytest.raises(SystemExit):
        fetch_prisma_schema.ensure_prisma_schema()


def test_refresh_bypasses_cache_hit(
    schema_paths: dict[str, Path], monkeypatch: pytest.MonkeyPatch
) -> None:
    files = ["server/src/model/x/x.prisma"]
    responses = {_tree_url(): _tree(files), _raw_url(files[0]): b"model X {}\n"}
    _set_env(monkeypatch)
    get, calls = _stub_http(responses)
    env = lib.Env.load()
    composed, _ = fetch_prisma_schema._compose_schema(env, get=get)
    sha = hashlib.sha256(composed).hexdigest()
    schema_paths["pin"].write_text(sha, encoding="utf-8")
    schema_paths["cache"].mkdir(parents=True, exist_ok=True)
    (schema_paths["cache"] / f"{sha}.sql").write_bytes(composed)
    lib.reset_env_cache()

    calls.clear()
    out = fetch_prisma_schema.ensure_prisma_schema(refresh=True, get=get)
    assert out.read_bytes() == composed
    assert calls[0] == _tree_url()


def test_load_prisma_schema_text(
    schema_paths: dict[str, Path], monkeypatch: pytest.MonkeyPatch
) -> None:
    # No pin -> None.
    assert fetch_prisma_schema.load_prisma_schema_text() is None
    body = "model X {}\n"
    sha = hashlib.sha256(body.encode()).hexdigest()
    schema_paths["pin"].write_text(sha, encoding="utf-8")
    # Pin present but no cache -> None.
    assert fetch_prisma_schema.load_prisma_schema_text() is None
    schema_paths["cache"].mkdir(parents=True, exist_ok=True)
    (schema_paths["cache"] / f"{sha}.sql").write_text(body, encoding="utf-8")
    assert fetch_prisma_schema.load_prisma_schema_text() == body
