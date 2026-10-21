"""Generate the DEMOS DataConnect data-dictionary Excel workbook.

Usage:
    (cd lambdas/dataConnectExport && npm run dictionary:contract)
    uv run --with openpyxl python \
      data/demos_data_tools/data_dictionary_to_xlsx.py

Arguments:
    output_path: Path to data dictionary save folder
    --contract:  Path to the JSON reporting contract file

Returns:
    demos_data_dictionary.xlsx
"""

from __future__ import annotations

import argparse
import json
import re
from collections.abc import Callable, Iterable, Mapping
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path
from typing import Any, TypeVar
from zipfile import ZIP_DEFLATED, ZipFile, ZipInfo

from openpyxl import Workbook
from openpyxl.styles import Alignment, Font, PatternFill
from openpyxl.utils import get_column_letter

REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_CONTRACT = REPO_ROOT / "data" / "docs" / "dataconnect_reporting_contract.json"
DEFAULT_OUTPUT = REPO_ROOT / "data" / "docs" / "demos_data_dictionary.xlsx"
CONTRACT_FORMAT_VERSION = 2

HEADER_FILL = PatternFill("solid", fgColor="D9E2F3")
HEADER_FONT = Font(bold=True)
SECTION_FILL = PatternFill("solid", fgColor="FFE699")
SECTION_FONT = Font(bold=True, italic=True)
NOTE_FONT = Font(italic=True, color="555555")
LABEL_FONT = Font(bold=True)
WRAP = Alignment(wrap_text=True, vertical="top")
FIXED_TIMESTAMP = datetime(2000, 1, 1, tzinfo=UTC)

_MODIFIED_TIMESTAMP_RE = re.compile(rb"(<dcterms:modified\b[^>]*>).*?(</dcterms:modified>)")
_JSON_VALUE_TYPES = {
    "BIGINT": "number",
    "BOOLEAN": "boolean",
    "DATE": "string",
    "DOUBLE": "number",
    "FLOAT": "number",
    "INTEGER": "number",
    "JSON": "JSON",
    "SMALLINT": "number",
    "TIMESTAMP_MS": "string",
    "TIMESTAMPTZ": "string",
    "UUID": "string",
    "VARCHAR": "string",
}


class ContractError(ValueError):
    """Raised when the reporting contract is malformed or incomplete."""


@dataclass(frozen=True)
class CollectionSpec:
    """Documented element shape of a JSON-array column."""

    row_grain: str
    columns: tuple[FieldSpec, ...]


@dataclass(frozen=True)
class FieldSpec:
    """One documented export column or JSON-object field."""

    name: str
    duckdb_type: str
    description: str
    nullable: bool
    source_report: str = ""
    format: str = ""
    notes: str = ""
    items: CollectionSpec | None = None


@dataclass(frozen=True)
class SourceTableSpec:
    """Supplemental purpose of one underlying demos_app table."""

    name: str
    purpose: str


@dataclass(frozen=True)
class DatasetSpec:
    """One exported DataConnect dataset."""

    name: str
    description: str
    row_grain: str
    key_columns: tuple[str, ...]
    columns: tuple[FieldSpec, ...]
    source_tables: tuple[SourceTableSpec, ...]


@dataclass(frozen=True)
class ReportingContract:
    """Contents of the generated reporting contract."""

    format_version: int
    datasets: tuple[DatasetSpec, ...]


_REGENERATE = "regenerate it with npm run dictionary:contract in lambdas/dataConnectExport"
_MALFORMED_ERRORS = (AttributeError, KeyError, TypeError)
_T = TypeVar("_T")


def _parse_each(values: Iterable[Any], path: str, parse: Callable[[Any], _T]) -> tuple[_T, ...]:
    """Parse each entry, noting the failing entry's location on the error before re-raising it.

    Args:
        values (Iterable[Any]): Decoded JSON entries to parse.
        path (str): Contract location of the entries, used in the error note.
        parse (Callable[[Any], _T]): Parser applied to each entry.

    Returns:
        tuple[_T, ...]: The parsed entries, in order.

    Raises:
        _MALFORMED_ERRORS: Re-raised from parse, with the failing entry's location noted.
    """
    parsed = []
    for index, value in enumerate(values):
        try:
            parsed.append(parse(value))
        except _MALFORMED_ERRORS as error:
            name = value.get("name") if isinstance(value, dict) else None
            error.add_note(f"in {path}[{index}]" + (f" ({name})" if isinstance(name, str) else ""))
            raise
    return tuple(parsed)


def _parse_field(field: Mapping[str, Any]) -> FieldSpec:
    items = field.get("items")
    return FieldSpec(
        name=field["name"],
        duckdb_type=field["duckdbType"],
        description=field["description"],
        nullable=field["nullable"],
        source_report=field.get("sourceReport", ""),
        format=field.get("format", ""),
        notes=field.get("notes", ""),
        items=None
        if items is None
        else CollectionSpec(
            row_grain=items["rowGrain"],
            columns=_parse_each(items["columns"], "items.columns", _parse_field),
        ),
    )


def _parse_dataset(dataset: Mapping[str, Any]) -> DatasetSpec:
    return DatasetSpec(
        name=dataset["name"],
        description=dataset["description"],
        row_grain=dataset["rowGrain"],
        key_columns=tuple(dataset["keyColumns"]),
        columns=_parse_each(dataset["columns"], "columns", _parse_field),
        source_tables=_parse_each(
            dataset["sourceTables"],
            "sourceTables",
            lambda table: SourceTableSpec(name=table["name"], purpose=table["purpose"]),
        ),
    )


def parse_contract(value: Any) -> ReportingContract:
    """Read a decoded reporting contract.

    The TypeScript generator validates the contract and its committed bytes are checked for
    freshness, so only the format version is checked here; any other shape problem is reported
    as a malformed contract.

    Args:
        value (Any): Decoded JSON contract.

    Returns:
        ReportingContract: The parsed contract.

    Raises:
        ContractError: If the contract is malformed or an unsupported version.
    """
    if not isinstance(value, dict):
        raise ContractError(f"reporting contract must be a JSON object; {_REGENERATE}")
    version = value.get("formatVersion")
    if type(version) is int and version == 1:
        raise ContractError(
            "unsupported contract formatVersion: 1 (expected 2). "
            "Regenerate the contract with npm run dictionary:contract in lambdas/dataConnectExport."
        )
    if type(version) is not int or version != CONTRACT_FORMAT_VERSION:
        raise ContractError(f"unsupported contract formatVersion: {version!r} (expected {CONTRACT_FORMAT_VERSION})")
    try:
        datasets = _parse_each(value["datasets"], "datasets", _parse_dataset)
    except _MALFORMED_ERRORS as error:
        # Notes run innermost first and are only printed in tracebacks, so copy them into the message for the CLI.
        location = "; ".join(getattr(error, "__notes__", []))
        detail = f"{error!r} {location}" if location else repr(error)
        raise ContractError(f"reporting contract is malformed ({detail}); {_REGENERATE}") from error
    return ReportingContract(format_version=version, datasets=datasets)


def load_contract(path: Path = DEFAULT_CONTRACT) -> ReportingContract:
    """Read and validate the generated reporting contract.

    Args:
        path (Path): Location of the generated JSON contract.

    Returns:
        ReportingContract: The validated contract.

    Raises:
        ContractError: If the file is missing, is not JSON, or fails validation.
    """
    try:
        text = path.read_text(encoding="utf-8")
    except FileNotFoundError as error:
        raise ContractError(
            f"reporting contract not found: {path}. Run npm run dictionary:contract in lambdas/dataConnectExport."
        ) from error
    try:
        value = json.loads(text)
    except json.JSONDecodeError as error:
        raise ContractError(f"reporting contract is not valid JSON: {error}") from error
    return parse_contract(value)


def _short_tab_name(name: str, used: set[str]) -> str:
    if len(name) <= 31 and name not in used:
        return name
    abbreviations = [
        ("budget_neutrality", "bn"),
        ("demonstration", "demo"),
        ("application", "app"),
        ("deliverable", "dlv"),
        ("extension", "ext"),
        ("assignment", "asgn"),
        ("configuration", "cfg"),
        ("permission", "perm"),
        ("suggestion", "sug"),
    ]
    candidate = name
    for full, short in abbreviations:
        if len(candidate) <= 31 and candidate not in used:
            break
        candidate = candidate.replace(full, short)
    candidate = candidate[:31]
    suffix = 1
    while candidate in used:
        marker = f"_{suffix}"
        candidate = f"{candidate[: 31 - len(marker)]}{marker}"
        suffix += 1
    return candidate


def _set_widths(worksheet, widths: Iterable[int]) -> None:
    for index, width in enumerate(widths, start=1):
        worksheet.column_dimensions[get_column_letter(index)].width = width


def _write_header(worksheet, row: int, headers: Iterable[str]) -> None:
    for column, value in enumerate(headers, start=1):
        cell = worksheet.cell(row=row, column=column, value=value)
        cell.fill = HEADER_FILL
        cell.font = HEADER_FONT
        cell.alignment = WRAP


def _write_section(worksheet, row: int, label: str, width: int) -> None:
    worksheet.merge_cells(start_row=row, start_column=1, end_row=row, end_column=width)
    cell = worksheet.cell(row=row, column=1, value=label)
    cell.fill = SECTION_FILL
    cell.font = SECTION_FONT


def _write_link(worksheet, row: int, column: int, tab_name: str, label: str | None = None) -> None:
    cell = worksheet.cell(row=row, column=column, value=label or tab_name)
    cell.hyperlink = f"#'{tab_name}'!A1"
    cell.style = "Hyperlink"


def _write_properties(worksheet, rows: Iterable[tuple[str, str]], width: int) -> int:
    row = 0
    for row, (label, value) in enumerate(rows, start=1):
        worksheet.cell(row=row, column=1, value=label).font = LABEL_FONT
        worksheet.merge_cells(start_row=row, start_column=2, end_row=row, end_column=width)
        worksheet.cell(row=row, column=2, value=value).alignment = WRAP
    return row


def _json_value_type(field: FieldSpec) -> str:
    value_type = "number" if field.duckdb_type.startswith("DECIMAL") else _JSON_VALUE_TYPES[field.duckdb_type]
    return f"{value_type} or null" if field.nullable else value_type


def _empty_behavior(field: FieldSpec) -> str:
    if field.nullable:
        return "JSON array; [] when there are no matching rows, or NULL."
    return "Always a JSON array; [] when there are no matching rows, never NULL or [null]."


def _parent_linkage(dataset: DatasetSpec, field: FieldSpec) -> str:
    keys = ", ".join(dataset.key_columns)
    return (
        f"Each element belongs to exactly one {dataset.name} row, identified by {keys}, and is stored inside "
        f"that row's {field.name} column. Expand the array (for example json_each({field.name})) to obtain one "
        f"row per element; elements repeat parent context fields rather than carrying {keys}."
    )


def _collection_tabs(dataset_tabs: list[tuple[str, DatasetSpec]], used: set[str]) -> dict[tuple[str, str], str]:
    tabs = {}
    for _, dataset in dataset_tabs:
        for field in dataset.columns:
            if field.items is not None:
                tab_name = _short_tab_name(field.name, used)
                used.add(tab_name)
                tabs[(dataset.name, field.name)] = tab_name
    return tabs


def _write_overview(
    workbook: Workbook,
    contract_label: str,
    dataset_tabs: list[tuple[str, DatasetSpec]],
    collection_tabs: Mapping[tuple[str, str], str],
) -> None:
    worksheet = workbook.create_sheet("Overview")
    worksheet.freeze_panes = "A4"
    worksheet.cell(row=1, column=1, value="DEMOS DataConnect reporting data dictionary").font = Font(bold=True, size=14)
    worksheet.cell(
        row=2,
        column=1,
        value=(
            f"Source: {contract_label}, generated from EXPORT_VIEWS in lambdas/dataConnectExport/views.ts. "
            "Documents the exported reporting contract with supplemental source-table context on the Source Tables tab; "
            "JSON collections are stored as JSON-array columns, not nested Parquet structures."
        ),
    ).font = NOTE_FONT
    worksheet.cell(row=2, column=1).alignment = WRAP
    worksheet.merge_cells(start_row=2, start_column=1, end_row=2, end_column=7)
    _write_header(
        worksheet, 3, ["Tab", "Kind", "Path", "Row grain", "Identity / parent linkage", "Fields", "Description"]
    )
    _set_widths(worksheet, [24, 16, 42, 60, 48, 9, 80])
    row = 4
    for tab_name, dataset in dataset_tabs:
        _write_link(worksheet, row, 1, tab_name)
        worksheet.cell(row=row, column=2, value="Dataset")
        worksheet.cell(row=row, column=3, value=f"{dataset.name}/dt=YYYY-MM-DD/part-000.parquet").alignment = WRAP
        worksheet.cell(row=row, column=4, value=dataset.row_grain).alignment = WRAP
        worksheet.cell(row=row, column=5, value=f"Key: {', '.join(dataset.key_columns)}").alignment = WRAP
        worksheet.cell(row=row, column=6, value=len(dataset.columns))
        worksheet.cell(row=row, column=7, value=dataset.description).alignment = WRAP
        row += 1
        for field in dataset.columns:
            if field.items is None:
                continue
            collection_tab = collection_tabs[(dataset.name, field.name)]
            _write_link(worksheet, row, 1, collection_tab)
            worksheet.cell(row=row, column=2, value="JSON collection")
            worksheet.cell(row=row, column=3, value=f"{dataset.name}.{field.name}[]")
            worksheet.cell(row=row, column=4, value=field.items.row_grain).alignment = WRAP
            worksheet.cell(
                row=row, column=5, value=f"Nested in {dataset.name} by {', '.join(dataset.key_columns)}"
            ).alignment = WRAP
            worksheet.cell(row=row, column=6, value=len(field.items.columns))
            worksheet.cell(row=row, column=7, value=field.description).alignment = WRAP
            row += 1
    _write_link(worksheet, row, 1, "Source Tables")
    worksheet.cell(row=row, column=2, value="Source context")
    worksheet.cell(
        row=row, column=7, value="Purposes of underlying demos_app tables; not additional exported datasets or field-level lineage."
    ).alignment = WRAP


def _write_source_tables(workbook: Workbook, dataset_tabs: list[tuple[str, DatasetSpec]]) -> None:
    worksheet = workbook.create_sheet("Source Tables")
    worksheet.cell(row=1, column=1, value="DEMOS DataConnect source-table context").font = Font(bold=True, size=14)
    worksheet.merge_cells(start_row=2, start_column=1, end_row=2, end_column=3)
    cell = worksheet.cell(
        row=2,
        column=1,
        value=(
            "Supplemental source context: underlying demos_app tables, not separately published Parquet datasets, "
            "not complete database-model documentation, and not field-level lineage."
        ),
    )
    cell.font = NOTE_FONT
    cell.alignment = WRAP
    _write_link(worksheet, 3, 1, "Overview", "Back to Overview")
    _write_header(worksheet, 4, ["Dataset", "Source table", "Purpose"])
    _set_widths(worksheet, [32, 44, 100])
    worksheet.freeze_panes = "A5"
    row = 5
    for tab_name, dataset in dataset_tabs:
        for table in sorted(dataset.source_tables, key=lambda table: table.name):
            _write_link(worksheet, row, 1, tab_name, dataset.name)
            worksheet.cell(row=row, column=1).alignment = WRAP
            worksheet.cell(row=row, column=2, value=table.name).alignment = WRAP
            purpose = worksheet.cell(row=row, column=3, value=table.purpose)
            purpose.data_type = "s"
            purpose.alignment = WRAP
            row += 1


_FIELD_HEADERS = [
    "#",
    "Field",
    "Export type",
    "Nullable",
    "Source report",
    "Format",
    "Description",
    "Transformation / notes",
]
_FIELD_WIDTHS = [5, 44, 16, 10, 30, 30, 60, 90]


def _write_field_rows(worksheet, row: int, fields: Iterable[FieldSpec], *, path_prefix: str = "") -> int:
    for index, field in enumerate(fields, start=1):
        worksheet.cell(row=row, column=1, value=index)
        worksheet.cell(row=row, column=2, value=f"{path_prefix}{field.name}")
        worksheet.cell(row=row, column=3, value=field.duckdb_type if not path_prefix else _json_value_type(field))
        worksheet.cell(row=row, column=4, value="Y" if field.nullable else "N")
        worksheet.cell(row=row, column=5, value=field.source_report).alignment = WRAP
        worksheet.cell(row=row, column=6, value=field.format).alignment = WRAP
        worksheet.cell(row=row, column=7, value=field.description).alignment = WRAP
        worksheet.cell(row=row, column=8, value=field.notes).alignment = WRAP
        row += 1
    return row


def _write_dataset_sheet(
    workbook: Workbook,
    tab_name: str,
    dataset: DatasetSpec,
    collection_tabs: Mapping[tuple[str, str], str],
) -> None:
    worksheet = workbook.create_sheet(tab_name)
    _set_widths(worksheet, _FIELD_WIDTHS)
    row = _write_properties(
        worksheet,
        [
            ("Dataset", dataset.name),
            ("Row grain", dataset.row_grain),
            ("Identity", ", ".join(dataset.key_columns)),
            ("Description", dataset.description),
            ("Export types", "Logical DuckDB/Parquet column types; JSON columns hold JSON arrays."),
            ("Source tables", "Source Tables"),
        ],
        len(_FIELD_HEADERS),
    )
    _write_link(worksheet, row, 2, "Source Tables")
    worksheet.cell(row=row, column=2).alignment = WRAP
    row += 1
    _write_header(worksheet, row, _FIELD_HEADERS)
    worksheet.freeze_panes = f"A{row + 1}"
    _write_field_rows(worksheet, row + 1, dataset.columns)
    for offset, field in enumerate(dataset.columns, start=row + 1):
        if field.items is not None:
            _write_link(worksheet, offset, 2, collection_tabs[(dataset.name, field.name)], field.name)


def _write_collection_sheet(workbook: Workbook, tab_name: str, dataset: DatasetSpec, field: FieldSpec) -> None:
    assert field.items is not None
    worksheet = workbook.create_sheet(tab_name)
    _set_widths(worksheet, _FIELD_WIDTHS)
    row = _write_properties(
        worksheet,
        [
            ("Collection", f"{dataset.name}.{field.name}"),
            ("Item grain", field.items.row_grain),
            ("Parent linkage", _parent_linkage(dataset, field)),
            ("Empty behavior", _empty_behavior(field)),
            ("Description", field.description),
            ("Collection notes", field.notes),
            ("Field types", "JSON value types of each object member; values are not native nested Parquet columns."),
        ],
        len(_FIELD_HEADERS),
    )
    _write_link(worksheet, row + 1, 1, "Overview", "Back to Overview")
    row += 3
    _write_section(worksheet, row - 1, f"Fields of each {field.name}[] element", len(_FIELD_HEADERS))
    _write_header(worksheet, row, _FIELD_HEADERS)
    worksheet.freeze_panes = f"A{row + 1}"
    _write_field_rows(worksheet, row + 1, field.items.columns, path_prefix=f"{field.name}[].")


def _normalize_xlsx(path: Path) -> None:
    temporary_path = path.with_suffix(".normalized.xlsx")
    try:
        with (
            ZipFile(path, "r") as source,
            ZipFile(
                temporary_path,
                "w",
                compression=ZIP_DEFLATED,
                compresslevel=9,
            ) as destination,
        ):
            for name in sorted(source.namelist()):
                contents = source.read(name)
                if name == "docProps/core.xml":
                    contents, replacements = _MODIFIED_TIMESTAMP_RE.subn(
                        rb"\g<1>2000-01-01T00:00:00Z\g<2>",
                        contents,
                    )
                    if replacements != 1:
                        raise RuntimeError("expected one modified timestamp in docProps/core.xml")
                info = ZipInfo(name, date_time=(2000, 1, 1, 0, 0, 0))
                info.compress_type = ZIP_DEFLATED
                info.external_attr = 0o600 << 16
                destination.writestr(info, contents)
        temporary_path.replace(path)
    except BaseException:
        temporary_path.unlink(missing_ok=True)
        raise


def write_workbook(
    contract: ReportingContract,
    output_path: Path,
    *,
    contract_label: str = "data/docs/dataconnect_reporting_contract.json",
) -> None:
    """Write a deterministic Excel workbook for a validated reporting contract."""
    workbook = Workbook()
    workbook.remove(workbook.active)
    workbook.properties.creator = "Enterprise-CMCS DEMOS"
    workbook.properties.lastModifiedBy = "Enterprise-CMCS DEMOS"
    workbook.properties.created = FIXED_TIMESTAMP
    workbook.properties.modified = FIXED_TIMESTAMP

    used_tabs = {"Overview", "Source Tables"}
    dataset_tabs = []
    for dataset in contract.datasets:
        tab_name = _short_tab_name(dataset.name, used_tabs)
        used_tabs.add(tab_name)
        dataset_tabs.append((tab_name, dataset))
    collection_tabs = _collection_tabs(dataset_tabs, used_tabs)

    _write_overview(workbook, contract_label, dataset_tabs, collection_tabs)
    _write_source_tables(workbook, dataset_tabs)
    for tab_name, dataset in dataset_tabs:
        _write_dataset_sheet(workbook, tab_name, dataset, collection_tabs)
        for field in dataset.columns:
            if field.items is not None:
                _write_collection_sheet(workbook, collection_tabs[(dataset.name, field.name)], dataset, field)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    staged_path = output_path.with_suffix(".staged.xlsx")
    try:
        workbook.save(staged_path)
        _normalize_xlsx(staged_path)
        staged_path.replace(output_path)
    finally:
        staged_path.unlink(missing_ok=True)


def build_dictionary(
    output_path: Path = DEFAULT_OUTPUT,
    contract_path: Path = DEFAULT_CONTRACT,
) -> tuple[int, int, int]:
    """Validate the reporting contract and write the workbook.

    Args:
        output_path (Path): Workbook destination.
        contract_path (Path): Generated JSON reporting contract.

    Returns:
        tuple[int, int, int]: Counts of datasets, top-level columns, and nested collection fields.
    """
    contract = load_contract(contract_path)
    try:
        label = contract_path.resolve().relative_to(REPO_ROOT).as_posix()
    except ValueError:
        label = contract_path.name
    write_workbook(contract, output_path, contract_label=label)
    columns = [column for dataset in contract.datasets for column in dataset.columns]
    return (
        len(contract.datasets),
        len(columns),
        sum(len(column.items.columns) for column in columns if column.items is not None),
    )


def _confined_path(raw_path: str) -> Path:
    path = Path(raw_path)
    if not path.is_absolute():
        path = REPO_ROOT / path
    resolved = path.resolve()
    if not resolved.is_relative_to(REPO_ROOT):
        raise SystemExit(f"refusing path outside repository: {resolved}")
    return resolved


def main(argv: Iterable[str] | None = None) -> int:
    """Run the data-dictionary generator.

    Args:
        argv (Iterable[str] | None): Command-line arguments, excluding the program name.

    Returns:
        int: Process exit code.

    Raises:
        SystemExit: If the contract is invalid or a path is outside the repository.
    """
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument(
        "output_path",
        nargs="?",
        default=str(DEFAULT_OUTPUT),
        help="Output workbook path (default: data/docs/demos_data_dictionary.xlsx).",
    )
    parser.add_argument(
        "--contract",
        default=str(DEFAULT_CONTRACT),
        help="Generated reporting contract (default: data/docs/dataconnect_reporting_contract.json).",
    )
    args = parser.parse_args(None if argv is None else list(argv))
    output_path = _confined_path(args.output_path)
    contract_path = _confined_path(args.contract)
    try:
        dataset_count, column_count, nested_count = build_dictionary(output_path, contract_path)
    except ContractError as error:
        raise SystemExit(f"invalid reporting contract: {error}") from error
    print(f"Wrote {output_path} ({dataset_count} datasets, {column_count} columns, {nested_count} collection fields)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
