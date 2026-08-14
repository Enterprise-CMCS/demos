"""Unit coverage for the flip-phase healthz check."""

from __future__ import annotations

from pathlib import Path
from typing import Any

import pytest

from migration import lib
from migration.phases import flip


class _FakeResp:
    """Stand-in for the context-managed response from ``urllib.request.urlopen``."""

    def __init__(self, status: int) -> None:
        """Record the HTTP status the fake response should report."""
        self.status = status

    def __enter__(self) -> _FakeResp:
        """Return self so callers can use ``with urlopen(...) as resp``."""
        return self

    def __exit__(self, *_: Any) -> None:
        """No-op context exit."""
        return None


def test_check_healthz_rejects_non_http_scheme() -> None:
    """``file://`` URLs must be refused so the probe cannot become a file read."""
    with pytest.raises(SystemExit):
        flip._check_healthz("file:///etc/passwd")


def test_check_healthz_rejects_unknown_scheme() -> None:
    """Any scheme outside ``{http, https}`` must be refused."""
    with pytest.raises(SystemExit):
        flip._check_healthz("ssh://host/path")


def test_check_healthz_succeeds_on_first_attempt(monkeypatch: pytest.MonkeyPatch) -> None:
    """A 200 response on the first try should consume exactly one attempt."""
    calls = 0

    def fake_open(url: str, timeout: int) -> _FakeResp:
        nonlocal calls
        calls += 1
        return _FakeResp(200)

    monkeypatch.setattr(flip.urllib.request, "urlopen", fake_open)
    flip._check_healthz("https://example/healthz", sleep=lambda _: None)
    assert calls == 1


def test_check_healthz_retries_on_non_200(monkeypatch: pytest.MonkeyPatch) -> None:
    """Non-200 statuses must trigger a retry until success or attempt limit."""
    calls = 0
    statuses = iter([502, 503, 200])

    def fake_open(url: str, timeout: int) -> _FakeResp:
        nonlocal calls
        calls += 1
        return _FakeResp(next(statuses))

    monkeypatch.setattr(flip.urllib.request, "urlopen", fake_open)
    flip._check_healthz("https://example/healthz", sleep=lambda _: None)
    assert calls == 3


def test_check_healthz_retries_on_network_error(monkeypatch: pytest.MonkeyPatch) -> None:
    """Raised exceptions from ``urlopen`` must also be retried."""
    calls = 0
    attempts = iter([RuntimeError("conn refused"), RuntimeError("timeout"), _FakeResp(200)])

    def fake_open(url: str, timeout: int):  # type: ignore[no-untyped-def]
        nonlocal calls
        calls += 1
        item = next(attempts)
        if isinstance(item, Exception):
            raise item
        return item

    monkeypatch.setattr(flip.urllib.request, "urlopen", fake_open)
    flip._check_healthz("https://example/healthz", sleep=lambda _: None)
    assert calls == 3


def test_check_healthz_dies_after_max_retries(monkeypatch: pytest.MonkeyPatch) -> None:
    """After ``HEALTHZ_RETRIES`` consecutive failures the probe must :func:`die`."""
    calls = 0

    def fake_open(url: str, timeout: int) -> _FakeResp:
        nonlocal calls
        calls += 1
        return _FakeResp(503)

    monkeypatch.setattr(flip.urllib.request, "urlopen", fake_open)
    with pytest.raises(SystemExit):
        flip._check_healthz("https://example/healthz", sleep=lambda _: None)
    assert calls == flip.HEALTHZ_RETRIES


def _arm_flip(monkeypatch: pytest.MonkeyPatch, state_dir: Path) -> None:
    """Satisfy the parity gate and auto-confirm the read-only prompt."""
    monkeypatch.setattr(lib, "STATE_DIR", state_dir)
    monkeypatch.setattr(lib, "REPORTS_DIR", state_dir)
    (state_dir / "parity.ok").write_text("ok\n", encoding="utf-8")
    monkeypatch.setattr(flip, "confirm", lambda *_a, **_k: True)
    monkeypatch.setenv("MYSQL_URL", "mysql://u:p@h/d")
    monkeypatch.delenv("NEW_APP_HEALTHZ_URL", raising=False)


def test_run_flip_dies_when_healthz_unset(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    """An unset NEW_APP_HEALTHZ_URL must die, not probe a placeholder."""
    _arm_flip(monkeypatch, tmp_path)
    lib.reset_env_cache()
    with pytest.raises(SystemExit):
        flip.run_flip()


def test_run_flip_uses_env_url(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    """When set, the env healthz URL is the one probed and the gate is marked."""
    _arm_flip(monkeypatch, tmp_path)
    monkeypatch.setenv("NEW_APP_HEALTHZ_URL", "https://demos.test/healthz")
    lib.reset_env_cache()

    probed: list[str] = []
    monkeypatch.setattr(flip, "_check_healthz", lambda url: probed.append(url))

    flip.run_flip()
    assert probed == ["https://demos.test/healthz"]
    assert (tmp_path / "flip.ok").exists()
