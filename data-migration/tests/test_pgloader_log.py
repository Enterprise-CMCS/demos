"""Unit coverage for lib.assert_pgloader_ok (H4: trust the log, not exit code)."""

from __future__ import annotations

from pathlib import Path

import pytest

from migration import lib

_CLEAN = """\
            table name     errors       rows      bytes      total time
------------------------  ---------  ---------  ---------  --------------
   "mysql_raw"."mdcd_demo"        0        100      4 kB          0.012s
------------------------  ---------  ---------  ---------  --------------
       Total import time          0        100      4 kB          0.030s
"""

_WITH_ERRORS = _CLEAN.replace("Total import time          0", "Total import time          3")

# On a fully clean run pgloader prints a check mark in the errors column of the
# Total import time row instead of a literal 0 (observed with the source-built
# 3.6.965d6cf binary), so the summary parser must treat it as zero errors.
_CLEAN_CHECKMARK = _CLEAN.replace("Total import time          0", "Total import time          \u2713")

# A MySQL 8 source whose collation (here id 76, utf8mb4_0900_*) the apt pgloader
# cannot read: it logs an ERROR-severity line and loads nothing. pgloader still
# exits 0 and can print an otherwise-clean summary, so only an ERROR-line guard
# (not the fatal-marker or summary checks) catches it -- same shape as the
# KABOOM case below.
_ECASE = "2026-06-29T16:16:30.484Z ERROR mysql: 76 fell through ECASE expression.\n" + _CLEAN

# pgloader (Homebrew 3.6.10 / SBCL) timestamps its log lines in local time with
# a numeric UTC offset ("...-04:00"), not the "Z" suffix the source-built binary
# used. A failed MySQL connect logs an ERROR-severity line, then still prints a
# clean check-mark summary and exits 0 -- so with a Z-only ERROR regex the empty
# load slipped through and marked the gate green (found in the dress rehearsal).
_CONNECT_FAIL = (
    '2026-07-08T16:25:12.203211-04:00 ERROR mysql: Failed to connect to mysql at '
    '"host" (port 4410) as user "E2CL": MySQL Error [1045]: "Access denied for '
    "user 'E2CL' (using password: YES)\"\n" + _CLEAN_CHECKMARK
)


def _write(tmp_path: Path, text: str) -> Path:
    p = tmp_path / "pgloader.log"
    p.write_text(text, encoding="utf-8")
    return p


def test_clean_log_passes(tmp_path: Path) -> None:
    """A summary with zero errors must not raise."""
    lib.assert_pgloader_ok(_write(tmp_path, _CLEAN))


def test_clean_log_checkmark_passes(tmp_path: Path) -> None:
    """A summary whose error column is pgloader's success check mark must not raise."""
    lib.assert_pgloader_ok(_write(tmp_path, _CLEAN_CHECKMARK))


def test_nonzero_errors_die(tmp_path: Path) -> None:
    """A non-zero error count in the summary row must hard-fail."""
    with pytest.raises(SystemExit):
        lib.assert_pgloader_ok(_write(tmp_path, _WITH_ERRORS))


def test_fatal_marker_dies(tmp_path: Path) -> None:
    """A fatal marker anywhere in the log must hard-fail even with a clean summary."""
    with pytest.raises(SystemExit):
        lib.assert_pgloader_ok(_write(tmp_path, "KABOOM something blew up\n" + _CLEAN))


def test_missing_summary_dies(tmp_path: Path) -> None:
    """A log without a summary row cannot confirm success, so it must die."""
    with pytest.raises(SystemExit):
        lib.assert_pgloader_ok(_write(tmp_path, "loading...\nno summary here\n"))


def test_ecase_error_dies(tmp_path: Path) -> None:
    """An ERROR-severity line (MySQL 8 collation ECASE abort) must hard-fail."""
    with pytest.raises(SystemExit) as exc:
        lib.assert_pgloader_ok(_write(tmp_path, _ECASE))
    assert exc.value.code != 0


def test_connect_error_offset_tz_dies(tmp_path: Path) -> None:
    """An ERROR line timestamped with a numeric TZ offset must hard-fail.

    Regression: the ERROR regex assumed a 'Z' UTC suffix, so a failed MySQL
    connect logged by the Homebrew build (offset timestamp) slipped past and a
    zero-row load marked the gate green.
    """
    with pytest.raises(SystemExit) as exc:
        lib.assert_pgloader_ok(_write(tmp_path, _CONNECT_FAIL))
    assert exc.value.code != 0


def test_missing_file_dies(tmp_path: Path) -> None:
    """A missing log file must hard-fail."""
    with pytest.raises(SystemExit):
        lib.assert_pgloader_ok(tmp_path / "nope.log")
