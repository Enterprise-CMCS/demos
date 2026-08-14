from __future__ import annotations

import hashlib
import json
from pathlib import Path

import pytest

from migration import lib
from migration.phases import verify_prisma_local as vpl


def _write_migration(root: Path, name: str, body: bytes) -> None:
    d = root / name
    d.mkdir(parents=True, exist_ok=True)
    (d / "migration.sql").write_bytes(body)


@pytest.fixture
def local_repo(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> dict[str, Path]:
    """A fake ../demos checkout + a redirected pinned manifest path."""
    demos = tmp_path / "demos"
    migrations = demos / "server" / "src" / "model" / "migrations"
    migrations.mkdir(parents=True, exist_ok=True)
    manifest = tmp_path / "reports" / "prisma_ddl.manifest.json"
    manifest.parent.mkdir(parents=True, exist_ok=True)
    monkeypatch.setattr(lib, "PRISMA_DDL_MANIFEST_FILE", manifest)
    monkeypatch.setattr(vpl, "PRISMA_DDL_MANIFEST_FILE", manifest)
    monkeypatch.setenv("MYSQL_URL", "mysql://u:p@h/m")
    monkeypatch.setenv("PG_URL", "postgresql://u:p@h/d")
    monkeypatch.setenv("DEMOS_LOCAL", str(demos))
    return {"demos": demos, "migrations": migrations, "manifest": manifest}


def _pin(manifest: Path, entries: list[tuple[str, bytes]]) -> None:
    manifest.write_text(
        json.dumps(
            [{"name": n, "sha256": hashlib.sha256(b).hexdigest()} for n, b in entries]
        ),
        encoding="utf-8",
    )


def test_local_manifest_hashes_raw_bytes(local_repo: dict[str, Path]) -> None:
    _write_migration(local_repo["migrations"], "20260101000000_a", b"SELECT 1;\n")
    got = vpl._local_manifest(local_repo["migrations"])
    assert got == [
        {"name": "20260101000000_a", "sha256": hashlib.sha256(b"SELECT 1;\n").hexdigest()}
    ]


def test_verify_ok_when_match(local_repo: dict[str, Path]) -> None:
    body = b"SELECT 1;\n"
    _write_migration(local_repo["migrations"], "20260101000000_a", body)
    _pin(local_repo["manifest"], [("20260101000000_a", body)])
    vpl.run_verify_prisma_local()  # must not raise


def test_verify_dies_on_changed_content(local_repo: dict[str, Path]) -> None:
    _write_migration(local_repo["migrations"], "20260101000000_a", b"SELECT 2;\n")
    _pin(local_repo["manifest"], [("20260101000000_a", b"SELECT 1;\n")])
    with pytest.raises(SystemExit):
        vpl.run_verify_prisma_local()


def test_verify_dies_on_extra_local_migration(local_repo: dict[str, Path]) -> None:
    body = b"SELECT 1;\n"
    _write_migration(local_repo["migrations"], "20260101000000_a", body)
    _write_migration(local_repo["migrations"], "20260202000000_b", b"SELECT 3;\n")
    _pin(local_repo["manifest"], [("20260101000000_a", body)])
    with pytest.raises(SystemExit):
        vpl.run_verify_prisma_local()


def test_verify_dies_on_missing_local_migration(local_repo: dict[str, Path]) -> None:
    body = b"SELECT 1;\n"
    _write_migration(local_repo["migrations"], "20260101000000_a", body)
    _pin(
        local_repo["manifest"],
        [("20260101000000_a", body), ("20260202000000_b", b"SELECT 3;\n")],
    )
    with pytest.raises(SystemExit):
        vpl.run_verify_prisma_local()


def test_verify_dies_when_manifest_missing(local_repo: dict[str, Path]) -> None:
    _write_migration(local_repo["migrations"], "20260101000000_a", b"SELECT 1;\n")
    # No manifest written.
    with pytest.raises(SystemExit):
        vpl.run_verify_prisma_local()


def test_diff_manifests_reports_all_categories() -> None:
    pinned = [{"name": "a", "sha256": "1"}, {"name": "b", "sha256": "2"}]
    local = [{"name": "b", "sha256": "9"}, {"name": "c", "sha256": "3"}]
    added, removed, changed = vpl._diff_manifests(pinned, local)
    assert added == ["c"]
    assert removed == ["a"]
    assert changed == ["b"]
