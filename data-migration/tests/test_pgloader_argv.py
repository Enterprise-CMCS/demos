"""Unit coverage for lib.pgloader_argv and the pgloader runner selection.

pgloader ships in two implementations that share the command-file syntax:
``v4`` (Clojure/JVM, run as ``java -Xmx<mb>m -jar <jar> <file>``) and ``v3``
(Common Lisp, the ``pgloader`` binary). v4 is selected when a jar is configured
(``PGLOADER_JAR`` / ``Env.pgloader_jar``); otherwise the v3 binary is used, and
its SBCL ``--dynamic-space-size`` flag is passed only on builds that accept it.
"""

from __future__ import annotations

from pathlib import Path
from types import SimpleNamespace
from typing import cast

import pytest

from migration import lib


def _fake_env(*, pgloader_jar: str, java_bin: str) -> lib.Env:
    """A minimal stand-in exposing only the fields the runner helpers read."""
    return cast(lib.Env, SimpleNamespace(pgloader_jar=pgloader_jar, java_bin=java_bin))


def _no_jar_env(monkeypatch: pytest.MonkeyPatch) -> None:
    """Ensure no jar is configured via the process environment (v3 path)."""
    monkeypatch.delenv("PGLOADER_JAR", raising=False)
    monkeypatch.delenv("JAVA_BIN", raising=False)


# --- v3 (Common Lisp binary) --------------------------------------------------


def test_default_dynamic_space_size(monkeypatch: pytest.MonkeyPatch) -> None:
    """Without an override, the argv carries the 4096 MB default before the file."""
    _no_jar_env(monkeypatch)
    monkeypatch.delenv("PGLOADER_DYNAMIC_SPACE_MB", raising=False)
    monkeypatch.setattr(lib, "_pgloader_accepts_dynamic_space_size", lambda: True)
    argv = lib.pgloader_argv(Path("/tmp/schema.rendered.load"))
    assert argv == [
        "pgloader",
        "--dynamic-space-size",
        "4096",
        "/tmp/schema.rendered.load",
    ]


def test_env_override_respected(monkeypatch: pytest.MonkeyPatch) -> None:
    """PGLOADER_DYNAMIC_SPACE_MB overrides the heap size."""
    _no_jar_env(monkeypatch)
    monkeypatch.setenv("PGLOADER_DYNAMIC_SPACE_MB", "8192")
    monkeypatch.setattr(lib, "_pgloader_accepts_dynamic_space_size", lambda: True)
    argv = lib.pgloader_argv(Path("/tmp/x.load"))
    assert argv[1:3] == ["--dynamic-space-size", "8192"]


def test_flag_omitted_when_build_rejects_it(monkeypatch: pytest.MonkeyPatch) -> None:
    """A build that rejects --dynamic-space-size gets a flag-free argv, not junk.

    Passing an unrecognized option makes pgloader dump usage and exit 1 before
    loading anything (the Homebrew 3.6.10 breakage found in the dress rehearsal).
    """
    _no_jar_env(monkeypatch)
    monkeypatch.delenv("PGLOADER_DYNAMIC_SPACE_MB", raising=False)
    monkeypatch.setattr(lib, "_pgloader_accepts_dynamic_space_size", lambda: False)
    argv = lib.pgloader_argv(Path("/tmp/x.load"))
    assert argv == ["pgloader", "/tmp/x.load"]


def test_accepts_probe_reads_pgloader_output(monkeypatch: pytest.MonkeyPatch) -> None:
    """The probe returns False when pgloader prints 'Undefined option'."""
    lib._pgloader_accepts_dynamic_space_size.cache_clear()
    monkeypatch.setattr(lib.shutil, "which", lambda _: "/usr/bin/pgloader")

    class _Proc:
        stdout = "Undefined option --dynamic-space-size\npgloader [ option ... ]"
        stderr = ""

    monkeypatch.setattr(lib.subprocess, "run", lambda *a, **k: _Proc())
    assert lib._pgloader_accepts_dynamic_space_size() is False
    lib._pgloader_accepts_dynamic_space_size.cache_clear()


@pytest.mark.parametrize("bad", ["0", "-1", "abc", "4096mb", ""])
def test_invalid_override_dies(monkeypatch: pytest.MonkeyPatch, bad: str) -> None:
    """A non-positive-integer override hard-fails instead of passing junk to SBCL."""
    _no_jar_env(monkeypatch)
    monkeypatch.setenv("PGLOADER_DYNAMIC_SPACE_MB", bad)
    with pytest.raises(SystemExit):
        lib.pgloader_argv(Path("/tmp/x.load"))


# --- v4 (Clojure/JVM jar) -----------------------------------------------------


def test_v4_argv_from_env_object(monkeypatch: pytest.MonkeyPatch) -> None:
    """An Env with a jar builds a `java -Xmx<mb>m -jar <jar> <file>` argv."""
    monkeypatch.delenv("PGLOADER_DYNAMIC_SPACE_MB", raising=False)
    env = _fake_env(pgloader_jar="/opt/pgloader.jar", java_bin="/jdk/bin/java")
    argv = lib.pgloader_argv(Path("/tmp/x.load"), env)
    assert argv == [
        "/jdk/bin/java",
        "-Xmx4096m",
        "-jar",
        "/opt/pgloader.jar",
        "/tmp/x.load",
    ]


def test_v4_argv_from_process_env(monkeypatch: pytest.MonkeyPatch) -> None:
    """PGLOADER_JAR / JAVA_BIN in the environment select the JVM runner."""
    monkeypatch.setenv("PGLOADER_JAR", "/opt/pgloader.jar")
    monkeypatch.setenv("JAVA_BIN", "/jdk/bin/java")
    monkeypatch.setenv("PGLOADER_DYNAMIC_SPACE_MB", "2048")
    argv = lib.pgloader_argv(Path("/tmp/x.load"))
    assert argv == ["/jdk/bin/java", "-Xmx2048m", "-jar", "/opt/pgloader.jar", "/tmp/x.load"]


def test_v4_default_java_bin(monkeypatch: pytest.MonkeyPatch) -> None:
    """An empty java_bin falls back to `java` on PATH."""
    monkeypatch.delenv("PGLOADER_DYNAMIC_SPACE_MB", raising=False)
    env = _fake_env(pgloader_jar="/opt/pgloader.jar", java_bin="")
    argv = lib.pgloader_argv(Path("/tmp/x.load"), env)
    assert argv[0] == "java"


def test_v4_relative_jar_resolved_against_root(monkeypatch: pytest.MonkeyPatch) -> None:
    """A relative jar path resolves against the repo root, not the CWD."""
    monkeypatch.delenv("PGLOADER_DYNAMIC_SPACE_MB", raising=False)
    env = _fake_env(pgloader_jar="state/pgloader/pgloader.jar", java_bin="java")
    argv = lib.pgloader_argv(Path("/tmp/x.load"), env)
    assert argv[3] == str(lib.ROOT_DIR / "state/pgloader/pgloader.jar")


# --- runner readiness ---------------------------------------------------------


def test_runner_problem_missing_jar() -> None:
    """A configured-but-absent jar yields an actionable message."""
    env = _fake_env(pgloader_jar="/nope/pgloader.jar", java_bin="java")
    problem = lib.pgloader_runner_problem(env)
    assert problem is not None
    assert "jar was not found" in problem


def test_runner_problem_jar_ok(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    """A present jar plus a resolvable java runtime is a ready runner (None)."""
    jar = tmp_path / "pgloader.jar"
    jar.write_bytes(b"PK")
    monkeypatch.setattr(lib.shutil, "which", lambda _: "/usr/bin/java")
    env = _fake_env(pgloader_jar=str(jar), java_bin="java")
    assert lib.pgloader_runner_problem(env) is None


def test_runner_problem_v3_missing_binary(monkeypatch: pytest.MonkeyPatch) -> None:
    """No jar and no pgloader binary on PATH yields an actionable message."""
    monkeypatch.setattr(lib.shutil, "which", lambda _: None)
    env = _fake_env(pgloader_jar="", java_bin="")
    problem = lib.pgloader_runner_problem(env)
    assert problem is not None
    assert "pgloader not found" in problem
