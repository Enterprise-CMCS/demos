"""Smoke tests for migration.lib gate plumbing and template rendering."""

from __future__ import annotations

import stat
import urllib.parse
from pathlib import Path

import pytest

from migration import lib


def test_mark_and_require_gate(tmp_state_dir: Path) -> None:
    """Marking a gate writes its file; require_gate then passes silently."""
    lib.mark_gate("phase_a")
    assert lib.gate_path("phase_a").exists()
    lib.require_gate("phase_a")  # should not raise


def test_require_gate_raises_when_missing(
    tmp_state_dir: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    """require_gate on an un-marked gate must exit the process."""
    with pytest.raises(SystemExit):
        lib.require_gate("never_run")
    assert "not satisfied" in " ".join(capsys.readouterr().err.split())


def test_clear_gate(tmp_state_dir: Path) -> None:
    """clear_gate removes a previously marked gate file."""
    lib.mark_gate("phase_b")
    assert lib.gate_path("phase_b").exists()
    lib.clear_gate("phase_b")
    assert not lib.gate_path("phase_b").exists()


def test_list_gates_returns_known_phases(tmp_state_dir: Path) -> None:
    """list_gates reports every phase with its current done/undone state."""
    lib.mark_gate("freeze")
    gates = dict(lib.list_gates())
    assert gates["freeze"] is True
    assert gates["preflight"] is False


def test_render_template(tmp_path: Path) -> None:
    """Basic Jinja2 ``{{KEY}}`` substitution round-trips a rendered template."""
    template = tmp_path / "in.tmpl"
    template.write_text("hello {{NAME}}, your db is {{DB}}\n", encoding="utf-8")
    out = tmp_path / "out.txt"
    lib.render_template(template, out, {"NAME": "world", "DB": "demos"})
    assert out.read_text(encoding="utf-8") == "hello world, your db is demos\n"


def test_render_template_handles_special_chars(tmp_path: Path) -> None:
    """sed in bash chokes on URLs with '|' or '&'; the Python renderer should not."""
    template = tmp_path / "in.tmpl"
    template.write_text("url={{URL}}\n", encoding="utf-8")
    out = tmp_path / "out.txt"
    weird_url = "postgresql://user:p@ss&w|rd@h/db?sslmode=require"
    lib.render_template(template, out, {"URL": weird_url})
    assert out.read_text(encoding="utf-8") == f"url={weird_url}\n"


def test_render_template_chmods_0600(tmp_path: Path) -> None:
    """Rendered files must be chmod 0600 because they may contain credentials."""
    template = tmp_path / "in.tmpl"
    template.write_text("secret={{S}}\n", encoding="utf-8")
    out = tmp_path / "out.txt"
    lib.render_template(template, out, {"S": "hunter2"})
    mode = stat.S_IMODE(out.stat().st_mode)
    assert mode == 0o600, f"expected 0o600, got {oct(mode)}"


@pytest.mark.parametrize(
    ("raw", "expected"),
    [
        (
            "postgresql://demos:hunter2@db.example.com:5432/demos", # pragma: allowlist secret
            "postgresql://demos:****@db.example.com:5432/demos", # pragma: allowlist secret
        ),
        (
            "mysql://root:p@ss-w0rd@mysql.host/cms", # pragma: allowlist secret
            "mysql://root:****@mysql.host/cms", # pragma: allowlist secret
        ),
        (
            "$ psql postgresql://u:secret@h/d -c 'select 1'", # pragma: allowlist secret
            "$ psql postgresql://u:****@h/d -c 'select 1'", # pragma: allowlist secret
        ),
        ("no credentials here", "no credentials here"),
        ("postgresql://user@host/db", "postgresql://user@host/db"), # pragma: allowlist secret
    ],
)
def test_redact(raw: str, expected: str) -> None:
    """redact() must mask every password but leave non-credential text alone."""
    assert lib.redact(raw) == expected


class _FakeConn:
    """Minimal stand-in for psycopg.Connection."""

    def __init__(self, captured_dsn: list[str], captured_sql: list[str]) -> None:
        """Record that a new connection was opened and share the SQL capture list."""
        self._captured_sql = captured_sql
        captured_dsn.append("called")
        self.transaction_entered = False
        self.in_txn = False

    def __enter__(self) -> _FakeConn:
        """Return self for ``with connect(...) as conn`` usage."""
        return self

    def __exit__(self, *_: object) -> None:
        """No-op context exit."""
        return None

    def transaction(self) -> _FakeConn:
        """Pretend to open a transaction context; record that it happened."""
        self.in_txn = True
        return self

    def execute(self, sql, *_a, **_kw):  # type: ignore[no-untyped-def]
        """Capture the SQL string for assertion in tests."""
        self._captured_sql.append(str(sql))


def test_psql_files_uses_one_transaction(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    """psql_files opens exactly one connection and runs pre_sql + every file in it."""
    captured_dsn: list[str] = []
    captured_sql: list[str] = []

    def fake_connect(_dsn, **_kw):  # type: ignore[no-untyped-def]
        return _FakeConn(captured_dsn, captured_sql)

    monkeypatch.setattr(lib.psycopg, "connect", fake_connect)
    env = lib.Env(
        pg_url="postgresql://u:p@h/d",
        mysql_url="mysql://x:y@h/m",
        mysql_db="m",
        pg_db="d",
    )
    a = tmp_path / "a.sql"
    a.write_text("select 1;\n", encoding="utf-8")
    b = tmp_path / "b.sql"
    b.write_text("select 2;\n", encoding="utf-8")

    lib.psql_files(env, [a, b], pre_sql="SET CONSTRAINTS ALL DEFERRED")

    assert len(captured_dsn) == 1, "exactly one connection used for the whole batch"
    assert captured_sql == [
        "SET CONSTRAINTS ALL DEFERRED",
        "select 1;\n",
        "select 2;\n",
    ]


def test_psql_files_no_files_short_circuits(monkeypatch: pytest.MonkeyPatch) -> None:
    """psql_files with an empty file list must not open any connection."""
    called = False

    def fake_connect(*_a, **_k):  # type: ignore[no-untyped-def]
        nonlocal called
        called = True

    monkeypatch.setattr(lib.psycopg, "connect", fake_connect)
    env = lib.Env(pg_url="x", mysql_url="y", mysql_db="m", pg_db="d")
    lib.psql_files(env, [])
    assert called is False


def test_devcontainer_pg_dsn_builds_from_parts() -> None:
    """With no override, the DSN is assembled from the devcontainer_pg_* parts."""
    env = lib.Env(mysql_url="y")
    parts = urllib.parse.urlsplit(env.devcontainer_pg_dsn())
    assert parts.scheme == "postgresql"
    assert parts.username == "postgres"
    assert parts.password == "postgres" # pragma: allowlist secret
    assert parts.hostname == "localhost"
    assert parts.port == 5432
    assert parts.path == "/demos"


def test_devcontainer_pg_dsn_url_encodes_credentials() -> None:
    """Special characters in the credentials are URL-encoded, not left raw."""
    env = lib.Env(
        mysql_url="y",
        devcontainer_pg_user="a@b",
        devcontainer_pg_password="p@ss/word", # pragma: allowlist secret
    )
    parts = urllib.parse.urlsplit(env.devcontainer_pg_dsn())
    # urlsplit does not percent-decode; the encoded forms prove encoding ran.
    assert parts.username == "a%40b"
    assert parts.password == "p%40ss%2Fword" # pragma: allowlist secret
    # And the decoded round-trip recovers the originals.
    assert urllib.parse.unquote(parts.username or "") == "a@b"
    assert urllib.parse.unquote(parts.password or "") == "p@ss/word"


def test_devcontainer_pg_dsn_prefers_explicit_url() -> None:
    """An explicit devcontainer_pg_url overrides the assembled parts."""
    env = lib.Env(mysql_url="y", devcontainer_pg_url="postgresql://x/db")
    assert env.devcontainer_pg_dsn() == "postgresql://x/db"


def test_devcontainer_scratch_dsn_builds_from_parts() -> None:
    """The scratch DSN assembles from scratch_pg_* + the devcontainer host/port."""
    env = lib.Env(mysql_url="y")
    parts = urllib.parse.urlsplit(env.devcontainer_scratch_dsn())
    assert parts.scheme == "postgresql"
    assert parts.username == "migration_owner"
    assert parts.password == "postgres"  # pragma: allowlist secret
    assert parts.hostname == "localhost"
    assert parts.port == 5432
    assert parts.path == "/demos_migration"


def test_devcontainer_scratch_dsn_shares_server_with_app_db() -> None:
    """Scratch and app databases live on one server, different database names."""
    env = lib.Env(mysql_url="y")
    scratch = urllib.parse.urlsplit(env.devcontainer_scratch_dsn())
    app = urllib.parse.urlsplit(env.devcontainer_pg_dsn())
    assert (scratch.hostname, scratch.port) == (app.hostname, app.port)
    assert scratch.path != app.path


def test_devcontainer_scratch_dsn_url_encodes_credentials() -> None:
    """Special characters in the scratch credentials are URL-encoded."""
    env = lib.Env(
        mysql_url="y",
        scratch_pg_user="a@b",
        scratch_pg_password="p@ss/word",  # pragma: allowlist secret
    )
    parts = urllib.parse.urlsplit(env.devcontainer_scratch_dsn())
    assert parts.username == "a%40b"
    assert parts.password == "p%40ss%2Fword"  # pragma: allowlist secret
    assert urllib.parse.unquote(parts.username or "") == "a@b"
    assert urllib.parse.unquote(parts.password or "") == "p@ss/word"


def test_env_skip_jsonschema_field_defaults_false() -> None:
    assert lib.Env(mysql_url="y").skip_jsonschema is False
    assert lib.Env(mysql_url="y", skip_jsonschema=True).skip_jsonschema is True


def test_skip_jsonschema_reads_os_environ_first(monkeypatch: pytest.MonkeyPatch) -> None:
    """An injected SKIP_JSONSCHEMA is honored without loading the full Env."""
    monkeypatch.setenv("SKIP_JSONSCHEMA", "1")
    assert lib.skip_jsonschema() is True


def test_skip_jsonschema_falls_back_to_env_field(monkeypatch: pytest.MonkeyPatch) -> None:
    """With no env var, the .env-driven Env field decides."""
    monkeypatch.delenv("SKIP_JSONSCHEMA", raising=False)
    monkeypatch.setattr(
        lib.Env, "load", classmethod(lambda cls: lib.Env(mysql_url="y", skip_jsonschema=True))
    )
    assert lib.skip_jsonschema() is True


def test_skip_jsonschema_false_without_env_or_field(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("SKIP_JSONSCHEMA", raising=False)
    monkeypatch.setattr(lib.Env, "load", classmethod(lambda cls: lib.Env(mysql_url="y")))
    assert lib.skip_jsonschema() is False


@pytest.mark.parametrize(
    "bad_schema",
    ["1bad", "drop table x; --", "stg-schema", "", "stg.app", "stg' --"],
)
def test_truncate_schema_data_rejects_bad_schema(
    bad_schema: str, monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]
) -> None:
    """Non-identifier schema names must be rejected to prevent SQL injection."""
    monkeypatch.setattr(lib, "psql_command", lambda env, sql: None)
    env = lib.Env(pg_url="x", mysql_url="y", mysql_db="m", pg_db="d")
    with pytest.raises(SystemExit):
        lib.truncate_schema_data(env, bad_schema)
    assert "is not a plain identifier" in " ".join(capsys.readouterr().err.split())


@pytest.mark.parametrize(
    "bad_pattern",
    ["foo'; --", "foo bar", "foo'%", "foo\\bar", ""],
)
def test_truncate_schema_data_rejects_bad_patterns(
    bad_pattern: str, monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]
) -> None:
    """Exclude LIKE patterns outside ``[A-Za-z0-9_%]`` must be rejected."""
    monkeypatch.setattr(lib, "psql_command", lambda env, sql: None)
    env = lib.Env(pg_url="x", mysql_url="y", mysql_db="m", pg_db="d")
    with pytest.raises(SystemExit):
        lib.truncate_schema_data(env, "app", exclude_patterns=(bad_pattern,))
    assert "characters outside" in " ".join(capsys.readouterr().err.split())


def test_truncate_schema_data_emits_unrepr_quoted_patterns(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Whitelisted patterns are embedded verbatim into the generated DO block."""
    captured: list[str] = []
    monkeypatch.setattr(lib, "psql_command", lambda env, sql: captured.append(sql))
    env = lib.Env(pg_url="x", mysql_url="y", mysql_db="m", pg_db="d")
    lib.truncate_schema_data(env, "app", exclude_patterns=("%_status", "%_type"))
    assert len(captured) == 1
    sql = captured[0]
    assert "table_name LIKE '%_status'" in sql
    assert "table_name LIKE '%_type'" in sql
    assert "table_schema = 'app'" in sql


@pytest.mark.parametrize(
    "bad_table",
    ["1bad", "drop table x; --", "state-region", "", "app.state", "state'", "%_status"],
)
def test_truncate_schema_data_rejects_bad_exclude_tables(
    bad_table: str, monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]
) -> None:
    """Exact exclude_tables must be plain identifiers (no LIKE wildcards/quotes)."""
    monkeypatch.setattr(lib, "psql_command", lambda env, sql: None)
    env = lib.Env(pg_url="x", mysql_url="y", mysql_db="m", pg_db="d")
    with pytest.raises(SystemExit):
        lib.truncate_schema_data(env, "app", exclude_tables=(bad_table,))
    assert "is not a plain identifier" in " ".join(capsys.readouterr().err.split())


def test_truncate_schema_data_emits_exact_table_not_in(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """exclude_tables are emitted as an exact NOT IN list, not a LIKE pattern."""
    captured: list[str] = []
    monkeypatch.setattr(lib, "psql_command", lambda env, sql: captured.append(sql))
    env = lib.Env(pg_url="x", mysql_url="y", mysql_db="m", pg_db="d")
    lib.truncate_schema_data(env, "app", exclude_tables=("state", "role"))
    assert len(captured) == 1
    sql = captured[0]
    assert "table_name NOT IN ('state', 'role')" in sql
    assert "LIKE" not in sql


def test_env_load_caches(monkeypatch: pytest.MonkeyPatch) -> None:
    """Repeated Env.load() calls in one process must return the same instance."""
    monkeypatch.setenv("PG_URL", "postgresql://u:p@h/db")
    monkeypatch.setenv("MYSQL_URL", "mysql://u:p@h/db")
    a = lib.Env.load()
    b = lib.Env.load()
    assert a is b


def test_env_load_reloads_after_reset(monkeypatch: pytest.MonkeyPatch) -> None:
    """reset_env_cache() forces the next Env.load() to re-read the environment."""
    monkeypatch.setenv("PG_URL", "postgresql://u:p@h/db")
    monkeypatch.setenv("MYSQL_URL", "mysql://u:p@h/db")
    a = lib.Env.load()
    lib.reset_env_cache()
    monkeypatch.setenv("PG_URL", "postgresql://u:p@h/db2")
    b = lib.Env.load()
    assert a.pg_url != b.pg_url


def test_confirm_noninteractive_dies(
    monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]
) -> None:
    """With ``MIGRATE_NONINTERACTIVE=1`` confirm() must refuse to prompt."""
    monkeypatch.setenv("MIGRATE_NONINTERACTIVE", "1")
    with pytest.raises(SystemExit):
        lib.confirm("type y to proceed:")
    assert "refusing to prompt" in " ".join(capsys.readouterr().err.split())


def test_phase_decorator_marks_gate_on_success(tmp_state_dir: Path) -> None:
    """A successful phase function must mark its gate on clean exit."""

    @lib.phase("p_a")
    def go() -> str:
        """Return a sentinel value used to verify the decorator preserves results."""
        return "done"

    assert go() == "done"
    assert lib.gate_path("p_a").exists()


def test_phase_decorator_requires_prior_gate(tmp_state_dir: Path) -> None:
    """A phase with ``requires=`` must die if the prerequisite gate is missing."""

    @lib.phase("p_b", requires="p_a")
    def go() -> None:
        """Body is irrelevant; only the decorator behavior is under test."""
        return None

    with pytest.raises(SystemExit):
        go()
    lib.mark_gate("p_a")
    go()
    assert lib.gate_path("p_b").exists()


def test_phase_decorator_no_mark_when_disabled(tmp_state_dir: Path) -> None:
    """``mark=False`` opts out of automatic gate marking on success."""

    @lib.phase("p_c", mark=False)
    def go() -> None:
        """Body is irrelevant; only the decorator behavior is under test."""
        return None

    go()
    assert not lib.gate_path("p_c").exists()


def test_phase_decorator_does_not_mark_on_exception(tmp_state_dir: Path) -> None:
    """Raising inside a phase must prevent its gate from being marked."""

    @lib.phase("p_d")
    def go() -> None:
        """Always raise to exercise the failure path of the decorator."""
        raise RuntimeError("boom")

    with pytest.raises(RuntimeError):
        go()
    assert not lib.gate_path("p_d").exists()
