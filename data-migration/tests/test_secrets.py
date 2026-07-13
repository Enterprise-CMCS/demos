"""Tests for migration.secrets.get_secret_json."""

from __future__ import annotations

import json

import pytest

from migration import secrets


class _FakeClient:
    def __init__(self, payload: dict) -> None:
        self.payload = payload
        self.called_with: str | None = None

    def get_secret_value(self, SecretId: str) -> dict:  # noqa: N803 (boto3 kwarg)
        self.called_with = SecretId
        return self.payload


def test_parses_json_object(monkeypatch: pytest.MonkeyPatch) -> None:
    fake = _FakeClient({"SecretString": json.dumps({"username": "u", "password": "p"})})
    monkeypatch.setattr(secrets, "_client", lambda region=None: fake)
    data = secrets.get_secret_json("demos-prod-rds-admin", "us-east-1")
    assert data == {"username": "u", "password": "p"}
    assert fake.called_with == "demos-prod-rds-admin"


def test_missing_payload_dies(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(secrets, "_client", lambda region=None: _FakeClient({}))
    with pytest.raises(SystemExit):
        secrets.get_secret_json("x")


def test_invalid_json_dies(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(secrets, "_client", lambda region=None: _FakeClient({"SecretString": "{nope"}))
    with pytest.raises(SystemExit):
        secrets.get_secret_json("x")


def test_non_object_dies(monkeypatch: pytest.MonkeyPatch) -> None:
    fake = _FakeClient({"SecretString": json.dumps([1, 2, 3])})
    monkeypatch.setattr(secrets, "_client", lambda region=None: fake)
    with pytest.raises(SystemExit):
        secrets.get_secret_json("x")
