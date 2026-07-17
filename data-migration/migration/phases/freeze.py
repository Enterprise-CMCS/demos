"""P1: capture freeze instant after DBA pauses MySQL writes."""

from __future__ import annotations

from migration.lib import (
    STATE_DIR,
    Env,
    confirm,
    die,
    ensure_dirs,
    log,
    phase,
    psql_command,
    ts,
)


@phase("freeze", requires="preflight")
def run_freeze() -> None:
    """Run P1: record the freeze instant after the DBA pauses MySQL writes.

    Requires the ``preflight`` gate. Prompts the operator to confirm
    writes are paused, writes ``state/freeze_instant.txt``, appends a
    row to ``mysql_raw._delta_log``, and marks the ``freeze`` gate.
    """
    ensure_dirs()
    env = Env.load()

    log("P1 freeze MySQL writes (manual coordination with DBA)")
    if not confirm("press y once writes are paused and old app banner is up:"):
        die("freeze not confirmed")

    instant = ts()
    (STATE_DIR / "freeze_instant.txt").write_text(instant + "\n", encoding="utf-8")
    psql_command(
        env,
        "INSERT INTO mysql_raw._delta_log (freeze_instant) VALUES (%s::timestamptz);",
        [instant],
    )
    log(f"freeze instant: {instant}")
