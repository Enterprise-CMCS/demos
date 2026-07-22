"""P8: smoke suite (manual checklist for now)."""

from __future__ import annotations

from migration.lib import confirm, die, log, phase

CHECKLIST = """
  [ ] Auth: log in as a state user
  [ ] Auth: log in as a CMS reviewer
  [ ] Demonstrations list loads
  [ ] Open a known demonstration; tabs render (demonstrations, amendments, deliverables)
  [ ] Open an amendment with comments
  [ ] Open a deliverable; preview a document
  [ ] BN workbook view loads JSONB without error
  [ ] Search returns expected demonstrations
  [ ] History tab renders (rows populated by DEMOS triggers post-cutover)
  [ ] Create-new flow renders (no actual save in smoke)
"""


@phase("smoke", requires="flip")
def run_smoke() -> None:
    """Run P8: print the smoke checklist and gate on operator confirmation.

    Requires the ``flip`` gate. Prints the manual top-10 user journeys,
    prompts the operator for an all-green confirmation, and marks the
    ``smoke`` gate on success. Failure suggests :func:`run_rollback`.
    """
    log("P8 smoke: top-10 user journeys against new backend")
    log(CHECKLIST)
    if not confirm("all green (y/N)?"):
        die("smoke failed; consider rollback")
