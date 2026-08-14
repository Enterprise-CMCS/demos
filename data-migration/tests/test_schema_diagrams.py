"""Unit tests for the pure helpers in docs/tools/schema_diagrams_to_adoc.py.

The generator lives under docs/tools (not an installed package), so it is
imported here by path. These tests cover the DDL/FK parsing, structural
classification + override precedence, cardinality derivation, history
exclusion, the hand-model parser (whose brace handling must survive
crow's-foot cardinality tokens), and source-overview grouping.
"""

from __future__ import annotations

import importlib.util
import sys
from pathlib import Path

import pytest

_TOOLS_DIR = Path(__file__).resolve().parents[1] / "docs" / "tools"
sys.path.insert(0, str(_TOOLS_DIR))


def _load(name: str):
    spec = importlib.util.spec_from_file_location(name, _TOOLS_DIR / f"{name}.py")
    assert spec is not None
    assert spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


# Parsing/classification moved into the shared schema_model module; the diagram
# renderers (cardinality, clusters, source overview, hand-model drift) stay in
# schema_diagrams_to_adoc.
sm = _load("schema_model")
sd = _load("schema_diagrams_to_adoc")


DDL = '''
SET search_path TO demos_app;

CREATE TABLE "application" (
    "id" UUID NOT NULL,
    "application_type_id" TEXT NOT NULL,

    CONSTRAINT "application_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "application_history" (
    "revision_id" SERIAL NOT NULL,
    "id" UUID NOT NULL,

    CONSTRAINT "application_history_pkey" PRIMARY KEY ("revision_id")
);

CREATE TABLE "application_status" (
    "id" TEXT NOT NULL,

    CONSTRAINT "application_status_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "amendment_application_type_limit" (
    "id" TEXT NOT NULL,

    CONSTRAINT "amendment_application_type_limit_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "application_phase" (
    "application_id" UUID NOT NULL,
    "phase_id" TEXT NOT NULL,
    "note" TEXT,

    CONSTRAINT "application_phase_pkey" PRIMARY KEY ("application_id","phase_id")
);

CREATE UNIQUE INDEX "application_id_application_type_id_key" ON "application"("id", "application_type_id");
'''


def test_parse_prisma_ddl_excludes_history_and_reads_pk_unique() -> None:
    tables = sm.parse_prisma_ddl(DDL)
    assert "application_history" not in tables
    assert set(tables) == {
        "application",
        "application_status",
        "amendment_application_type_limit",
        "application_phase",
    }
    app = tables["application"]
    assert app.pk == ["id"]
    assert [c.name for c in app.columns] == ["id", "application_type_id"]
    assert app.column("id").type == "uuid"
    assert app.column("application_type_id").nullable is False
    assert app.uniques == [["id", "application_type_id"]]


def test_parse_type_and_mods_and_project_type() -> None:
    # double precision collapses to "double"; NOT NULL captured, no default
    t, not_null, default, _is_pk, _is_uq = sm._parse_type_and_mods("DOUBLE PRECISION NOT NULL")
    assert sm._project_type(t) == "double"
    assert not_null is True
    assert default is None
    # quoted enum type strips its quotes
    t, not_null, _default, _is_pk, _is_uq = sm._parse_type_and_mods('"revision_type_enum" NOT NULL')
    assert sm._project_type(t) == "revision_type_enum"
    assert not_null is True
    # DEFAULT expression is captured; column is nullable
    t, not_null, default, _is_pk, _is_uq = sm._parse_type_and_mods("TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP")
    assert sm._project_type(t) == "timestamptz"
    assert not_null is False
    assert default == "CURRENT_TIMESTAMP"


def test_parse_prisma_fks_filters_history_and_parses_columns() -> None:
    raw = [
        {
            "table": "application",
            "definition": 'FOREIGN KEY ("application_type_id") REFERENCES "application_type"("id") ON DELETE RESTRICT',
        },
        {
            "table": "application_history",
            "definition": 'FOREIGN KEY ("id") REFERENCES "application"("id")',
        },
    ]
    fks = sm.parse_prisma_fks(raw)
    assert len(fks) == 1
    fk = fks[0]
    assert fk.child == "application"
    assert fk.child_cols == ["application_type_id"]
    assert fk.parent == "application_type"
    assert fk.parent_cols == ["id"]


def test_classify_heuristics() -> None:
    tables = sm.parse_prisma_ddl(DDL)
    assert sm.classify(tables["amendment_application_type_limit"], {}) == "typeLimiter"
    assert sm.classify(tables["application_phase"], {}) == "associativeTable"
    assert sm.classify(tables["application_status"], {}) == "staticConstraint"
    assert sm.classify(tables["application"], {}) == "dataTable"


def test_classify_override_wins() -> None:
    tables = sm.parse_prisma_ddl(DDL)
    overrides = {"application_phase": "dataTable"}
    assert sm.classify(tables["application_phase"], overrides) == "dataTable"


def test_relationship_tokens_cardinality() -> None:
    tables = sm.parse_prisma_ddl(DDL)
    # FK on a non-unique, NOT NULL column -> mandatory parent, many children.
    fk_many = sm.FK("application", ["application_type_id"], "application_type", ["id"])
    assert sd.relationship_tokens(fk_many, tables) == ("||", "o{")

    # Add a one-to-one + nullable scenario via a synthetic table.
    t = sm.Table(
        name="profile",
        columns=[sm.Column("user_id", "uuid", True)],
        pk=["user_id"],
        uniques=[],
    )
    tables["profile"] = t
    fk_one_nullable = sm.FK("profile", ["user_id"], "users", ["id"])
    # user_id is the PK (unique) and nullable -> optional parent, single child.
    assert sd.relationship_tokens(fk_one_nullable, tables) == ("|o", "||")


def test_parse_hand_model_survives_crowsfoot_braces() -> None:
    hand = """erDiagram
  classDef dataTable stroke:green,fill:lightgreen
  classDef legend stroke:black,fill:#ddd

  tag_name ||--|{ tag : "FK072"
  tag }|--|| tag_status : "FK075"
  application }|..|| demonstration : ""

  tag:::dataTable {
    text id PK, FK "FK072: ... ||--|{ noise"
  }

  legend_box:::legend {
    text note
  }
"""
    classes, rels = sd.parse_hand_model(hand)
    assert classes == {"tag": "dataTable"}  # legend excluded
    assert frozenset({"tag_name", "tag"}) in rels
    assert frozenset({"tag", "tag_status"}) in rels
    assert frozenset({"application", "demonstration"}) in rels
    assert len(rels) == 3


def test_source_prefix_and_node_id() -> None:
    assert sd.source_prefix("geo_ansi_state_rfrnc") == "*_rfrnc"
    assert sd.source_prefix("mdcd_demo") == "mdcd"
    # The suffix group and a literal "rfrnc_*" group must not collide.
    assert sd._node_id("*_rfrnc") != sd._node_id("rfrnc")
    assert sd._node_id("*_rfrnc") == "g_star_rfrnc"


def test_render_target_cluster_is_deterministic() -> None:
    tables = sm.parse_prisma_ddl(DDL)
    classes = {n: sm.classify(t, {}) for n, t in tables.items()}
    fks = sm.parse_prisma_fks(
        [{"table": "application", "definition": 'FOREIGN KEY ("application_type_id") REFERENCES "application_type"("id")'}]
    )
    out1 = sd.render_target_cluster("dataTable", tables, classes, fks, "sha")
    out2 = sd.render_target_cluster("dataTable", tables, classes, fks, "sha")
    assert out1 == out2
    assert "erDiagram" in out1
    assert "application:::dataTable {" in out1
    assert 'application_type ||--o{ application : "application_type_id"' in out1


if __name__ == "__main__":
    raise SystemExit(pytest.main([__file__, "-v"]))
