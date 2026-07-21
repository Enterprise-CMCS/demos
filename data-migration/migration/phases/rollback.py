"""Rollback: restore PMDA to read-write; place DEMOS in read-only.

PMDA (legacy) and DEMOS (new) are separate apps on separate URLs, so
rollback does not involve a DNS or load-balancer revert; the dev team
owns the URL/redirect work outside this repo. This phase records the
operator decision and walks the operator through the manual coordination
steps with the DBA and dev team.
"""

from __future__ import annotations

from migration.lib import clear_gate, confirm, die, log


def run_rollback() -> None:
    """Walk the operator through the rollback checklist and clear go-live gates.

    Prompts for an explicit ``'rollback'`` confirmation, prints the
    manual coordination steps with the DBA and dev team, and clears the
    ``flip`` and ``smoke`` gates so the cutover is no longer marked
    complete. ``freeze``, ``delta``, ``build``, and ``parity`` remain
    satisfied because their on-disk state is still valid.
    """
    log("ROLLBACK: this restores PMDA to read-write and places DEMOS in read-only.")
    if not confirm("type 'rollback' to proceed:", expected="rollback"):
        die("rollback not confirmed")

    log("1. PMDA restored to read-write mode (manual; coordinate with DBA)")
    log("2. DEMOS placed in read-only with banner (manual; coordinate with dev team)")
    log("3. Send rollback comms (use runbooks/comms/rollback.md)")
    log("4. Triage in post-mortem channel")

    clear_gate("flip")
    clear_gate("smoke")
    log("cleared flip+smoke gates; freeze + delta + build + parity remain valid")
