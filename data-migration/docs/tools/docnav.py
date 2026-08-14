"""Append a 'prev / next' navigation footer to every page in the docs set.

Reading order follows the audience-book layout: README -> canonical spec
-> operator (index, tutorial, how-tos, reference, explanation) ->
developer (same Diataxis order) -> sme (same).

The footer is wrapped in `// docnav-start` / `// docnav-end` markers so
the script is idempotent: re-running it strips the previous block and
re-emits the current one.

Run from anywhere; the script only writes to docs/.
"""

from __future__ import annotations

import re
from pathlib import Path

DOCS = Path(__file__).resolve().parents[1]

ORDER: list[str] = [
    "README.adoc",
    "spec/canonical-spec.adoc",
    "spec/migration-plan.adoc",
    # operator
    "operator/index.adoc",
    "operator/tutorial-first-cutover-rehearsal.adoc",
    "operator/howto-cutover-day.adoc",
    "operator/howto-rollback.adoc",
    "operator/howto-rebuild-from-scratch.adoc",
    "operator/howto-curate-filter.adoc",
    "operator/howto-troubleshoot-pgloader.adoc",
    "operator/howto-troubleshoot-fk-violations.adoc",
    "operator/howto-troubleshoot-parity-red.adoc",
    "operator/reference-cli.adoc",
    "operator/reference-makefile.adoc",
    "operator/reference-gates-state.adoc",
    "operator/reference-environment.adoc",
    "operator/reference-human-inputs.adoc",
    "operator/reference-demonstration-flow.adoc",
    "operator/reference-amendment-flow.adoc",
    "operator/reference-comms-templates.adoc",
    "operator/explanation-cutover-state-machine.adoc",
    "operator/explanation-rehearsal-strategy.adoc",
    # developer
    "developer/index.adoc",
    "developer/tutorial-add-a-new-transform.adoc",
    "developer/howto-add-a-phase.adoc",
    "developer/howto-snapshot-source-schema.adoc",
    "developer/howto-dump-reference-data.adoc",
    "developer/howto-add-a-crosswalk.adoc",
    "developer/howto-edit-pgloader-cast.adoc",
    "developer/howto-promote-jsonb-schema.adoc",
    "developer/howto-revalidate-jsonb.adoc",
    "developer/howto-write-a-parity-check.adoc",
    "developer/howto-run-tests-locally.adoc",
    "developer/reference-pipeline-stages.adoc",
    "developer/reference-python-package.adoc",
    "developer/reference-templates.adoc",
    "developer/reference-fk-overrides-yaml.adoc",
    "developer/reference-jsonb-schema-registry.adoc",
    "developer/reference-prisma-ddl.adoc",
    "developer/reference-schema-diagrams.adoc",
    "developer/reference-id-maps.adoc",
    "developer/reference-data-dictionary.adoc",
    "developer/reference-source-target-columns.adoc",
    "developer/reference-derivability-audit.adoc",
    "developer/reference-users-person-migration.adoc",
    "developer/explanation-why-python-not-bash.adoc",
    "developer/explanation-idempotency.adoc",
    "developer/explanation-fk-strategy.adoc",
    "developer/explanation-history-backfill.adoc",
    # sme
    "sme/index.adoc",
    "sme/howto-author-a-crosswalk-csv.adoc",
    "sme/howto-review-pending-approved-decisions.adoc",
    "sme/howto-review-pgm-dtl-tag-mapping.adoc",
    "sme/howto-review-bn-jsonb-payload.adoc",
    "sme/reference-static-constraint-tables.adoc",
    "sme/reference-pgm-dtl-tag-mapping.adoc",
    "sme/reference-pending-approved-rules.adoc",
    "sme/reference-history-strategy.adoc",
    "sme/reference-drop-list.adoc",
    "sme/reference-source-target-map.adoc",
    "sme/reference-source-target-columns.adoc",
    "sme/explanation-data-shape-decisions.adoc",
    "sme/explanation-comments-routing.adoc",
    "sme/explanation-derivability.adoc",
]

START = "// docnav-start"
END = "// docnav-end"

DOCNAV_RE = re.compile(rf"{re.escape(START)}.*?{re.escape(END)}\n*", re.DOTALL)


def relpath(target: str, source_dir: str) -> str:
    """Return target path relative to source_dir."""
    target_parts = target.split("/")
    if not source_dir:
        return target
    src_parts = source_dir.split("/")
    i = 0
    while i < len(src_parts) and i < len(target_parts) - 1 and src_parts[i] == target_parts[i]:
        i += 1
    ups = ["../"] * (len(src_parts) - i)
    rest = target_parts[i:]
    return "".join(ups) + "/".join(rest)


def render_block(prev: str | None, next_: str | None, source_dir: str) -> str:
    """Build the docnav footer block linking to ``prev`` and ``next_`` pages.

    Links are emitted relative to ``source_dir``. Either neighbour may
    be ``None`` (at the start/end of the reading order), in which case
    that side of the table is left empty. The middle cell always links
    to the global table of contents (`docs/toc.adoc`).
    """
    prev_link = f"xref:{relpath(prev, source_dir)}[< prev]" if prev else ""
    next_link = f"xref:{relpath(next_, source_dir)}[next >]" if next_ else ""
    toc_link = f"xref:{relpath('toc.adoc', source_dir)}[Table of contents]"
    # Wrap in `ifndef::nested[]` so a parent that includes this page
    # inline (set `:nested:` before the include) does not pull in the
    # docnav footer. Standalone renders see the block as normal because
    # the attribute is unset.
    return (
        f"\n{START}\n"
        "ifndef::nested[]\n"
        "'''\n\n"
        '[.docnav,cols="1,1,1",frame=none,grid=none,stripes=none]\n'
        "|===\n"
        f"|{prev_link}\n"
        f"^|{toc_link}\n"
        f">|{next_link}\n"
        "|===\n"
        "endif::[]\n"
        f"{END}\n"
    )


def update(path: Path, block: str) -> None:
    """Rewrite ``path`` with the current docnav block appended (idempotent)."""
    text = path.read_text(encoding="utf-8")
    text = DOCNAV_RE.sub("", text)
    text = text.rstrip() + "\n" + block
    path.write_text(text, encoding="utf-8")


def main() -> None:
    """Append a freshly rendered docnav footer to every page in :data:`ORDER`."""
    for i, rel in enumerate(ORDER):
        path = DOCS / rel
        if not path.exists():
            raise SystemExit(f"missing: {rel}")
        prev = ORDER[i - 1] if i > 0 else None
        next_ = ORDER[i + 1] if i < len(ORDER) - 1 else None
        source_dir = "/".join(rel.split("/")[:-1])
        block = render_block(prev, next_, source_dir)
        update(path, block)
    print(f"Wrote docnav footer to {len(ORDER)} files.")


if __name__ == "__main__":
    main()
