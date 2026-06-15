#!/usr/bin/env python3

from __future__ import annotations

import argparse
import csv
import json
import sys
import uuid
from pathlib import Path


# Every exported CSV that participates in the clone must be rewritten together so
# foreign-key references continue to line up after UUID remapping.
CSV_FILES = [
    "amendment.csv",
    "application.csv",
    "application_date.csv",
    "application_note.csv",
    "application_phase.csv",
    "application_tag_assignment.csv",
    "budget_neutrality_workbook.csv",
    "deliverable.csv",
    "deliverable_action.csv",
    "deliverable_active_extension.csv",
    "deliverable_demonstration_type.csv",
    "deliverable_extension.csv",
    "demonstration.csv",
    "demonstration_role_assignment.csv",
    "demonstration_type_tag_assignment.csv",
    "document.csv",
    "extension.csv",
    "primary_demonstration_role_assignment.csv",
    "private_comment.csv",
    "public_comment.csv",
    "tag.csv",
    "tag_name.csv",
]

# Only rows with synthetic IDs that must become new records in the target environment
# seed the UUID map. Other tables are rewritten transitively when they reference them.
ID_SOURCES = {
    "application.csv": "id",
    "deliverable.csv": "id",
    "deliverable_action.csv": "id",
    "deliverable_extension.csv": "id",
    "document.csv": "id",
    "private_comment.csv": "id",
    "public_comment.csv": "id",
}

# demonstration.csv intentionally excludes identifiers that should not be cloned into a
# new environment as part of this workflow.
DROP_COLUMNS = {
    "demonstration.csv": {"medicaid_id", "chip_id"},
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Replace synthetic UUIDs across exported UAT CSVs with fresh values.")
    parser.add_argument("--source", required=True, help="Directory containing the exported CSVs.")
    parser.add_argument(
        "--target",
        required=True,
        help="Directory to write remapped CSVs into.",
    )
    parser.add_argument(
        "--manifest",
        required=True,
        help="Path for the generated old-to-new UUID manifest.",
    )
    parser.add_argument(
        "--s3-mapping",
        required=True,
        help="Path for the generated old/new s3_path mapping CSV.",
    )
    return parser.parse_args()


def read_csv(path: Path) -> tuple[list[str], list[dict[str, str]]]:
    with path.open("r", newline="", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        if reader.fieldnames is None:
            raise ValueError(f"CSV has no header: {path}")
        return list(reader.fieldnames), list(reader)


def write_csv(path: Path, fieldnames: list[str], rows: list[dict[str, str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def build_uuid_map(source_dir: Path) -> dict[str, str]:
    # Generate one stable old->new UUID map up front so every CSV is rewritten against
    # the same set of replacements.
    uuid_map: dict[str, str] = {}
    for file_name, id_column in ID_SOURCES.items():
        _, rows = read_csv(source_dir / file_name)
        for row in rows:
            original_id = row.get(id_column, "")
            if original_id and original_id not in uuid_map:
                uuid_map[original_id] = str(uuid.uuid4())
    return uuid_map


def remap_value(value: str, uuid_map: dict[str, str]) -> str:
    # UUIDs also appear inside composite strings such as s3_path, so remap by string
    # replacement rather than only by exact field match.
    updated = value
    for old_uuid, new_uuid in uuid_map.items():
        updated = updated.replace(old_uuid, new_uuid)
    return updated


def main() -> int:
    args = parse_args()
    source_dir = Path(args.source)
    target_dir = Path(args.target)
    manifest_path = Path(args.manifest)
    s3_mapping_path = Path(args.s3_mapping)

    if not source_dir.is_dir():
        print(f"Source directory not found: {source_dir}", file=sys.stderr)
        return 1

    uuid_map = build_uuid_map(source_dir)
    # document.csv drives both the row rewrite and the old/new S3 key mapping used by
    # the separate object-copy step.
    s3_mappings: list[dict[str, str]] = []

    loaded_files: dict[str, tuple[list[str], list[dict[str, str]]]] = {}
    for file_name in CSV_FILES:
        file_path = source_dir / file_name
        if not file_path.exists():
            print(f"Missing expected CSV: {file_path}", file=sys.stderr)
            return 1
        loaded_files[file_name] = read_csv(file_path)

    for file_name, (fieldnames, rows) in loaded_files.items():
        kept_fieldnames = [name for name in fieldnames if name not in DROP_COLUMNS.get(file_name, set())]
        updated_rows: list[dict[str, str]] = []
        for row in rows:
            updated_row: dict[str, str] = {}
            for field_name in kept_fieldnames:
                updated_row[field_name] = remap_value(row.get(field_name, ""), uuid_map)
            updated_rows.append(updated_row)
            if file_name == "document.csv":
                s3_mappings.append(
                    {
                        "old_s3_path": row.get("s3_path", ""),
                        "new_s3_path": updated_row.get("s3_path", ""),
                    }
                )
        write_csv(target_dir / file_name, kept_fieldnames, updated_rows)

    # Persist both the UUID manifest and the S3 key mapping so later steps can inspect
    # or replay the clone deterministically.
    manifest_path.write_text(json.dumps(uuid_map, indent=2, sort_keys=True) + "\n", encoding="utf-8")

    s3_mapping_path.parent.mkdir(parents=True, exist_ok=True)
    with s3_mapping_path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=["old_s3_path", "new_s3_path"])
        writer.writeheader()
        writer.writerows(s3_mappings)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
