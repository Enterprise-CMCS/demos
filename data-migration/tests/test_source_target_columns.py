"""Tests for ``docs/tools/source_target_columns_to_adoc.py``.

Covers:

* End-to-end golden render: minimal MySQL/DEMOS mermaid + 5-row CSV +
  drop list -> three adoc fragments are produced and contain the
  expected anchor strings.
* Lint failures: missing column on either side, unknown transform,
  missing crosswalk, missing pgm_dtl tag, drop-list mismatch.
* The ``--allow-missing-mysql-mmd`` escape hatch.
"""

from __future__ import annotations

import importlib.util
import sys
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parent.parent
TOOL_PATH = REPO_ROOT / "docs" / "tools" / "source_target_columns_to_adoc.py"


def _load_module():
    spec = importlib.util.spec_from_file_location("source_target_columns_to_adoc", TOOL_PATH)
    assert spec is not None
    assert spec.loader is not None
    mod = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = mod
    spec.loader.exec_module(mod)
    return mod


MOD = _load_module()


MYSQL_MMD = """\
erDiagram
  mdcd_demo:::dataTable {
    int demo_id PK
    text demo_prjct_nbr
    int demo_stus_cd
    int state_cd
    datetime crtd_dttm
  }
  mdcd_mc_pgm_dtl:::dataTable {
    int mc_pgm_dtl_id PK
    int demo_id FK
    date from_dt
    date to_dt
  }
  email_hstry:::dataTable {
    int email_id PK
    datetime sent_dttm
  }
"""

DEMOS_MMD = """\
erDiagram
  demonstration:::dataTable {
    uuid id PK
    text project_number
    text state_id FK
    timestamptz created_at
  }
  application:::dataTable {
    uuid id PK
    text application_status_id FK
  }
  application_date:::dataTable {
    uuid id PK
    timestamptz date_value
  }
  demonstration_type_tag_assignment:::dataTable {
    uuid id PK
    uuid demonstration_id FK
    timestamptz effective_date
    timestamptz expiration_date
  }
"""

DROP_LIST = """\
# Drop list rationale

| Category | Table | Reason |
|---|---|---|
| DROP_EMAIL | `email_hstry` | Notification machinery; no DEMOS counterpart. |
"""

PGM_DTL_CSV = """\
source_table,tag_name,from_dt_col,to_dt_col,additional_attrs,notes
mdcd_mc_pgm_dtl,managed_care,from_dt,to_dt,,
"""

GOOD_CSV = """\
mysql_table,mysql_column,demos_table,demos_column,transform,notes
mdcd_demo,demo_id,demonstration,id,id_map,id-map mint
mdcd_demo,demo_prjct_nbr,demonstration,project_number,copy,
mdcd_demo,state_cd,demonstration,state_id,crosswalk:state,
mdcd_demo,crtd_dttm,demonstration,created_at,cast,
mdcd_demo,demo_stus_cd,application,application_status_id,crosswalk:demo_status,
mdcd_mc_pgm_dtl,demo_id,demonstration_type_tag_assignment,demonstration_id,id_map,
mdcd_mc_pgm_dtl,from_dt,demonstration_type_tag_assignment,effective_date,tag_pivot:managed_care,
mdcd_mc_pgm_dtl,to_dt,demonstration_type_tag_assignment,expiration_date,tag_pivot:managed_care,
"""


@pytest.fixture
def fixtures(tmp_path: Path) -> dict[str, Path]:
    mysql_mmd = tmp_path / "mysql.mmd"
    mysql_mmd.write_text(MYSQL_MMD, encoding="utf-8")

    demos_mmd = tmp_path / "demos.mmd"
    demos_mmd.write_text(DEMOS_MMD, encoding="utf-8")

    drop_list = tmp_path / "drop_list.md"
    drop_list.write_text(DROP_LIST, encoding="utf-8")

    pgm_dtl = tmp_path / "pgm_dtl_tag_mapping.csv"
    pgm_dtl.write_text(PGM_DTL_CSV, encoding="utf-8")

    crosswalks = tmp_path / "crosswalks"
    crosswalks.mkdir()
    (crosswalks / "state.csv").write_text(
        "legacy_int_cd,legacy_name,demos_text_id,notes\n", encoding="utf-8"
    )
    (crosswalks / "demo_status.csv").write_text(
        "legacy_int_cd,legacy_name,demos_text_id,notes\n", encoding="utf-8"
    )

    out_dir = tmp_path / "out"
    out_dir.mkdir()

    return {
        "mysql_mmd": mysql_mmd,
        "demos_mmd": demos_mmd,
        "drop_list": drop_list,
        "pgm_dtl": pgm_dtl,
        "crosswalks": crosswalks,
        "out_dir": out_dir,
        "tmp": tmp_path,
    }


def _argv(csv_path: Path, fx: dict[str, Path]) -> list[str]:
    return [
        "--mysql-mmd", str(fx["mysql_mmd"]),
        "--demos-mmd", str(fx["demos_mmd"]),
        "--csv", str(csv_path),
        "--drop-list", str(fx["drop_list"]),
        "--pgm-dtl", str(fx["pgm_dtl"]),
        "--crosswalk-dir", str(fx["crosswalks"]),
        "--out-dir", str(fx["out_dir"]),
    ]


def test_parse_mermaid_minimal() -> None:
    tables = MOD.parse_mermaid(MYSQL_MMD)
    assert "mdcd_demo" in tables
    assert "demo_id" in tables["mdcd_demo"].columns
    assert tables["mdcd_demo"].columns["demo_id"] == "int"
    assert tables["mdcd_demo"].columns["crtd_dttm"] == "datetime"


def test_load_drop_list_extracts_table_and_reason(fixtures: dict[str, Path]) -> None:
    drops = MOD.load_drop_list(fixtures["drop_list"])
    assert drops == {"email_hstry": "Notification machinery; no DEMOS counterpart."}


def test_norm_type_bridges_int_and_integer() -> None:
    assert MOD.norm_type("int") == "integer"
    assert MOD.norm_type("INTEGER") == "integer"
    assert MOD.norm_type("varchar") == "text"
    assert MOD.norm_type("datetime") == "timestamp"


def test_match_marker_drop_wins() -> None:
    assert MOD.match_marker("int", None, "drop") == "DROP"


def test_match_marker_id_map_warns_int_to_uuid() -> None:
    assert MOD.match_marker("int", "uuid", "id_map") == "WARN"


def test_match_marker_mismatch_when_no_explanation() -> None:
    assert MOD.match_marker("int", "uuid", "copy") == "MISMATCH"


def test_match_marker_ok_when_normalised_types_agree() -> None:
    assert MOD.match_marker("text", "varchar", "copy") == "OK"


def test_end_to_end_golden_render(fixtures: dict[str, Path]) -> None:
    csv_path = fixtures["tmp"] / "mapping.csv"
    csv_path.write_text(GOOD_CSV, encoding="utf-8")

    rc = MOD.main(_argv(csv_path, fixtures))
    assert rc == 0

    table_adoc = (fixtures["out_dir"] / "source_target_columns_table.adoc").read_text()
    sections_adoc = (fixtures["out_dir"] / "source_target_columns_sections.adoc").read_text()
    coverage_adoc = (fixtures["out_dir"] / "source_target_columns_coverage.adoc").read_text()

    assert "[%header%autowidth.stretch.sortable]" in table_adoc
    assert "`mdcd_demo`" in table_adoc
    assert "`demonstration`" in table_adoc
    assert "`drop`" in table_adoc
    assert "DROP" in table_adoc

    assert "=== `mdcd_demo`" in sections_adoc
    assert "=== `mdcd_mc_pgm_dtl`" in sections_adoc
    assert "=== Dropped tables" in sections_adoc
    assert "tag_pivot:managed_care" in sections_adoc

    assert "MySQL tables in PMDA model" in coverage_adoc
    assert "Column-mapping rows" in coverage_adoc


def test_lint_unknown_transform_fails(fixtures: dict[str, Path]) -> None:
    csv_path = fixtures["tmp"] / "bad.csv"
    csv_path.write_text(
        "mysql_table,mysql_column,demos_table,demos_column,transform,notes\n"
        "mdcd_demo,demo_id,demonstration,id,not_a_real_transform,\n"
        "mdcd_mc_pgm_dtl,from_dt,demonstration_type_tag_assignment,effective_date,tag_pivot:managed_care,\n",
        encoding="utf-8",
    )
    with pytest.raises(SystemExit) as exc:
        MOD.main(_argv(csv_path, fixtures))
    assert exc.value.code == 1


def test_lint_missing_mysql_column_fails(fixtures: dict[str, Path]) -> None:
    csv_path = fixtures["tmp"] / "bad.csv"
    csv_path.write_text(
        "mysql_table,mysql_column,demos_table,demos_column,transform,notes\n"
        "mdcd_demo,not_a_real_column,demonstration,id,id_map,\n",
        encoding="utf-8",
    )
    with pytest.raises(SystemExit) as exc:
        MOD.main(_argv(csv_path, fixtures))
    assert exc.value.code == 1


def test_lint_demos_column_without_table_fails(
    fixtures: dict[str, Path], capsys: pytest.CaptureFixture[str]
) -> None:
    """A CSV row with demos_column but no demos_table must fail cleanly with the
    specific orphan-column message, not raise KeyError when the lint tries to
    look the table up."""
    csv_path = fixtures["tmp"] / "bad.csv"
    csv_path.write_text(
        "mysql_table,mysql_column,demos_table,demos_column,transform,notes\n"
        "mdcd_demo,demo_id,,orphan_column,id_map,\n"
        "mdcd_mc_pgm_dtl,from_dt,demonstration_type_tag_assignment,effective_date,tag_pivot:managed_care,\n",
        encoding="utf-8",
    )
    with pytest.raises(SystemExit) as exc:
        MOD.main(_argv(csv_path, fixtures))
    assert exc.value.code == 1
    captured = capsys.readouterr()
    assert "DEMOS column set without DEMOS table" in captured.err
    assert "mdcd_demo.demo_id" in captured.err


def test_lint_missing_demos_column_fails(fixtures: dict[str, Path]) -> None:
    csv_path = fixtures["tmp"] / "bad.csv"
    csv_path.write_text(
        "mysql_table,mysql_column,demos_table,demos_column,transform,notes\n"
        "mdcd_demo,demo_id,demonstration,not_a_real_column,id_map,\n",
        encoding="utf-8",
    )
    with pytest.raises(SystemExit) as exc:
        MOD.main(_argv(csv_path, fixtures))
    assert exc.value.code == 1


def test_lint_missing_crosswalk_csv_fails(fixtures: dict[str, Path]) -> None:
    csv_path = fixtures["tmp"] / "bad.csv"
    csv_path.write_text(
        "mysql_table,mysql_column,demos_table,demos_column,transform,notes\n"
        "mdcd_demo,demo_id,demonstration,id,crosswalk:does_not_exist,\n",
        encoding="utf-8",
    )
    with pytest.raises(SystemExit) as exc:
        MOD.main(_argv(csv_path, fixtures))
    assert exc.value.code == 1


def test_lint_missing_tag_pivot_tag_fails(fixtures: dict[str, Path]) -> None:
    csv_path = fixtures["tmp"] / "bad.csv"
    csv_path.write_text(
        "mysql_table,mysql_column,demos_table,demos_column,transform,notes\n"
        "mdcd_demo,demo_id,demonstration,id,id_map,\n"
        "mdcd_mc_pgm_dtl,from_dt,demonstration_type_tag_assignment,effective_date,tag_pivot:not_a_tag,\n",
        encoding="utf-8",
    )
    with pytest.raises(SystemExit) as exc:
        MOD.main(_argv(csv_path, fixtures))
    assert exc.value.code == 1


def test_lint_uncovered_table_fails(fixtures: dict[str, Path]) -> None:
    csv_path = fixtures["tmp"] / "bad.csv"
    csv_path.write_text(
        "mysql_table,mysql_column,demos_table,demos_column,transform,notes\n"
        "mdcd_demo,demo_id,demonstration,id,id_map,\n",
        encoding="utf-8",
    )
    with pytest.raises(SystemExit) as exc:
        MOD.main(_argv(csv_path, fixtures))
    assert exc.value.code == 1


# ---------- Graphviz digraph parser ----------

GRAPHVIZ_HTML = """\
digraph {
\tconcentrate=true rankdir=TB
\tmdcd_demo [label=<<TABLE BORDER='1' CELLBORDER='1' CELLSPACING='0'>\
<TR><TD BGCOLOR='lightblue'><B>mdcd_demo</B></TD></TR>\
<TR><TD ALIGN='LEFT' PORT='mdcd_demo_id'>mdcd_demo_id (int)</TD></TR>\
<TR><TD ALIGN='LEFT' PORT='mdcd_demo_name'>mdcd_demo_name (varchar(128))</TD></TR>\
<TR><TD ALIGN='LEFT' PORT='creatd_dt'>creatd_dt (timestamp)</TD></TR>\
<TR><TD ALIGN='LEFT' PORT='active'>active (tinyint(1))</TD></TR>\
<TR><TD ALIGN='LEFT' PORT='Notes (2)'>Notes (2) (mediumtext)</TD></TR>\
<TR><TD ALIGN='LEFT' PORT='ratio'>ratio (decimal(15,2))</TD></TR>\
<TR><TD ALIGN='LEFT' PORT='count'>count (int unsigned)</TD></TR>\
</TABLE>> shape=plaintext]
\teml [label=<<TABLE BORDER='1' CELLBORDER='1' CELLSPACING='0'>\
<TR><TD BGCOLOR='lightblue'><B>eml</B></TD></TR>\
<TR><TD ALIGN='LEFT' PORT='eml_id'>eml_id (int)</TD></TR>\
</TABLE>> shape=plaintext]
}
"""

GRAPHVIZ_RECORD = """\
digraph {
\tfoo [shape=record label="{ <foo> | id : int | name : varchar(64) | created_at : timestamp }"]
}
"""


def test_parse_graphviz_html_label_columns_and_types() -> None:
    tables = MOD.parse_graphviz(GRAPHVIZ_HTML)
    assert "mdcd_demo" in tables
    assert "eml" in tables
    cols = tables["mdcd_demo"].columns
    assert list(cols)[:3] == ["mdcd_demo_id", "mdcd_demo_name", "creatd_dt"]
    assert cols["mdcd_demo_id"] == "int"
    assert cols["mdcd_demo_name"] == "varchar(128)"
    assert cols["active"] == "tinyint(1)"
    # Column whose name itself contains parens; type must be the trailing group.
    assert cols["Notes (2)"] == "mediumtext"
    # Nested-paren type must be preserved verbatim.
    assert cols["ratio"] == "decimal(15,2)"
    # MySQL "int unsigned" preserved as raw type; norm_type collapses it.
    assert cols["count"] == "int unsigned"
    assert MOD.norm_type("int unsigned") == "integer"
    assert MOD.norm_type("decimal(15,2)") == "numeric"
    assert MOD.norm_type("tinyint(1)") == "integer"
    assert MOD.norm_type("mediumtext") == "text"


def test_parse_graphviz_record_label() -> None:
    tables = MOD.parse_graphviz(GRAPHVIZ_RECORD)
    assert "foo" in tables
    cols = tables["foo"].columns
    assert cols == {"id": "int", "name": "varchar(64)", "created_at": "timestamp"}


def test_detect_schema_format_graphviz_vs_mermaid() -> None:
    assert MOD.detect_schema_format(GRAPHVIZ_HTML) == "graphviz"
    assert MOD.detect_schema_format(MYSQL_MMD) == "mermaid"
    assert MOD.detect_schema_format("", Path("x.dot")) == "graphviz"
    assert MOD.detect_schema_format("", Path("x.mmd")) == "mermaid"


def test_load_schema_dispatches_by_content(tmp_path: Path) -> None:
    gv = tmp_path / "model.dot"
    gv.write_text(GRAPHVIZ_HTML, encoding="utf-8")
    tables = MOD.load_schema(gv)
    assert "mdcd_demo" in tables
    assert "eml" in tables

    mmd = tmp_path / "model.mmd"
    mmd.write_text(MYSQL_MMD, encoding="utf-8")
    tables = MOD.load_schema(mmd)
    assert "mdcd_demo" in tables


def test_end_to_end_with_graphviz_mysql_source(fixtures: dict[str, Path]) -> None:
    # Replace the MySQL mermaid with a Graphviz digraph that exposes the
    # exact columns/tables the GOOD_CSV expects.
    gv = fixtures["tmp"] / "mysql.dot"
    gv.write_text(
        "digraph {\n"
        "\tmdcd_demo [label=<<TABLE>"
        "<TR><TD><B>mdcd_demo</B></TD></TR>"
        "<TR><TD PORT='demo_id'>demo_id (int)</TD></TR>"
        "<TR><TD PORT='demo_prjct_nbr'>demo_prjct_nbr (varchar(20))</TD></TR>"
        "<TR><TD PORT='state_cd'>state_cd (int)</TD></TR>"
        "<TR><TD PORT='crtd_dttm'>crtd_dttm (datetime)</TD></TR>"
        "<TR><TD PORT='demo_stus_cd'>demo_stus_cd (int)</TD></TR>"
        "</TABLE>> shape=plaintext]\n"
        "\tmdcd_mc_pgm_dtl [label=<<TABLE>"
        "<TR><TD><B>mdcd_mc_pgm_dtl</B></TD></TR>"
        "<TR><TD PORT='demo_id'>demo_id (int)</TD></TR>"
        "<TR><TD PORT='from_dt'>from_dt (date)</TD></TR>"
        "<TR><TD PORT='to_dt'>to_dt (date)</TD></TR>"
        "</TABLE>> shape=plaintext]\n"
        "\temail_hstry [label=<<TABLE>"
        "<TR><TD><B>email_hstry</B></TD></TR>"
        "<TR><TD PORT='email_id'>email_id (int)</TD></TR>"
        "</TABLE>> shape=plaintext]\n"
        "}\n",
        encoding="utf-8",
    )
    csv_path = fixtures["tmp"] / "mapping.csv"
    csv_path.write_text(GOOD_CSV, encoding="utf-8")
    argv = [
        "--mysql-mmd", str(gv),
        "--demos-mmd", str(fixtures["demos_mmd"]),
        "--csv", str(csv_path),
        "--drop-list", str(fixtures["drop_list"]),
        "--pgm-dtl", str(fixtures["pgm_dtl"]),
        "--crosswalk-dir", str(fixtures["crosswalks"]),
        "--out-dir", str(fixtures["out_dir"]),
    ]
    rc = MOD.main(argv)
    assert rc == 0
    coverage = (fixtures["out_dir"] / "source_target_columns_coverage.adoc").read_text()
    assert "MySQL tables in PMDA model" in coverage


def test_allow_uncovered_tables_demotes_coverage_lint(
    fixtures: dict[str, Path], tmp_path: Path
) -> None:
    # Add a table to the MySQL mermaid that the CSV does not cover and is
    # not on the drop list. Without --allow-uncovered-tables this fails;
    # with it, the build succeeds and the coverage adoc lists it.
    extra_mmd = tmp_path / "mysql_with_extra.mmd"
    extra_mmd.write_text(
        MYSQL_MMD
        + """  uncovered_x:::dataTable {
    int x_id PK
    text x_name
  }
""",
        encoding="utf-8",
    )

    csv_path = tmp_path / "mapping.csv"
    csv_path.write_text(GOOD_CSV, encoding="utf-8")

    base_argv = [
        "--mysql-mmd", str(extra_mmd),
        "--demos-mmd", str(fixtures["demos_mmd"]),
        "--csv", str(csv_path),
        "--drop-list", str(fixtures["drop_list"]),
        "--pgm-dtl", str(fixtures["pgm_dtl"]),
        "--crosswalk-dir", str(fixtures["crosswalks"]),
        "--out-dir", str(fixtures["out_dir"]),
    ]

    with pytest.raises(SystemExit) as exc:
        MOD.main(list(base_argv))
    assert exc.value.code == 1

    rc = MOD.main([*base_argv, "--allow-uncovered-tables"])
    assert rc == 0
    coverage = (fixtures["out_dir"] / "source_target_columns_coverage.adoc").read_text()
    assert "MySQL tables not yet covered" in coverage
    assert "Tables awaiting SME mapping" in coverage
    assert "`uncovered_x`" in coverage


def test_allow_missing_mysql_mmd_writes_stubs(fixtures: dict[str, Path], tmp_path: Path) -> None:
    nonexistent_mmd = tmp_path / "nope.mmd"
    csv_path = tmp_path / "mapping.csv"
    csv_path.write_text(GOOD_CSV, encoding="utf-8")

    argv = [
        "--mysql-mmd", str(nonexistent_mmd),
        "--demos-mmd", str(fixtures["demos_mmd"]),
        "--csv", str(csv_path),
        "--drop-list", str(fixtures["drop_list"]),
        "--pgm-dtl", str(fixtures["pgm_dtl"]),
        "--crosswalk-dir", str(fixtures["crosswalks"]),
        "--out-dir", str(fixtures["out_dir"]),
        "--allow-missing-mysql-mmd",
    ]
    rc = MOD.main(argv)
    assert rc == 0
    for name in (
        "source_target_columns_table.adoc",
        "source_target_columns_sections.adoc",
        "source_target_columns_coverage.adoc",
    ):
        body = (fixtures["out_dir"] / name).read_text()
        assert "is not yet in the workspace" in body
