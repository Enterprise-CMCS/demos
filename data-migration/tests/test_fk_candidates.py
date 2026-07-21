"""Tests for migration.phases.fk_candidates (parser + Prisma back-translation + merge)."""

from __future__ import annotations

import csv
import json
from collections.abc import Sequence
from pathlib import Path
from typing import Any

import pytest

from migration import lib
from migration.phases import fk_candidates

# ---------------------------------------------------------------- parser


@pytest.mark.parametrize(
    ("defn", "expected_from", "expected_schema", "expected_table", "expected_to"),
    [
        (
            "FOREIGN KEY (state_id) REFERENCES app.state(id)",
            ["state_id"],
            "app",
            "state",
            ["id"],
        ),
        (
            'FOREIGN KEY ("state_id") REFERENCES "app"."state"("id")',
            ["state_id"],
            "app",
            "state",
            ["id"],
        ),
        (
            "FOREIGN KEY (a) REFERENCES other(b) ON DELETE CASCADE",
            ["a"],
            None,
            "other",
            ["b"],
        ),
        (
            "FOREIGN KEY (a, b) REFERENCES app.t(x, y) ON UPDATE NO ACTION",
            ["a", "b"],
            "app",
            "t",
            ["x", "y"],
        ),
        (
            'FOREIGN KEY ("we""ird") REFERENCES app."t"("id")',
            ['we"ird'],
            "app",
            "t",
            ["id"],
        ),
        (
            "FOREIGN KEY (state_id) REFERENCES app.state(id);",
            ["state_id"],
            "app",
            "state",
            ["id"],
        ),
    ],
)
def test_parse_fk_definition_happy(
    defn: str,
    expected_from: list[str],
    expected_schema: str | None,
    expected_table: str,
    expected_to: list[str],
) -> None:
    parsed = fk_candidates._parse_fk_definition(defn)
    assert parsed is not None
    assert parsed.from_columns == expected_from
    assert parsed.to_schema == expected_schema
    assert parsed.to_table == expected_table
    assert parsed.to_columns == expected_to


@pytest.mark.parametrize(
    "defn",
    [
        "",
        "DROP TABLE app.users",
        "PRIMARY KEY (id)",
        "CHECK (x > 0)",
        "FOREIGN KEY () REFERENCES t(id)",
    ],
)
def test_parse_fk_definition_rejects_garbage(defn: str) -> None:
    assert fk_candidates._parse_fk_definition(defn) is None


# ---------------------------------------------------------------- st index


@pytest.fixture
def stub_paths(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> dict[str, Path]:
    """Redirect every fk_candidates path constant to a tmp dir."""
    prisma_fks = tmp_path / "state" / "prisma_fks.json"
    st_csv = tmp_path / "reports" / "source_target_columns.csv"
    out_csv = tmp_path / "reports" / "fk_candidates.csv"
    overrides = tmp_path / "reports" / "fk_overrides.yaml"
    for p in (prisma_fks, st_csv, out_csv, overrides):
        p.parent.mkdir(parents=True, exist_ok=True)
    monkeypatch.setattr(fk_candidates, "PRISMA_FKS_FILE", prisma_fks)
    monkeypatch.setattr(lib, "PRISMA_FKS_FILE", prisma_fks)
    monkeypatch.setattr(fk_candidates, "SOURCE_TARGET_PATH", st_csv)
    monkeypatch.setattr(fk_candidates, "OUT_CSV", out_csv)
    monkeypatch.setattr(fk_candidates, "OVERRIDES_PATH", overrides)
    # By default there is no cached .prisma model set; individual tests opt in
    # via _set_prisma_text. This keeps the suite hermetic (the real
    # reports/prisma_schema.sha256 + cache are never consulted).
    monkeypatch.setattr(fk_candidates, "load_prisma_schema_text", lambda: None)
    return {
        "prisma_fks": prisma_fks,
        "st_csv": st_csv,
        "out_csv": out_csv,
        "overrides": overrides,
    }


def _set_prisma_text(monkeypatch: pytest.MonkeyPatch, text: str) -> None:
    """Stub the cached ``.prisma`` model text returned to fk_candidates."""
    monkeypatch.setattr(fk_candidates, "load_prisma_schema_text", lambda: text)


def _write_st_csv(path: Path, rows: list[dict[str, str]]) -> None:
    with path.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(
            f,
            fieldnames=[
                "mysql_table",
                "mysql_column",
                "demos_table",
                "demos_column",
                "transform",
                "notes",
            ],
        )
        w.writeheader()
        for r in rows:
            w.writerow(r)


def test_load_st_index_skips_drop_rows(stub_paths: dict[str, Path]) -> None:
    """Rows with empty demos_table (drops) are excluded from the index."""
    _write_st_csv(
        stub_paths["st_csv"],
        [
            {
                "mysql_table": "mdcd_demo",
                "mysql_column": "mdcd_demo_id",
                "demos_table": "demonstration",
                "demos_column": "id",
                "transform": "id_map",
                "notes": "",
            },
            {
                "mysql_table": "email_hstry",
                "mysql_column": "email_hstry_id",
                "demos_table": "",
                "demos_column": "",
                "transform": "drop",
                "notes": "no DEMOS counterpart",
            },
        ],
    )
    idx = fk_candidates._load_st_index()
    assert ("demonstration", "id") in idx
    assert all(k[0] for k in idx)  # no empty demos_table rows


def test_load_st_index_handles_one_to_many(stub_paths: dict[str, Path]) -> None:
    """One MySQL column routed to multiple DEMOS targets stays distinct in the index."""
    _write_st_csv(
        stub_paths["st_csv"],
        [
            {
                "mysql_table": "mdcd_demo_cmt",
                "mysql_column": "cmt_txt",
                "demos_table": "private_comment",
                "demos_column": "content",
                "transform": "comment_route",
                "notes": "",
            },
            {
                "mysql_table": "mdcd_demo_cmt",
                "mysql_column": "cmt_txt",
                "demos_table": "public_comment",
                "demos_column": "content",
                "transform": "comment_route",
                "notes": "",
            },
        ],
    )
    idx = fk_candidates._load_st_index()
    assert idx[("private_comment", "content")] == [
        ("mdcd_demo_cmt", "cmt_txt", "comment_route"),
    ]
    assert idx[("public_comment", "content")] == [
        ("mdcd_demo_cmt", "cmt_txt", "comment_route"),
    ]


# ----------------------------------------------------- back-translation


def test_back_translation_no_prisma_file(stub_paths: dict[str, Path]) -> None:
    """Missing prisma_fks.json yields an empty list, no error."""
    assert fk_candidates._prisma_back_translation() == []


def test_back_translation_no_st_csv(stub_paths: dict[str, Path]) -> None:
    """Missing source_target_columns.csv yields an empty list, no error."""
    stub_paths["prisma_fks"].write_text(json.dumps([]), encoding="utf-8")
    # st_csv path was created as a directory placeholder by the fixture, but
    # the file itself is absent: confirm the function bails.
    if stub_paths["st_csv"].exists():
        stub_paths["st_csv"].unlink()
    assert fk_candidates._prisma_back_translation() == []


_DELIVERABLE_PRISMA = """
model Deliverable {
  id              String        @id @db.Uuid
  demonstrationId String        @map("demonstration_id") @db.Uuid
  demonstration   Demonstration @relation("DeliverableDemo", fields: [demonstrationId], references: [id])
  @@map("deliverable")
}

model Demonstration {
  id String @id @db.Uuid
  @@map("demonstration")
}
"""


def test_back_translation_happy_path(
    stub_paths: dict[str, Path], monkeypatch: pytest.MonkeyPatch
) -> None:
    """A .prisma @relation with both sides mapped + a matching pg FK emits a
    HIGH candidate tagged ``pg_constraint: confirmed``."""
    _set_prisma_text(monkeypatch, _DELIVERABLE_PRISMA)
    _write_st_csv(
        stub_paths["st_csv"],
        [
            {
                "mysql_table": "mdcd_pgm_dtl",
                "mysql_column": "mdcd_demo_id",
                "demos_table": "deliverable",
                "demos_column": "demonstration_id",
                "transform": "id_map",
                "notes": "",
            },
            {
                "mysql_table": "mdcd_demo",
                "mysql_column": "mdcd_demo_id",
                "demos_table": "demonstration",
                "demos_column": "id",
                "transform": "id_map",
                "notes": "",
            },
        ],
    )
    stub_paths["prisma_fks"].write_text(
        json.dumps(
            [
                {
                    "schema": "app",
                    "table": "deliverable",
                    "name": "fk_deliverable_demo",
                    "definition": (
                        'FOREIGN KEY ("demonstration_id") '
                        'REFERENCES "app"."demonstration"("id")'
                    ),
                }
            ]
        ),
        encoding="utf-8",
    )
    out = fk_candidates._prisma_back_translation()
    assert out == [
        {
            "from_table_qual": "mysql_raw.mdcd_pgm_dtl",
            "from_column": "mdcd_demo_id",
            "to_table": "mdcd_demo",
            "to_column": "mdcd_demo_id",
            "confidence": "HIGH",
            "notes": "prisma:DeliverableDemo; pg_constraint: confirmed",
        }
    ]


def test_back_translation_prisma_missing_in_pg(
    stub_paths: dict[str, Path], monkeypatch: pytest.MonkeyPatch
) -> None:
    """A .prisma relation with no matching pg FK is tagged ``pg_constraint: missing``."""
    _set_prisma_text(monkeypatch, _DELIVERABLE_PRISMA)
    _write_st_csv(
        stub_paths["st_csv"],
        [
            {
                "mysql_table": "mdcd_pgm_dtl",
                "mysql_column": "mdcd_demo_id",
                "demos_table": "deliverable",
                "demos_column": "demonstration_id",
                "transform": "id_map",
                "notes": "",
            },
            {
                "mysql_table": "mdcd_demo",
                "mysql_column": "mdcd_demo_id",
                "demos_table": "demonstration",
                "demos_column": "id",
                "transform": "id_map",
                "notes": "",
            },
        ],
    )
    stub_paths["prisma_fks"].write_text(json.dumps([]), encoding="utf-8")
    out = fk_candidates._prisma_back_translation()
    assert len(out) == 1
    assert out[0]["notes"] == "prisma:DeliverableDemo; pg_constraint: missing"


def test_back_translation_composite_emits_paired_rows(
    stub_paths: dict[str, Path], monkeypatch: pytest.MonkeyPatch
) -> None:
    """A composite @relation emits one row per column-pair, tagged ``composite i/N``."""
    _set_prisma_text(
        monkeypatch,
        """
        model Child {
          aId String @map("a_id") @db.Uuid
          bId String @map("b_id") @db.Uuid
          parent Parent @relation("CP", fields: [aId, bId], references: [x, y])
          @@map("child")
        }
        model Parent {
          x String @map("p_x") @db.Uuid
          y String @map("p_y") @db.Uuid
          @@map("parent")
        }
        """,
    )
    _write_st_csv(
        stub_paths["st_csv"],
        [
            {"mysql_table": "m_child", "mysql_column": "ca", "demos_table": "child", "demos_column": "a_id", "transform": "copy", "notes": ""},
            {"mysql_table": "m_child", "mysql_column": "cb", "demos_table": "child", "demos_column": "b_id", "transform": "copy", "notes": ""},
            {"mysql_table": "m_parent", "mysql_column": "px", "demos_table": "parent", "demos_column": "p_x", "transform": "copy", "notes": ""},
            {"mysql_table": "m_parent", "mysql_column": "py", "demos_table": "parent", "demos_column": "p_y", "transform": "copy", "notes": ""},
        ],
    )
    stub_paths["prisma_fks"].write_text(json.dumps([]), encoding="utf-8")
    out = fk_candidates._prisma_back_translation()
    assert len(out) == 2
    notes = sorted(r["notes"] for r in out)
    assert notes == [
        "prisma:CP; pg_constraint: missing composite 1/2",
        "prisma:CP; pg_constraint: missing composite 2/2",
    ]
    pairs = {(r["from_column"], r["to_column"]) for r in out}
    assert pairs == {("ca", "px"), ("cb", "py")}


def test_back_translation_pg_only_implicit(
    stub_paths: dict[str, Path], monkeypatch: pytest.MonkeyPatch
) -> None:
    """An FK present only in pg_constraint (implicit m2m) is recovered + tagged."""
    _set_prisma_text(monkeypatch, "")  # no relations resolvable
    _write_st_csv(
        stub_paths["st_csv"],
        [
            {"mysql_table": "m_a", "mysql_column": "bid", "demos_table": "join_ab", "demos_column": "b_id", "transform": "copy", "notes": ""},
            {"mysql_table": "m_b", "mysql_column": "id", "demos_table": "b", "demos_column": "id", "transform": "copy", "notes": ""},
        ],
    )
    stub_paths["prisma_fks"].write_text(
        json.dumps(
            [
                {
                    "schema": "app",
                    "table": "join_ab",
                    "name": "fk_join_b",
                    "definition": "FOREIGN KEY (b_id) REFERENCES app.b(id)",
                }
            ]
        ),
        encoding="utf-8",
    )
    out = fk_candidates._prisma_back_translation()
    assert len(out) == 1
    assert out[0]["notes"] == "prisma:fk_join_b; pg_constraint only (implicit relation)"


def test_back_translation_skips_unmapped(stub_paths: dict[str, Path]) -> None:
    """An FK whose target side has no source-target mapping is dropped."""
    _write_st_csv(
        stub_paths["st_csv"],
        [
            {
                "mysql_table": "mdcd_demo",
                "mysql_column": "geo_ansi_state_cd",
                "demos_table": "demonstration",
                "demos_column": "state_id",
                "transform": "crosswalk:state",
                "notes": "",
            }
            # No row mapping to (state, id) -- target side unmapped.
        ],
    )
    stub_paths["prisma_fks"].write_text(
        json.dumps(
            [
                {
                    "schema": "app",
                    "table": "demonstration",
                    "name": "fk_demo_state",
                    "definition": "FOREIGN KEY (state_id) REFERENCES app.state(id)",
                }
            ]
        ),
        encoding="utf-8",
    )
    assert fk_candidates._prisma_back_translation() == []


def test_back_translation_annotates_crosswalk(stub_paths: dict[str, Path]) -> None:
    """Crosswalk transforms are surfaced in the notes for reviewer context."""
    _write_st_csv(
        stub_paths["st_csv"],
        [
            {
                "mysql_table": "mdcd_demo",
                "mysql_column": "mdcd_demo_stus_cd",
                "demos_table": "demonstration",
                "demos_column": "status_id",
                "transform": "crosswalk:demo_status",
                "notes": "",
            },
            {
                "mysql_table": "demo_status_rfrnc",
                "mysql_column": "status_cd",
                "demos_table": "demonstration_status",
                "demos_column": "id",
                "transform": "copy",
                "notes": "",
            },
        ],
    )
    stub_paths["prisma_fks"].write_text(
        json.dumps(
            [
                {
                    "schema": "app",
                    "table": "demonstration",
                    "name": "fk_demo_status",
                    "definition": (
                        "FOREIGN KEY (status_id) REFERENCES app.demonstration_status(id)"
                    ),
                }
            ]
        ),
        encoding="utf-8",
    )
    out = fk_candidates._prisma_back_translation()
    assert len(out) == 1
    assert "crosswalk:demo_status" in out[0]["notes"]


def test_back_translation_malformed_json(stub_paths: dict[str, Path]) -> None:
    """A non-list prisma_fks.json yields an empty list (not a crash)."""
    _write_st_csv(stub_paths["st_csv"], [])
    stub_paths["prisma_fks"].write_text(json.dumps({"not": "a list"}), encoding="utf-8")
    assert fk_candidates._prisma_back_translation() == []


# --------------------------------------------------------- run integration


def _stub_psql(monkeypatch: pytest.MonkeyPatch, sql_rows: list[tuple[Any, ...]]) -> None:
    """Replace ``psql_query`` so the FK scanner returns ``sql_rows`` verbatim."""

    def fake_query(_env: lib.Env, _sql: str, _params: Sequence[Any] = ()) -> list[tuple[Any, ...]]:
        return sql_rows

    monkeypatch.setattr(fk_candidates, "psql_query", fake_query)


def _set_pg_env(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("PG_URL", "postgresql://u:p@h/d")
    monkeypatch.setenv("MYSQL_URL", "mysql://u:p@h/m")


def _read_out_csv(path: Path) -> list[dict[str, str]]:
    with path.open(encoding="utf-8", newline="") as f:
        return list(csv.DictReader(f))


def test_run_emits_new_columns_with_no_prisma_data(
    stub_paths: dict[str, Path], monkeypatch: pytest.MonkeyPatch
) -> None:
    """Without prisma_fks.json, output preserves SQL rows and source='sql'."""
    _set_pg_env(monkeypatch)
    _stub_psql(
        monkeypatch,
        [("mysql_raw.mdcd_demo", "geo_ansi_state_cd", "geo_ansi_state_rfrnc", "id", "HIGH", "")],
    )
    fk_candidates.run_generate_fk_candidates()
    rows = _read_out_csv(stub_paths["out_csv"])
    assert rows == [
        {
            "from_table_qual": "mysql_raw.mdcd_demo",
            "from_column": "geo_ansi_state_cd",
            "to_table": "geo_ansi_state_rfrnc",
            "to_column": "id",
            "confidence": "HIGH",
            "notes": "",
            "source": "sql",
            "prisma_status": "",
        }
    ]


def test_run_marks_confirmed_when_sql_and_prisma_agree(
    stub_paths: dict[str, Path], monkeypatch: pytest.MonkeyPatch
) -> None:
    """SQL guess + Prisma back-translation agree -> source=prisma, status=confirmed."""
    _set_pg_env(monkeypatch)
    _write_st_csv(
        stub_paths["st_csv"],
        [
            {
                "mysql_table": "mdcd_pgm_dtl",
                "mysql_column": "mdcd_demo_id",
                "demos_table": "deliverable",
                "demos_column": "demonstration_id",
                "transform": "id_map",
                "notes": "",
            },
            {
                "mysql_table": "mdcd_demo",
                "mysql_column": "mdcd_demo_id",
                "demos_table": "demonstration",
                "demos_column": "id",
                "transform": "id_map",
                "notes": "",
            },
        ],
    )
    stub_paths["prisma_fks"].write_text(
        json.dumps(
            [
                {
                    "schema": "app",
                    "table": "deliverable",
                    "name": "fk_deliv_demo",
                    "definition": (
                        "FOREIGN KEY (demonstration_id) REFERENCES app.demonstration(id)"
                    ),
                }
            ]
        ),
        encoding="utf-8",
    )
    _stub_psql(
        monkeypatch,
        [
            (
                "mysql_raw.mdcd_pgm_dtl",
                "mdcd_demo_id",
                "mdcd_demo",
                "mdcd_demo_id",
                "MEDIUM",
                "",
            )
        ],
    )
    fk_candidates.run_generate_fk_candidates()
    rows = _read_out_csv(stub_paths["out_csv"])
    assert len(rows) == 1
    row = rows[0]
    assert row["source"] == "prisma"
    assert row["prisma_status"] == "confirmed"
    assert row["confidence"] == "HIGH"
    assert row["to_table"] == "mdcd_demo"
    assert row["to_column"] == "mdcd_demo_id"


def test_run_marks_conflict_when_sql_and_prisma_disagree(
    stub_paths: dict[str, Path], monkeypatch: pytest.MonkeyPatch
) -> None:
    """SQL guess differs from Prisma -> Prisma wins, status=conflict, sql guess in notes."""
    _set_pg_env(monkeypatch)
    _write_st_csv(
        stub_paths["st_csv"],
        [
            {
                "mysql_table": "mdcd_pgm_dtl",
                "mysql_column": "mdcd_demo_id",
                "demos_table": "deliverable",
                "demos_column": "demonstration_id",
                "transform": "id_map",
                "notes": "",
            },
            {
                "mysql_table": "mdcd_demo",
                "mysql_column": "mdcd_demo_id",
                "demos_table": "demonstration",
                "demos_column": "id",
                "transform": "id_map",
                "notes": "",
            },
        ],
    )
    stub_paths["prisma_fks"].write_text(
        json.dumps(
            [
                {
                    "schema": "app",
                    "table": "deliverable",
                    "name": "fk_deliv_demo",
                    "definition": (
                        "FOREIGN KEY (demonstration_id) REFERENCES app.demonstration(id)"
                    ),
                }
            ]
        ),
        encoding="utf-8",
    )
    _stub_psql(
        monkeypatch,
        [
            (
                "mysql_raw.mdcd_pgm_dtl",
                "mdcd_demo_id",
                "wrong_target",
                "wrong_col",
                "LOW",
                "",
            )
        ],
    )
    fk_candidates.run_generate_fk_candidates()
    row = _read_out_csv(stub_paths["out_csv"])[0]
    assert row["source"] == "prisma"
    assert row["prisma_status"] == "conflict"
    assert row["to_table"] == "mdcd_demo"
    assert "sql inferred wrong_target.wrong_col" in row["notes"]


def test_run_emits_prisma_only_and_sql_only(
    stub_paths: dict[str, Path], monkeypatch: pytest.MonkeyPatch
) -> None:
    """Rows that exist on only one side get the appropriate prisma_status label."""
    _set_pg_env(monkeypatch)
    _write_st_csv(
        stub_paths["st_csv"],
        [
            {
                "mysql_table": "mdcd_pgm_dtl",
                "mysql_column": "mdcd_demo_id",
                "demos_table": "deliverable",
                "demos_column": "demonstration_id",
                "transform": "id_map",
                "notes": "",
            },
            {
                "mysql_table": "mdcd_demo",
                "mysql_column": "mdcd_demo_id",
                "demos_table": "demonstration",
                "demos_column": "id",
                "transform": "id_map",
                "notes": "",
            },
        ],
    )
    stub_paths["prisma_fks"].write_text(
        json.dumps(
            [
                {
                    "schema": "app",
                    "table": "deliverable",
                    "name": "fk_deliv_demo",
                    "definition": (
                        "FOREIGN KEY (demonstration_id) REFERENCES app.demonstration(id)"
                    ),
                }
            ]
        ),
        encoding="utf-8",
    )
    _stub_psql(
        monkeypatch,
        [
            ("mysql_raw.legacy_only", "demo_id", "mdcd_demo", "mdcd_demo_id", "MEDIUM", ""),
        ],
    )
    fk_candidates.run_generate_fk_candidates()
    rows = {(r["from_table_qual"], r["from_column"]): r for r in _read_out_csv(stub_paths["out_csv"])}
    sql_only = rows[("mysql_raw.legacy_only", "demo_id")]
    prisma_only = rows[("mysql_raw.mdcd_pgm_dtl", "mdcd_demo_id")]
    assert sql_only["source"] == "sql"
    assert sql_only["prisma_status"] == "sql_only"
    assert prisma_only["source"] == "prisma"
    assert prisma_only["prisma_status"] == "prisma_only"


def test_overrides_win_over_prisma(
    stub_paths: dict[str, Path], monkeypatch: pytest.MonkeyPatch
) -> None:
    """A YAML override on a Prisma-derived row replaces the target and tags source=override."""
    _set_pg_env(monkeypatch)
    _write_st_csv(
        stub_paths["st_csv"],
        [
            {
                "mysql_table": "mdcd_pgm_dtl",
                "mysql_column": "mdcd_demo_id",
                "demos_table": "deliverable",
                "demos_column": "demonstration_id",
                "transform": "id_map",
                "notes": "",
            },
            {
                "mysql_table": "mdcd_demo",
                "mysql_column": "mdcd_demo_id",
                "demos_table": "demonstration",
                "demos_column": "id",
                "transform": "id_map",
                "notes": "",
            },
        ],
    )
    stub_paths["prisma_fks"].write_text(
        json.dumps(
            [
                {
                    "schema": "app",
                    "table": "deliverable",
                    "name": "fk_deliv_demo",
                    "definition": (
                        "FOREIGN KEY (demonstration_id) REFERENCES app.demonstration(id)"
                    ),
                }
            ]
        ),
        encoding="utf-8",
    )
    stub_paths["overrides"].write_text(
        "overrides:\n"
        '  - from_table: "mysql_raw.mdcd_pgm_dtl"\n'
        '    from_column: "mdcd_demo_id"\n'
        '    to_table: "mdcd_demo"\n'
        '    to_column: "alt_pk"\n'
        '    confidence: "HIGH"\n'
        '    notes: "SME: actually FK targets alt_pk"\n',
        encoding="utf-8",
    )
    _stub_psql(monkeypatch, [])
    fk_candidates.run_generate_fk_candidates()
    row = _read_out_csv(stub_paths["out_csv"])[0]
    assert row["source"] == "override"
    assert row["to_column"] == "alt_pk"
    assert row["notes"] == "SME: actually FK targets alt_pk"


def test_stale_overrides_logged_as_warning(
    stub_paths: dict[str, Path],
    monkeypatch: pytest.MonkeyPatch,
    capsys: pytest.CaptureFixture[str],
) -> None:
    """An override that matches no SQL/Prisma row still emits, but is logged."""
    _set_pg_env(monkeypatch)
    _write_st_csv(stub_paths["st_csv"], [])
    stub_paths["overrides"].write_text(
        "overrides:\n"
        '  - from_table: "mysql_raw.does_not_exist"\n'
        '    from_column: "ghost_id"\n'
        '    to_table: "ghost_target"\n'
        '    to_column: "id"\n'
        '    confidence: "LOW"\n'
        '    notes: "stale"\n',
        encoding="utf-8",
    )
    _stub_psql(monkeypatch, [])
    fk_candidates.run_generate_fk_candidates()
    captured = capsys.readouterr()
    combined = captured.out + captured.err
    assert "matched no SQL/Prisma row" in combined
    row = _read_out_csv(stub_paths["out_csv"])[0]
    assert row["source"] == "override"
    assert row["from_table_qual"] == "mysql_raw.does_not_exist"
