"""A module containing tests for the data_dictionary_to_xlsx.py file."""

import copy
import json
import re
from pathlib import Path
from zipfile import ZipFile

import pytest
from openpyxl import load_workbook

import data_dictionary_to_xlsx
from data_dictionary_to_xlsx import (
    DEFAULT_CONTRACT,
    REPO_ROOT,
    ContractError,
    build_dictionary,
    main,
    parse_contract,
    write_workbook,
)

COLLECTIONS = ("applications", "deliverables", "demonstration_types")

CONTRACT = {
    "formatVersion": 2,
    "datasets": [
        {
            "name": "demonstration_reporting",
            "description": "Demonstration overview with child report rows.",
            "rowGrain": "One row per demonstration.",
            "keyColumns": ["demonstration_id"],
            "sourceTables": [
                {"name": "state", "purpose": "State and territory context."},
                {"name": "demonstration", "purpose": "Demonstration application context."},
            ],
            "columns": [
                {
                    "name": "demonstration_id",
                    "duckdbType": "UUID",
                    "description": "Stable demonstration UUID.",
                    "nullable": False,
                    "format": "UUID",
                },
                {
                    "name": "status_update_date",
                    "duckdbType": "VARCHAR",
                    "description": "Date the status was last updated.",
                    "nullable": False,
                    "sourceReport": "Demonstration Overview Report",
                    "format": "MM/DD/YYYY (America/New_York)",
                    "notes": "Converted to America/New_York before formatting.",
                },
                {
                    "name": "applications",
                    "duckdbType": "JSON",
                    "description": "Application report rows.",
                    "nullable": False,
                    "format": "JSON array",
                    "notes": "No matching applications gives [].",
                    "items": {
                        "rowGrain": "One row per application.",
                        "columns": [
                            {
                                "name": "application_type",
                                "duckdbType": "VARCHAR",
                                "description": "Demonstration, Amendment, or Renewal.",
                                "nullable": False,
                                "notes": "Extension is mapped to Renewal.",
                            },
                        ],
                    },
                },
                {
                    "name": "deliverables",
                    "duckdbType": "JSON",
                    "description": "Deliverable report rows.",
                    "nullable": False,
                    "items": {
                        "rowGrain": "One row per deliverable.",
                        "columns": [
                            {
                                "name": "effective_date",
                                "duckdbType": "VARCHAR",
                                "description": "Parent effective date.",
                                "nullable": True,
                            },
                            {
                                "name": "total_extensions_requested",
                                "duckdbType": "INTEGER",
                                "description": "Requested extension count.",
                                "nullable": False,
                            },
                            {
                                "name": "private_comments",
                                "duckdbType": "VARCHAR",
                                "description": "Aggregated private comments.",
                                "nullable": False,
                                "notes": "Truncated to 32000 characters.",
                            },
                        ],
                    },
                },
                {
                    "name": "demonstration_types",
                    "duckdbType": "JSON",
                    "description": "Demonstration type rows.",
                    "nullable": False,
                    "items": {
                        "rowGrain": "One row per type assignment.",
                        "columns": [
                            {
                                "name": "demonstration_type",
                                "duckdbType": "VARCHAR",
                                "description": "Assigned type tag.",
                                "nullable": False,
                            },
                        ],
                    },
                },
            ],
        }
    ],
}


def _contract(mutate=None):
    value = copy.deepcopy(CONTRACT)
    if mutate:
        mutate(value)
    return value


def _columns(value):
    return value["datasets"][0]["columns"]


def test_parse_contract_reads_ordered_fields_and_collections() -> None:
    contract = parse_contract(_contract())

    assert contract.format_version == 2
    dataset = contract.datasets[0]
    assert [(table.name, table.purpose) for table in dataset.source_tables] == [
        ("state", "State and territory context."),
        ("demonstration", "Demonstration application context."),
    ]
    assert dataset.key_columns == ("demonstration_id",)
    assert [column.name for column in dataset.columns] == [
        "demonstration_id",
        "status_update_date",
        *COLLECTIONS,
    ]
    assert dataset.columns[1].source_report == "Demonstration Overview Report"
    assert dataset.columns[0].notes == ""
    deliverables = dataset.columns[3].items
    assert deliverables is not None
    assert [column.name for column in deliverables.columns] == [
        "effective_date",
        "total_extensions_requested",
        "private_comments",
    ]
    assert deliverables.columns[0].nullable is True


@pytest.mark.parametrize(
    ("version", "message"),
    [
        (1, "Regenerate.*npm run dictionary:contract.*lambdas/dataConnectExport"),
        (3, r"unsupported contract formatVersion: 3 \(expected 2\)"),
    ],
)
def test_parse_contract_rejects_unsupported_versions(version: int, message: str) -> None:
    with pytest.raises(ContractError, match=message):
        parse_contract(_contract(lambda value: value.update(formatVersion=version)))


def test_malformed_contract_error_names_its_location() -> None:
    location = (
        "KeyError('description') in items.columns[0] (effective_date); "
        "in columns[3] (deliverables); in datasets[0] (demonstration_reporting)"
    )
    with pytest.raises(ContractError, match=f"malformed.*{re.escape(location)}.*regenerate it"):
        parse_contract(_contract(lambda value: _columns(value)[3]["items"]["columns"][0].pop("description")))


@pytest.mark.parametrize(
    "contract_text",
    [
        json.dumps(_contract(lambda value: _columns(value)[0].pop("name"))),
        json.dumps(_contract(lambda value: value.update(formatVersion=3))),
        "{not json",
    ],
    ids=["malformed", "unsupported-version", "not-json"],
)
@pytest.mark.parametrize("existing_output", [False, True])
def test_invalid_contract_never_creates_or_replaces_output(tmp_path: Path, contract_text, existing_output) -> None:
    contract_path = tmp_path / "contract.json"
    output = tmp_path / "uncreated" / "dictionary.xlsx"
    if existing_output:
        output.parent.mkdir()
        output.write_bytes(b"existing workbook")
    contract_path.write_text(contract_text)

    with pytest.raises(ContractError):
        build_dictionary(output, contract_path)
    if existing_output:
        assert list(output.parent.iterdir()) == [output]
        assert output.read_bytes() == b"existing workbook"
    else:
        assert not output.parent.exists()


def test_workbook_renders_dataset_and_collection_sheets(tmp_path: Path) -> None:
    output = tmp_path / "dictionary.xlsx"
    write_workbook(parse_contract(_contract()), output)

    workbook = load_workbook(output)
    assert workbook.sheetnames == ["Overview", "Source Tables", "demonstration_reporting", *COLLECTIONS]
    dataset_rows = [row[1:4] for row in workbook["demonstration_reporting"].iter_rows(values_only=True)]
    assert dataset_rows[-5:] == [
        ("demonstration_id", "UUID", "N"),
        ("status_update_date", "VARCHAR", "N"),
        ("applications", "JSON", "N"),
        ("deliverables", "JSON", "N"),
        ("demonstration_types", "JSON", "N"),
    ]
    deliverable_rows = [row[1:4] for row in workbook["deliverables"].iter_rows(values_only=True)]
    assert deliverable_rows[-3:] == [
        ("deliverables[].effective_date", "string or null", "Y"),
        ("deliverables[].total_extensions_requested", "number", "N"),
        ("deliverables[].private_comments", "string", "N"),
    ]


def test_source_purposes_are_stored_as_text_not_formulas(tmp_path: Path) -> None:
    formula = '=HYPERLINK("https://example.com", "not a formula")'
    value = _contract(lambda value: value["datasets"][0]["sourceTables"][0].update(purpose=formula))
    output = tmp_path / "dictionary.xlsx"
    write_workbook(parse_contract(value), output)

    purposes = {row[1].value: row[2] for row in load_workbook(output)["Source Tables"].iter_rows(min_row=5)}
    assert purposes["state"].value == formula
    assert purposes["state"].data_type == "s"


def test_long_dataset_names_get_unique_tab_names_and_working_links(tmp_path: Path) -> None:
    value = _contract()
    first = value["datasets"][0]
    first["name"] = "reporting_dataset_with_a_very_long_name_a"
    second = copy.deepcopy(first)
    second["name"] = "reporting_dataset_with_a_very_long_name_b"
    value["datasets"].append(second)
    output = tmp_path / "dictionary.xlsx"
    write_workbook(parse_contract(value), output)

    workbook = load_workbook(output)
    assert len(workbook.sheetnames) == len(set(workbook.sheetnames)) == 2 + 2 * (1 + len(COLLECTIONS))
    assert all(len(name) <= 31 for name in workbook.sheetnames)
    for worksheet in workbook:
        for row in worksheet:
            for cell in row:
                if cell.hyperlink:
                    assert cell.hyperlink.target[2:-4] in workbook.sheetnames


def test_workbook_output_is_byte_deterministic(tmp_path: Path) -> None:
    first = tmp_path / "first.xlsx"
    second = tmp_path / "second.xlsx"
    contract = parse_contract(_contract())

    write_workbook(contract, first)
    write_workbook(contract, second)

    assert first.read_bytes() == second.read_bytes()
    assert sorted(path.name for path in tmp_path.iterdir()) == ["first.xlsx", "second.xlsx"]


def test_failed_normalization_removes_temporary_file_and_keeps_original(tmp_path: Path, monkeypatch) -> None:
    workbook_path = tmp_path / "dictionary.xlsx"
    write_workbook(parse_contract(_contract()), workbook_path)
    original = workbook_path.read_bytes()
    real_writestr = ZipFile.writestr
    calls = []

    def failing_writestr(self, *args, **kwargs):
        calls.append(args[0])
        if len(calls) == 2:
            raise OSError("disk full")
        return real_writestr(self, *args, **kwargs)

    monkeypatch.setattr(ZipFile, "writestr", failing_writestr)
    with pytest.raises(OSError, match="disk full"):
        data_dictionary_to_xlsx._normalize_xlsx(workbook_path)

    assert len(calls) == 2
    assert workbook_path.read_bytes() == original
    assert [path.name for path in tmp_path.iterdir()] == ["dictionary.xlsx"]


def test_main_confines_contract_and_output_paths(tmp_path: Path) -> None:
    with pytest.raises(SystemExit, match="refusing path outside repository"):
        main([str(tmp_path / "dictionary.xlsx")])
    with pytest.raises(SystemExit, match="refusing path outside repository"):
        main(["data/docs/demos_data_dictionary.xlsx", "--contract", str(tmp_path / "contract.json")])
    assert list(tmp_path.iterdir()) == []


def test_committed_workbook_matches_the_real_contract(tmp_path: Path) -> None:
    committed = REPO_ROOT / "data" / "docs" / "demos_data_dictionary.xlsx"
    regenerated = tmp_path / "dictionary.xlsx"
    build_dictionary(regenerated, DEFAULT_CONTRACT)
    assert committed.read_bytes() == regenerated.read_bytes(), (
        "data/docs/demos_data_dictionary.xlsx is stale; rerun data_dictionary_to_xlsx.py"
    )
