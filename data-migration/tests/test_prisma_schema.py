"""Tests for migration.prisma_schema (pure-Python .prisma parser)."""

from __future__ import annotations

from migration.prisma_schema import parse_prisma_schema

_SCHEMA = """
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

/// A demonstration.
model Demonstration {
  id        String   @id @default(uuid()) @db.Uuid
  name      String   @map("demonstration_name")
  stateId   String   @map("state_id") @db.Uuid
  state     State    @relation("DemoState", fields: [stateId], references: [id], onDelete: Restrict, onUpdate: Cascade)
  bundles   Bundle[] // back-relation, no fields/references
  @@map("demonstration")
  @@unique([name, stateId])
}

model State {
  id    String @id @db.Uuid
  @@map("state")
}

enum DemoStatus {
  PENDING
  APPROVED
  @@map("demonstration_status")
}
"""


def test_parses_models_and_table_map() -> None:
    schema = parse_prisma_schema(_SCHEMA)
    assert set(schema.models) == {"Demonstration", "State"}
    assert schema.models["Demonstration"].table == "demonstration"
    assert schema.models["State"].table == "state"


def test_field_column_mapping() -> None:
    demo = parse_prisma_schema(_SCHEMA).models["Demonstration"]
    cols = demo.field_to_column()
    assert cols["name"] == "demonstration_name"
    assert cols["stateId"] == "state_id"
    # No @map -> field name is the column.
    assert cols["id"] == "id"


def test_relation_parsed_with_actions() -> None:
    demo = parse_prisma_schema(_SCHEMA).models["Demonstration"]
    rel = next(f.relation for f in demo.fields if f.name == "state")
    assert rel is not None
    assert rel.name == "DemoState"
    assert rel.fields == ["stateId"]
    assert rel.references == ["id"]
    assert rel.on_delete == "Restrict"
    assert rel.on_update == "Cascade"


def test_resolved_relations_use_mapped_names() -> None:
    resolved = parse_prisma_schema(_SCHEMA).resolved_relations()
    assert len(resolved) == 1
    r = resolved[0]
    assert r.from_table == "demonstration"
    assert r.from_columns == ["state_id"]
    assert r.to_table == "state"
    assert r.to_columns == ["id"]
    assert r.name == "DemoState"


def test_back_relation_is_skipped() -> None:
    # `bundles Bundle[]` has a @relation-free list field and Bundle is not a
    # defined model here; it must not produce a resolved relation.
    resolved = parse_prisma_schema(_SCHEMA).resolved_relations()
    assert all(r.from_table == "demonstration" for r in resolved)


def test_enum_parsed_with_map() -> None:
    enums = parse_prisma_schema(_SCHEMA).enums
    assert "DemoStatus" in enums
    assert enums["DemoStatus"].mapped == "demonstration_status"
    assert enums["DemoStatus"].values == ["PENDING", "APPROVED"]


def test_composite_relation() -> None:
    schema = parse_prisma_schema(
        """
        model Child {
          aId String @map("a_id")
          bId String @map("b_id")
          parent Parent @relation(fields: [aId, bId], references: [x, y])
          @@map("child")
        }
        model Parent {
          x String @map("p_x")
          y String @map("p_y")
          @@map("parent")
        }
        """
    )
    resolved = schema.resolved_relations()
    assert len(resolved) == 1
    r = resolved[0]
    assert r.from_columns == ["a_id", "b_id"]
    assert r.to_columns == ["p_x", "p_y"]


def test_model_without_block_map_defaults_to_model_name() -> None:
    schema = parse_prisma_schema("model Foo {\n  id String @id\n}\n")
    assert schema.models["Foo"].table == "Foo"


def test_relation_with_default_having_braces_does_not_break_block() -> None:
    # @default with nested parens/braces must not confuse block-end detection.
    schema = parse_prisma_schema(
        """
        model A {
          id   String @id @default(dbgenerated("gen_random_uuid()"))
          bId  String @map("b_id")
          b    B      @relation(fields: [bId], references: [id])
          @@map("a")
        }
        model B {
          id String @id
          @@map("b")
        }
        """
    )
    assert set(schema.models) == {"A", "B"}
    assert schema.resolved_relations()[0].to_table == "b"


def test_comment_only_and_empty_input() -> None:
    assert parse_prisma_schema("").models == {}
    assert parse_prisma_schema("// just a comment\n").models == {}
