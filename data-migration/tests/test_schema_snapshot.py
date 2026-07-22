"""Unit tests for the pure helpers in migration.phases.schema_snapshot.

The DuckDB <-> MySQL passthrough needs a live source and is exercised in
integration, mirroring how preflight/load_full DB paths are handled. These
tests cover the connection-string parsing and enum-domain parsing that drive
the artifacts.
"""

from __future__ import annotations

import pytest

from migration.phases import schema_snapshot as ss


def _dsn_dict(dsn: str) -> dict[str, str]:
    return dict(part.split("=", 1) for part in dsn.split(" "))


def test_attach_dsn_full_url() -> None:
    dsn = _dsn_dict(ss._mysql_attach_dsn("mysql://u:p@db.host:3307/legacy", ""))
    assert dsn == {
        "host": "db.host",
        "port": "3307",
        "user": "u",
        "password": "p",
        "database": "legacy",
    }


def test_attach_dsn_env_db_takes_precedence_over_url_path() -> None:
    dsn = _dsn_dict(ss._mysql_attach_dsn("mysql://u:p@h/url_db", "env_db"))
    assert dsn["database"] == "env_db"


def test_attach_dsn_defaults_host_and_port() -> None:
    dsn = _dsn_dict(ss._mysql_attach_dsn("mysql://u:p@/d", ""))
    assert dsn["host"] == "localhost"
    assert dsn["port"] == "3306"


def test_attach_dsn_decodes_percent_encoded_credentials() -> None:
    # password 'p@ss:w/d' percent-encoded in the URL must round-trip decoded.
    enc_pw = "p%40ss%3Aw%2Fd"  # decodes to p@ss:w/d
    url = "mysql://" + "user:" + enc_pw + "@host/d"
    dsn = _dsn_dict(ss._mysql_attach_dsn(url, ""))
    assert dsn["password"] == "p@ss:w/d" # pragma: allowlist secret


def test_attach_dsn_omits_empty_credentials() -> None:
    dsn = ss._mysql_attach_dsn("mysql://h:3306/d", "")
    assert "user=" not in dsn
    assert "password=" not in dsn


@pytest.mark.parametrize(
    ("column_type", "expected"),
    [
        ("enum('Active','Inactive')", ["Active", "Inactive"]),
        ("ENUM('A')", ["A"]),
        ("set('read','write','admin')", ["read", "write", "admin"]),
        ("enum('o''brien','smith')", ["o'brien", "smith"]),  # doubled-quote escape
        ("enum('a,b','c')", ["a,b", "c"]),  # comma inside a value
        ("enum()", []),
        ("varchar(255)", []),
        ("int", []),
        ("", []),
    ],
)
def test_parse_enum_values(column_type: str, expected: list[str]) -> None:
    assert ss._parse_enum_values(column_type) == expected


def test_write_csv_roundtrip(tmp_path) -> None:
    out = tmp_path / "x.csv"
    n = ss._write_csv(out, ["a", "b"], [(1, None), ("y", "z")])
    assert n == 2
    # None is written as an empty field, not the string "None".
    assert out.read_text(encoding="utf-8").splitlines() == ["a,b", "1,", "y,z"]
