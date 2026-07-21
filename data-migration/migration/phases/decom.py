"""P10: decommission old MySQL after hypercare."""

from __future__ import annotations

from migration.lib import confirm, die, log, phase


@phase("decom", requires="smoke")
def run_decom() -> None:
    """Run P10: walk the operator through MySQL decommissioning checklists.

    Requires the ``smoke`` gate. Prompts for an explicit ``'decom'``
    confirmation, then prints the manual steps the operator must
    coordinate with the DBA (access revoke, final backup, teardown,
    post-mortem).
    """
    log("P10 decom: revoking app access to MySQL and capturing final backup")
    if not confirm("confirm decom (type 'decom' to proceed)?", expected="decom"):
        die("decom not confirmed")

    log("1. Revoke app DB user on MySQL (manual; coordinate with DBA)")
    log("2. Capture final MySQL backup (manual; coordinate with DBA)")
    log("3. Schedule MySQL teardown (manual)")
    log("4. Author post-mortem doc at reports/postmortem.md")
